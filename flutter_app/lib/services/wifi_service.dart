import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:network_info_plus/network_info_plus.dart';
import 'package:http/http.dart' as http;
import 'package:permission_handler/permission_handler.dart';

/// WiFi measurement service
/// Android: real RSSI via NetworkInfo + HTTP quality
/// iOS: HTTP speed/latency as quality proxy (Apple restricts RSSI)
class WifiService extends ChangeNotifier {
  // State
  bool scanning = false;
  int sigPct = 0;
  int dBm = -95;
  int? rssi; // native RSSI (Android only)
  String ssid = '';
  double rttMs = 0;
  double dlMbps = 0;
  int sampleCount = 0;

  // Internal
  Timer? _rttTimer;
  Timer? _dlTimer;
  final List<double> _rttBuf = [];
  final List<double> _dlBuf = [];
  final List<int> _sigBuf = [];
  final _networkInfo = NetworkInfoPlus();
  final _connectivity = Connectivity();
  bool _dlMeasuring = false;

  static const _rttTargets = [
    'https://1.1.1.1/cdn-cgi/trace',
    'https://dns.google/resolve?name=a.a',
  ];
  int _rttIdx = 0;

  // RSSI → signal percentage
  static int rssiToPercent(int rssi) {
    if (rssi >= -30) return 99;
    if (rssi <= -95) return 2;
    return ((rssi + 95) / 65 * 97 + 2).round();
  }

  // Signal % → dBm
  static int pctToDBm(int pct) => (pct / 100 * 75 - 95).round();

  /// Request necessary permissions
  Future<bool> requestPermissions() async {
    if (Platform.isAndroid) {
      final loc = await Permission.locationWhenInUse.request();
      if (!loc.isGranted) return false;
      // Android 13+
      if (await Permission.nearbyWifiDevices.isDenied) {
        await Permission.nearbyWifiDevices.request();
      }
    }
    return true;
  }

  /// Start scanning
  Future<void> startScan() async {
    if (scanning) return;
    final ok = await requestPermissions();
    if (!ok) return;

    scanning = true;
    _rttBuf.clear();
    _dlBuf.clear();
    _sigBuf.clear();
    notifyListeners();

    // Initial measurement
    await _measure();
    _measureDownload();

    // RTT + signal every 1s
    _rttTimer = Timer.periodic(const Duration(milliseconds: 1000), (_) => _measure());
    // Download every 6s
    _dlTimer = Timer.periodic(const Duration(seconds: 6), (_) => _measureDownload());
  }

  /// Stop scanning
  void stopScan() {
    scanning = false;
    _rttTimer?.cancel();
    _dlTimer?.cancel();
    _rttTimer = null;
    _dlTimer = null;
    notifyListeners();
  }

  /// Core measurement cycle
  Future<void> _measure() async {
    if (!scanning) return;

    // 1. Try native RSSI (Android)
    int? nativeRssi;
    String currentSsid = '';
    if (Platform.isAndroid) {
      try {
        final wifiRssi = await _networkInfo.getWifiRSSI();
        final wifiSsid = await _networkInfo.getWifiName();
        if (wifiRssi != null) {
          nativeRssi = wifiRssi;
          currentSsid = (wifiSsid ?? '').replaceAll('"', '');
        }
      } catch (_) {}
    }

    // 2. HTTP RTT
    final rtt = await _measureRTT();

    // 3. Calculate signal
    int rawSig;
    if (nativeRssi != null) {
      // Blend native RSSI (70%) with HTTP quality (30%)
      final nativeSig = rssiToPercent(nativeRssi);
      final httpSig = _calcHttpSigPct(rtt, _lastDl);
      rawSig = (nativeSig * 0.7 + httpSig * 0.3).round();
    } else {
      rawSig = _calcHttpSigPct(rtt, _lastDl);
    }

    // Moving average smoothing
    _sigBuf.add(rawSig);
    if (_sigBuf.length > 5) _sigBuf.removeAt(0);
    final smoothed = (_sigBuf.reduce((a, b) => a + b) / _sigBuf.length).round();

    rssi = nativeRssi;
    ssid = currentSsid.isNotEmpty ? currentSsid : ssid;
    sigPct = smoothed.clamp(2, 99);
    dBm = nativeRssi ?? pctToDBm(sigPct);
    rttMs = rtt;
    sampleCount++;
    notifyListeners();
  }

  double _lastDl = 0;

  Future<double> _measureRTT() async {
    final url = _rttTargets[(_rttIdx++) % _rttTargets.length];
    final sw = Stopwatch()..start();
    try {
      await http.get(Uri.parse('$url?_=${DateTime.now().millisecondsSinceEpoch}'));
      sw.stop();
      final ms = sw.elapsedMilliseconds.toDouble();
      _rttBuf.add(ms);
      if (_rttBuf.length > 8) _rttBuf.removeAt(0);
      final sorted = List<double>.from(_rttBuf)..sort();
      return sorted[sorted.length ~/ 2];
    } catch (_) {
      return _rttBuf.isNotEmpty ? _rttBuf.last : 150;
    }
  }

  Future<void> _measureDownload() async {
    if (_dlMeasuring || !scanning) return;
    _dlMeasuring = true;
    try {
      final sw = Stopwatch()..start();
      final resp = await http.get(
        Uri.parse('https://speed.cloudflare.com/__down?bytes=102400&_=${DateTime.now().millisecondsSinceEpoch}'),
      );
      sw.stop();
      final elapsed = sw.elapsedMilliseconds / 1000;
      final mbps = (resp.bodyBytes.length * 8 / 1000000) / max(elapsed, 0.01);
      _dlBuf.add(mbps);
      if (_dlBuf.length > 4) _dlBuf.removeAt(0);
      _lastDl = _dlBuf.reduce((a, b) => a + b) / _dlBuf.length;
      dlMbps = double.parse(_lastDl.toStringAsFixed(1));
    } catch (_) {
      _lastDl = _dlBuf.isNotEmpty ? _dlBuf.last : 0;
    }
    _dlMeasuring = false;
    notifyListeners();
  }

  int _calcHttpSigPct(double rtt, double dl) {
    int base = 65; // assume wifi
    final rttScore = (30 - rtt * 0.10).round().clamp(-15, 30);
    final dlScore = (dl * 0.25).round().clamp(0, 25);
    return (base + rttScore + dlScore).clamp(2, 99);
  }

  void reset() {
    sigPct = 0;
    dBm = -95;
    rssi = null;
    ssid = '';
    rttMs = 0;
    dlMbps = 0;
    sampleCount = 0;
    _rttBuf.clear();
    _dlBuf.clear();
    _sigBuf.clear();
    notifyListeners();
  }

  @override
  void dispose() {
    stopScan();
    super.dispose();
  }
}
