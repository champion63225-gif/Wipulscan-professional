// NETWORK API – Real WiFi measurement (native RSSI on Android, HTTP proxy on iOS/web)
import { useEffect, useRef, useCallback, useState } from 'react';
import { getAndroidRSSI, rssiToPercent, IS_NATIVE, PLATFORM } from '../services/NativeWifi';

const RTT_TARGETS = [
  'https://1.1.1.1/cdn-cgi/trace',
  'https://dns.google/resolve?name=a.a',
  'https://8.8.8.8'
];

function clamp(v, mn, mx) { return Math.min(Math.max(v, mn), mx); }

function sigToDBm(pct) { return Math.round(pct / 100 * 75 - 95); }

function sigColor(s) {
  if (s >= 72) return 'var(--green)';
  if (s >= 50) return 'var(--gold)';
  if (s >= 28) return 'var(--amber)';
  return 'var(--red)';
}

function sigColorClass(s) {
  if (s >= 72) return 'g';
  if (s >= 50) return 'o';
  if (s >= 28) return 'a';
  return 'r';
}

export function useNetwork() {
  const [data, setData] = useState({
    supported: false,
    type: 'unknown',
    effectiveType: '4g',
    rtt: 0,
    downlink: 0,
    sigPct: 0,
    dBm: -95,
    rssi: null,
    ssid: '',
    scanning: false,
    paused: false
  });

  const rttBuf = useRef([]);
  const dlBuf = useRef([]);
  const sigBuf = useRef([]);
  const rttIdx = useRef(0);
  const dlMeasuring = useRef(false);
  const scanningRef = useRef(false);
  const intervalsRef = useRef([]);

  // Moving-average smooth signal values
  const smoothSig = useCallback((raw) => {
    sigBuf.current.push(raw);
    if (sigBuf.current.length > 5) sigBuf.current.shift();
    return Math.round(sigBuf.current.reduce((a, b) => a + b, 0) / sigBuf.current.length);
  }, []);

  // Try native RSSI first (Android with Capacitor plugin)
  const measureNativeRSSI = useCallback(async () => {
    if (!IS_NATIVE || PLATFORM !== 'android') return null;
    try {
      const result = await getAndroidRSSI();
      if (result && typeof result.rssi === 'number') {
        return { rssi: result.rssi, ssid: result.ssid, sigPct: rssiToPercent(result.rssi) };
      }
    } catch { /* plugin not available */ }
    return null;
  }, []);

  const measureRTT = useCallback(async () => {
    const url = RTT_TARGETS[(rttIdx.current++) % RTT_TARGETS.length] + '?_=' + Date.now();
    const t0 = performance.now();
    try {
      await fetch(url, { mode: 'no-cors', cache: 'no-store' });
      const rtt = Math.round(performance.now() - t0);
      rttBuf.current.push(rtt);
      if (rttBuf.current.length > 8) rttBuf.current.shift();
      const sorted = rttBuf.current.slice().sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    } catch {
      return rttBuf.current.length > 0 ? rttBuf.current[rttBuf.current.length - 1] : 150;
    }
  }, []);

  const measureDownload = useCallback(async () => {
    if (dlMeasuring.current) return dlBuf.current.length > 0 ? dlBuf.current[dlBuf.current.length - 1] : 0;
    dlMeasuring.current = true;
    try {
      const url = 'https://speed.cloudflare.com/__down?bytes=102400&_=' + Date.now();
      const t0 = performance.now();
      const r = await fetch(url, { cache: 'no-store' });
      const buf = await r.arrayBuffer();
      const elapsed = (performance.now() - t0) / 1000;
      const mbps = Math.round((buf.byteLength * 8 / 1000000) / elapsed * 10) / 10;
      dlBuf.current.push(mbps);
      if (dlBuf.current.length > 4) dlBuf.current.shift();
      const avg = dlBuf.current.reduce((a, b) => a + b, 0) / dlBuf.current.length;
      dlMeasuring.current = false;
      return Math.round(avg * 10) / 10;
    } catch {
      dlMeasuring.current = false;
      return dlBuf.current.length > 0 ? dlBuf.current[dlBuf.current.length - 1] : 0;
    }
  }, []);

  const calcSigPct = useCallback((rtt, dl) => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const et = conn ? conn.effectiveType : '4g';
    const base = et === '4g' ? 65 : et === '3g' ? 38 : et === '2g' ? 16 : 5;
    const rttScore = clamp(Math.round(30 - rtt * 0.10), -15, 30);
    const dlScore = clamp(Math.round(dl * 0.25), 0, 25);
    const typeBonus = conn ? (conn.type === 'wifi' ? 5 : conn.type === 'ethernet' ? 10 : 0) : 0;
    return clamp(base + rttScore + dlScore + typeBonus, 2, 99);
  }, []);

  const doMeasure = useCallback(async () => {
    if (!scanningRef.current) return;
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    // Try native RSSI first (Android)
    const native = await measureNativeRSSI();
    const rtt = await measureRTT();
    const dl = dlBuf.current.length > 0 ? dlBuf.current[dlBuf.current.length - 1] : 0;

    let sigPct;
    let rssi = null;
    let ssid = '';

    if (native) {
      rssi = native.rssi;
      ssid = native.ssid;
      // Blend native RSSI with network quality for richer signal
      const nativeSig = native.sigPct;
      const httpSig = calcSigPct(rtt, dl);
      sigPct = smoothSig(Math.round(nativeSig * 0.7 + httpSig * 0.3));
    } else {
      sigPct = smoothSig(calcSigPct(rtt, dl));
    }

    setData(prev => ({
      ...prev,
      supported: true,
      rtt,
      sigPct,
      dBm: rssi || sigToDBm(sigPct),
      rssi,
      ssid: ssid || prev.ssid,
      type: conn ? (conn.type || prev.type) : prev.type,
      effectiveType: conn ? (conn.effectiveType || prev.effectiveType) : prev.effectiveType
    }));
  }, [measureNativeRSSI, measureRTT, calcSigPct, smoothSig]);

  const startScan = useCallback(() => {
    scanningRef.current = true;
    rttBuf.current = [];
    dlBuf.current = [];
    sigBuf.current = [];
    setData(prev => ({ ...prev, scanning: true, paused: false }));

    // Initial measurement
    doMeasure();
    measureDownload().then(dl => {
      setData(prev => ({ ...prev, downlink: dl }));
    });

    // RTT + signal every 1s for smooth AR updates
    const rttIv = setInterval(doMeasure, 1000);
    // Download speed every 6s
    const dlIv = setInterval(async () => {
      if (!scanningRef.current) return;
      const dl = await measureDownload();
      setData(prev => ({ ...prev, downlink: dl }));
    }, 6000);
    intervalsRef.current = [rttIv, dlIv];
  }, [doMeasure, measureDownload]);

  const stopScan = useCallback(() => {
    scanningRef.current = false;
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
    setData(prev => ({ ...prev, scanning: false, paused: true }));
  }, []);

  const toggleScan = useCallback(() => {
    if (scanningRef.current) stopScan();
    else startScan();
  }, [startScan, stopScan]);

  useEffect(() => {
    return () => {
      scanningRef.current = false;
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

  return { ...data, startScan, stopScan, toggleScan, sigColor: sigColor(data.sigPct), sigColorClass: sigColorClass(data.sigPct) };
}
