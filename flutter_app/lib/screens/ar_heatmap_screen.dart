import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'package:vibration/vibration.dart';
import 'package:wipulscan_pro/models/wifi_sample.dart';
import 'package:wipulscan_pro/services/wifi_service.dart';
import 'package:wipulscan_pro/services/motion_service.dart';
import 'package:wipulscan_pro/services/purchase_service.dart';
import 'package:wipulscan_pro/screens/paywall_screen.dart';
import 'package:wipulscan_pro/widgets/cloud_painter.dart';
import 'package:wipulscan_pro/widgets/cobra_nebula.dart';
import 'package:wipulscan_pro/theme.dart';

class ArHeatmapScreen extends StatefulWidget {
  const ArHeatmapScreen({super.key});

  @override
  State<ArHeatmapScreen> createState() => _ArHeatmapScreenState();
}

class _ArHeatmapScreenState extends State<ArHeatmapScreen> with TickerProviderStateMixin {
  CameraController? _camCtrl;
  String? _camError;
  final _motion = MotionService();
  final List<WifiSample> _samples = [];
  Timer? _renderTimer;
  double _lastSampleX = 0, _lastSampleZ = 0;
  bool _showSettings = false;

  static const _minSampleDist = 0.25; // meters
  static const _maxSamples = 500;

  @override
  void initState() {
    super.initState();
    _initCamera();
    // 30fps render loop – drives CloudPainter repaint + motion updates
    _renderTimer = Timer.periodic(const Duration(milliseconds: 33), (_) {
      if (mounted) setState(() {});
    });
  }

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() => _camError = 'No camera found');
        return;
      }
      final back = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );
      _camCtrl = CameraController(back, ResolutionPreset.high, enableAudio: false);
      await _camCtrl!.initialize();
      if (mounted) setState(() {});
    } catch (e) {
      if (mounted) setState(() => _camError = e.toString());
    }
  }

  void _handleStart() async {
    Vibration.vibrate(duration: 50, amplitude: 128);
    _motion.start();

    final wifi = context.read<WifiService>();
    await wifi.startScan();
    wifi.addListener(_onSignalUpdate);
    _motion.addListener(_onMotionUpdate);
  }

  void _handleStop() {
    Vibration.vibrate(duration: 30, amplitude: 80);
    final wifi = context.read<WifiService>();
    wifi.stopScan();
    wifi.removeListener(_onSignalUpdate);
    _motion.removeListener(_onMotionUpdate);
    _motion.stop();
  }

  void _handleReset() {
    Vibration.vibrate(duration: 40, amplitude: 100);
    _samples.clear();
    _lastSampleX = 0;
    _lastSampleZ = 0;
    _motion.reset();
    final wifi = context.read<WifiService>();
    if (wifi.scanning) {
      wifi.stopScan();
      wifi.removeListener(_onSignalUpdate);
      _motion.removeListener(_onMotionUpdate);
      _motion.stop();
    }
    wifi.reset();
    setState(() {});
  }

  // Called on WiFi signal update
  void _onSignalUpdate() => _tryPlaceSample();

  // Called on motion (step detected)
  void _onMotionUpdate() => _tryPlaceSample();

  void _tryPlaceSample() {
    final wifi = context.read<WifiService>();
    if (!wifi.scanning || wifi.sigPct <= 0) return;

    // Distance gate: ≥25cm from last sample
    final dx = _motion.posX - _lastSampleX;
    final dz = _motion.posZ - _lastSampleZ;
    final dist = sqrt(dx * dx + dz * dz);

    // Allow first sample immediately, then enforce minimum distance
    if (_samples.isNotEmpty && dist < _minSampleDist) return;

    _lastSampleX = _motion.posX;
    _lastSampleZ = _motion.posZ;

    final rng = Random();
    final color = sigToCloudColor(wifi.sigPct);
    
    _samples.add(WifiSample(
      x: _motion.posX + (rng.nextDouble() - 0.5) * 0.3,
      y: (rng.nextDouble() - 0.5) * 0.2,
      z: _motion.posZ + (rng.nextDouble() - 0.5) * 0.3,
      sigPct: wifi.sigPct,
      color: color,
      r: color.red,
      g: color.green,
      b: color.blue,
      driftX: (rng.nextDouble() - 0.5) * 0.05,
      driftY: rng.nextDouble() * 0.03, // drift slowly upwards
      driftZ: (rng.nextDouble() - 0.5) * 0.05,
      radius: 0.5 + rng.nextDouble() * 0.6, // Larger clouds
      alpha: 0.4 + rng.nextDouble() * 0.2,
    ));
    if (_samples.length > _maxSamples) _samples.removeAt(0);
  }

  @override
  void dispose() {
    _renderTimer?.cancel();
    final wifi = context.read<WifiService>();
    wifi.removeListener(_onSignalUpdate);
    _motion.removeListener(_onMotionUpdate);
    _motion.dispose();
    _camCtrl?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final wifi = context.watch<WifiService>();
    final mq = MediaQuery.of(context);
    final topPad = mq.padding.top;
    final botPad = mq.padding.bottom;

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ── Layer 1: Camera feed (bottom) ──
          if (_camCtrl != null && _camCtrl!.value.isInitialized)
            Positioned.fill(
              child: FittedBox(
                fit: BoxFit.cover,
                child: SizedBox(
                  width: _camCtrl!.value.previewSize!.height,
                  height: _camCtrl!.value.previewSize!.width,
                  child: CameraPreview(_camCtrl!),
                ),
              ),
            )
          else
            Positioned.fill(child: Container(color: WColors.deep)),

          // ── Layer 2: Slight dark overlay for contrast ──
          Positioned.fill(
            child: Container(color: Colors.black.withOpacity(0.15)),
          ),

          // ── Layer 3: Cloud overlay (CloudPainter) ──
          Positioned.fill(
            child: RepaintBoundary(
              child: CustomPaint(
                size: Size.infinite,
                painter: CloudPainter(
                  samples: _samples,
                  heading: _motion.headingRad,
                  pitch: (_motion.beta - 90) * pi / 180,
                  camX: _motion.posX,
                  camZ: _motion.posZ,
                ),
              ),
            ),
          ),

          // ── Layer 3.5: Central Cobra Nebula HUD (Current live signal) ──
          Positioned.fill(
            child: IgnorePointer(
              child: RepaintBoundary(
                child: CobraNebula(
                  rssiDbm: wifi.rssi ?? (wifi.sigPct > 0 ? sigToDBm(wifi.sigPct) : null),
                  isScanning: wifi.scanning,
                ),
              ),
            ),
          ),

          // ── Layer 4: UI overlays ──

          // Center Router Icon & Percentage (like reference image)
          Positioned.fill(
            child: IgnorePointer(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.router_outlined, size: 48, color: Colors.white.withOpacity(0.85)),
                    const SizedBox(height: 8),
                    if (wifi.scanning && wifi.sigPct > 0)
                      Text(
                        '${wifi.sigPct}%',
                        style: TextStyle(
                          fontFamily: 'SpaceMono',
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: sigColor(wifi.sigPct),
                          shadows: [
                            Shadow(color: sigColor(wifi.sigPct).withOpacity(0.5), blurRadius: 12),
                            const Shadow(color: Colors.black87, blurRadius: 4),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),

          // Vertical dBm / % legend (left) - AR glowing scale
          Positioned(
            left: 20,
            top: mq.size.height * 0.25,
            bottom: mq.size.height * 0.25,
            child: _buildGlowingScale(wifi),
          ),

          // Top bar
          Positioned(
            top: 0, left: 0, right: 0,
            child: _buildTopBar(wifi, topPad),
          ),

          // Signal readout (center top - smaller now since percentage is in middle)
          Positioned(
            top: topPad + 56, left: 0, right: 0,
            child: _buildSignalReadout(wifi),
          ),

          // Camera error hint
          if (_camError != null)
            Positioned(
              top: topPad + 42, left: 0, right: 0,
              child: Center(
                child: Text('Camera: $_camError',
                  style: TextStyle(fontFamily: 'SpaceMono', fontSize: 8, color: WColors.red.withOpacity(0.5))),
              ),
            ),

          // Metrics grid
          Positioned(
            left: 10, right: 10, bottom: botPad + 72,
            child: _buildMetrics(wifi),
          ),

          // Action buttons
          Positioned(
            bottom: botPad + 18, left: 0, right: 0,
            child: _buildButtons(wifi),
          ),

          // Gear button (top-right)
          Positioned(
            top: topPad + 10, right: 52,
            child: _circleButton(Icons.settings, () => setState(() => _showSettings = true)),
          ),

          // Info button (top-right)
          Positioned(
            top: topPad + 10, right: 12,
            child: _circleButton(Icons.info_outline, _showInfoDialog),
          ),

          // Settings overlay
          if (_showSettings) _buildSettingsOverlay(),
        ],
      ),
    );
  }

  Widget _circleButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36, height: 36,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: const Color(0x99000010),
          border: Border.all(color: WColors.gold.withOpacity(0.12)),
        ),
        child: Icon(icon, size: 15, color: WColors.gold.withOpacity(0.45)),
      ),
    );
  }

  void _showInfoDialog() {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: const Color(0xF0000010),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: WColors.gold.withOpacity(0.12)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            ShaderMask(
              shaderCallback: (rect) => const LinearGradient(colors: [WColors.goldLt, WColors.gold]).createShader(rect),
              child: const Text('WIPULSCAN PRO v5.2',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: Colors.white)),
            ),
            const SizedBox(height: 12),
            Text('Spatial WiFi Signal Scanner\n& AR Heatmap Visualizer',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.4), height: 1.6)),
            const SizedBox(height: 8),
            Text('© 2026 Cobra Dynamics\nAll Rights Reserved',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.25), height: 1.5)),
            const SizedBox(height: 6),
            Text('privacy@cobradynamics.com',
              style: TextStyle(fontSize: 9, color: WColors.gold.withOpacity(0.3))),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Close', style: TextStyle(color: WColors.gold.withOpacity(0.5), letterSpacing: 1)),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _buildSettingsOverlay() {
    final iap = context.watch<PurchaseService>();
    return Positioned.fill(
      child: GestureDetector(
        onTap: () => setState(() => _showSettings = false),
        child: Container(
          color: Colors.black.withOpacity(0.92),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ShaderMask(
                        shaderCallback: (rect) => const LinearGradient(colors: [WColors.goldLt, WColors.gold]).createShader(rect),
                        child: const Text('SETTINGS',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 3, color: Colors.white)),
                      ),
                      GestureDetector(
                        onTap: () => setState(() => _showSettings = false),
                        child: Icon(Icons.close, color: WColors.gold.withOpacity(0.4)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Pro status
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: WColors.gold.withOpacity(0.08)),
                      color: Colors.white.withOpacity(0.02),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          const Text('WIPULSCAN PRO v5.2',
                            style: TextStyle(fontFamily: 'SpaceMono', fontSize: 10, letterSpacing: 1, color: Colors.white70)),
                          const SizedBox(height: 2),
                          Text(iap.isPro ? 'Pro Unlocked' : 'Free Version',
                            style: TextStyle(fontFamily: 'SpaceMono', fontSize: 9, color: Colors.white.withOpacity(0.35))),
                        ]),
                        if (iap.isPro)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: WColors.green),
                              color: WColors.green.withOpacity(0.08),
                            ),
                            child: const Text('PRO ✓',
                              style: TextStyle(fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 2, color: WColors.green, fontWeight: FontWeight.w700)),
                          )
                        else
                          GestureDetector(
                            onTap: () {
                              setState(() => _showSettings = false);
                              Navigator.push(context, MaterialPageRoute(
                                builder: (_) => PaywallScreen(
                                  onUnlock: () => Navigator.pop(context),
                                  onClose: () => Navigator.pop(context),
                                ),
                              ));
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(20),
                                gradient: const LinearGradient(colors: [WColors.goldLt, WColors.gold]),
                              ),
                              child: const Text('UPGRADE · €1.99',
                                style: TextStyle(fontFamily: 'SpaceMono', fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 1, color: Colors.black)),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Privacy link
                  GestureDetector(
                    onTap: () {
                      setState(() => _showSettings = false);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const _PrivacyScreen()));
                    },
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: WColors.gold.withOpacity(0.08)),
                        color: Colors.white.withOpacity(0.02),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            const Text('Privacy Policy',
                              style: TextStyle(fontFamily: 'SpaceMono', fontSize: 10, letterSpacing: 1, color: Colors.white70)),
                            const SizedBox(height: 2),
                            Text('privacy@cobradynamics.com',
                              style: TextStyle(fontFamily: 'SpaceMono', fontSize: 9, color: Colors.white.withOpacity(0.35))),
                          ]),
                          Icon(Icons.chevron_right, color: WColors.gold.withOpacity(0.3), size: 20),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Imprint link
                  GestureDetector(
                    onTap: () {
                      setState(() => _showSettings = false);
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const _ImprintScreen()));
                    },
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: WColors.gold.withOpacity(0.08)),
                        color: Colors.white.withOpacity(0.02),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            const Text('Impressum / Imprint',
                              style: TextStyle(fontFamily: 'SpaceMono', fontSize: 10, letterSpacing: 1, color: Colors.white70)),
                            const SizedBox(height: 2),
                            Text('Legal information',
                              style: TextStyle(fontFamily: 'SpaceMono', fontSize: 9, color: Colors.white.withOpacity(0.35))),
                          ]),
                          Icon(Icons.chevron_right, color: WColors.gold.withOpacity(0.3), size: 20),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar(WifiService wifi, double topPad) {
    return Container(
      padding: EdgeInsets.only(top: topPad + 10, left: 14, right: 100, bottom: 8),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xE0000010), Colors.transparent],
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          ShaderMask(
            shaderCallback: (rect) => const LinearGradient(
              colors: [WColors.goldLt, WColors.gold],
            ).createShader(rect),
            child: const Text('WIPULSCAN',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 2.5, color: Colors.white)),
          ),
          Row(children: [
            if (_camCtrl?.value.isInitialized == true) _badge('AR', WColors.cyan),
            const SizedBox(width: 6),
            _badge('GYRO', WColors.cyan),
            const SizedBox(width: 6),
            _badge(wifi.scanning ? 'SCANNING' : _samples.isNotEmpty ? 'PAUSED' : 'READY', null),
          ]),
        ],
      ),
    );
  }

  Widget _badge(String text, Color? color) {
    final c = color ?? WColors.gold.withOpacity(0.45);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: c.withOpacity(0.25)),
        color: c.withOpacity(0.06),
      ),
      child: Text(text,
        style: TextStyle(fontFamily: 'SpaceMono', fontSize: 6.5, letterSpacing: 2, color: c)),
    );
  }

  Widget _buildSignalReadout(WifiService wifi) {
    return Column(
      children: [
        if (wifi.scanning) ...[
          Text(
            '${wifi.rssi ?? sigToDBm(wifi.sigPct)} dBm',
            style: TextStyle(fontFamily: 'SpaceMono', fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white.withOpacity(0.8), letterSpacing: 1),
          ),
          if (wifi.ssid.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(wifi.ssid,
                style: TextStyle(fontFamily: 'SpaceMono', fontSize: 10, color: WColors.cyan.withOpacity(0.6), letterSpacing: 1)),
            ),
        ] else ...[
          Text('– dBm', style: TextStyle(fontFamily: 'SpaceMono', fontSize: 14, color: Colors.white.withOpacity(0.3), letterSpacing: 1)),
        ],
      ],
    );
  }

  Widget _buildMetrics(WifiService wifi) {
    return Row(
      children: [
        _metricCard('DOWNLOAD', wifi.scanning ? '${wifi.dlMbps}' : '–', 'Mbps'),
        const SizedBox(width: 5),
        _metricCard('LATENCY', wifi.scanning ? '${wifi.rttMs.round()}' : '–', 'ms'),
        const SizedBox(width: 5),
        _metricCard('SAMPLES', '${_samples.length}', 'n'),
        const SizedBox(width: 5),
        _metricCard('DISTANCE', _motion.distanceM.toStringAsFixed(1), 'm · ${_motion.steps} steps'),
      ],
    );
  }

  Widget _metricCard(String label, String value, String unit) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        decoration: BoxDecoration(
          color: const Color(0xA6000010),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: WColors.gold.withOpacity(0.06)),
        ),
        child: Column(children: [
          Text(label, style: TextStyle(fontFamily: 'SpaceMono', fontSize: 6, letterSpacing: 2,
            color: WColors.gold.withOpacity(0.3))),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontFamily: 'SpaceMono', fontSize: 16, fontWeight: FontWeight.w700,
            color: WColors.gold)),
          const SizedBox(height: 2),
          Text(unit, style: TextStyle(fontFamily: 'SpaceMono', fontSize: 6, color: Colors.white.withOpacity(0.2))),
        ]),
      ),
    );
  }

  Widget _buildButtons(WifiService wifi) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (!wifi.scanning)
          _goldButton('START SCAN', _handleStart)
        else
          _redButton('STOP SCAN', _handleStop),
        if (_samples.isNotEmpty && !wifi.scanning) ...[
          const SizedBox(width: 10),
          _outlineButton('RESET', _handleReset),
        ],
      ],
    );
  }

  Widget _goldButton(String text, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          gradient: const LinearGradient(colors: [WColors.goldLt, WColors.gold, WColors.goldDk]),
          boxShadow: [BoxShadow(color: WColors.gold.withOpacity(0.3), blurRadius: 18, offset: const Offset(0, 4))],
        ),
        child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.8, color: Colors.black)),
      ),
    );
  }

  Widget _redButton(String text, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: WColors.red.withOpacity(0.4)),
          color: WColors.red.withOpacity(0.1),
        ),
        child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.8, color: WColors.red)),
      ),
    );
  }

  Widget _outlineButton(String text, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: WColors.gold.withOpacity(0.2)),
          color: const Color(0x80000010),
        ),
        child: Text(text, style: TextStyle(fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 1.8,
          color: WColors.gold.withOpacity(0.5))),
      ),
    );
  }

  Widget _buildGlowingScale(WifiService wifi) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text('100%', style: TextStyle(fontFamily: 'SpaceMono', fontSize: 8, color: Colors.white.withOpacity(0.5))),
        const SizedBox(height: 6),
        Expanded(
          child: Stack(
            alignment: Alignment.bottomCenter,
            children: [
              // Main gradient bar
              Container(
                width: 4,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(2),
                  gradient: const LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color(0xFF00FF64), Color(0xFF88FF00), Color(0xFFCCDD00),
                      Color(0xFFF5E070), Color(0xFFF07000), Color(0xFFFF3333),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(color: WColors.green.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, -20)),
                    BoxShadow(color: WColors.red.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 20)),
                  ],
                ),
              ),
              // Current value indicator (thumb)
              if (wifi.scanning)
                FractionallySizedBox(
                  alignment: Alignment.bottomCenter,
                  heightFactor: (wifi.sigPct / 100).clamp(0.0, 1.0),
                  child: Align(
                    alignment: Alignment.topCenter,
                    child: Container(
                      width: 14,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(2),
                        boxShadow: const [BoxShadow(color: Colors.white, blurRadius: 6)],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        Text('0%', style: TextStyle(fontFamily: 'SpaceMono', fontSize: 8, color: Colors.white.withOpacity(0.5))),
      ],
    );
  }
}

// ─── Privacy Policy Screen ───
class _PrivacyScreen extends StatelessWidget {
  const _PrivacyScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WColors.deep,
      appBar: AppBar(
        title: const Text('Privacy Policy', style: TextStyle(fontSize: 14, letterSpacing: 1.5)),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Text(
          'WIPULSCAN PRO – Privacy Policy\n'
          'Last updated: April 2026\n\n'
          '1. DATA CONTROLLER\n'
          'Cobra Dynamics\n'
          'E-Mail: privacy@cobradynamics.com\n\n'
          '2. DATA COLLECTED\n'
          'WIPULSCAN PRO processes the following data exclusively on your device:\n'
          '• WiFi signal strength (RSSI in dBm) – Android only, via system WifiManager API\n'
          '• Network connection quality (round-trip time, download speed) – measured via HTTPS requests to Cloudflare CDN\n'
          '• Device motion data (gyroscope orientation, accelerometer for step detection)\n'
          '• Camera frames (processed in real-time for AR overlay visualization)\n\n'
          '3. DATA STORAGE\n'
          'All data is processed locally in device memory. No data is stored persistently except:\n'
          '• Your consent preference (stored in local app storage)\n'
          '• Your purchase status (managed by Google Play / Apple App Store)\n\n'
          '4. DATA TRANSMISSION\n'
          'WIPULSCAN PRO does NOT transmit any personal data to external servers.\n'
          'The only network requests made are:\n'
          '• HTTPS requests to Cloudflare CDN (1.1.1.1, speed.cloudflare.com) for measuring network quality\n'
          '• In-App Purchase verification via Google Play / Apple App Store APIs\n\n'
          '5. CAMERA & SENSORS\n'
          'Camera frames are rendered in real-time as an AR background. They are never recorded, stored, or transmitted. '
          'Motion sensor data is used solely for spatial positioning of signal measurements.\n\n'
          '6. PASSWORDS & NETWORK CONTENT\n'
          'WIPULSCAN PRO does NOT read, intercept, or access any passwords, network traffic content, '
          'browsing history, or data from other applications.\n\n'
          '7. THIRD-PARTY SERVICES\n'
          '• Google Play Billing / Apple StoreKit – for in-app purchases\n'
          '• Cloudflare CDN – for network speed measurement (no personal data sent)\n\n'
          '8. YOUR RIGHTS (GDPR)\n'
          'Since no personal data is collected or stored on external servers, there is no personal data to access, '
          'rectify, or delete. You may revoke your consent at any time by clearing the app data or uninstalling the app.\n\n'
          '9. CONTACT\n'
          'For privacy inquiries: privacy@cobradynamics.com\n',
          style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.5), height: 1.7),
        ),
      ),
    );
  }
}

// ─── Imprint / Impressum Screen ───
class _ImprintScreen extends StatelessWidget {
  const _ImprintScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WColors.deep,
      appBar: AppBar(
        title: const Text('Impressum / Imprint', style: TextStyle(fontSize: 14, letterSpacing: 1.5)),
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Text(
          'IMPRESSUM / IMPRINT\n\n'
          'Angaben gemäß § 5 TMG / Information according to § 5 TMG:\n\n'
          'Cobra Dynamics\n'
          'E-Mail: contact@cobradynamics.com\n'
          'Web: cobradynamics.com\n\n'
          'RESPONSIBLE FOR CONTENT (§ 55 Abs. 2 RStV):\n'
          'Cobra Dynamics\n'
          'E-Mail: contact@cobradynamics.com\n\n'
          'DISPUTE RESOLUTION:\n'
          'The European Commission provides a platform for online dispute resolution (OS): '
          'https://ec.europa.eu/consumers/odr\n'
          'We are not willing or obliged to participate in dispute resolution proceedings.\n\n'
          'LIABILITY FOR CONTENT:\n'
          'As a service provider, we are responsible for our own content in this application according to '
          'general laws (§ 7 Para. 1 TMG). However, according to §§ 8 to 10 TMG, as a service provider we are '
          'not obligated to monitor transmitted or stored third-party information.\n\n'
          '© 2026 Cobra Dynamics. All Rights Reserved.\n',
          style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.5), height: 1.7),
        ),
      ),
    );
  }
}
