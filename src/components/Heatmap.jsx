// AR SIGNAL HEATMAP – Camera + Gyroscope + Real WiFi Measurement
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSignalHeatmap, sigToDBm } from '../hooks/useHeatmap';
import { useNetwork } from '../hooks/useNetwork';
import { useDeviceMotion } from '../hooks/useDeviceMotion';
import { useCamera } from '../hooks/useCamera';
import { t } from '../i18n';

export default function Heatmap({ lang, onOpenSettings, onOpenInfo }) {
  const canvasRef = useRef(null);
  const net = useNetwork();
  const motion = useDeviceMotion();
  const cam = useCamera();
  const [ready, setReady] = useState(false);

  const { clearSamples, sampleCount } = useSignalHeatmap(
    canvasRef, cam.videoRef, net.scanning, net.sigPct, motion.orientRef, motion.posRef
  );

  // Canvas DPR setup
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const W = window.innerWidth, H = window.innerHeight;
      cv.width = Math.round(W * DPR);
      cv.height = Math.round(H * DPR);
      cv.style.width = W + 'px';
      cv.style.height = H + 'px';
      const ctx = cv.getContext('2d');
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Haptic feedback (native or web fallback)
  const vibrate = useCallback((ms) => {
    try {
      if (window.Capacitor?.Plugins?.Haptics) {
        window.Capacitor.Plugins.Haptics.impact({ style: 'MEDIUM' });
      } else if (navigator.vibrate) {
        navigator.vibrate(ms);
      }
    } catch { /* noop */ }
  }, []);

  // Start scan: request all permissions + begin measurement
  const handleStart = useCallback(async () => {
    if (!motion.hasPermission) await motion.requestPermission();
    if (!cam.active) await cam.start();
    setReady(true);
    vibrate(50);
    net.startScan();
  }, [motion, cam, net, vibrate]);

  const handleStop = useCallback(() => {
    vibrate(30);
    net.stopScan();
  }, [net, vibrate]);

  const handleReset = useCallback(() => {
    vibrate(40);
    clearSamples();
    motion.reset();
    if (net.scanning) net.stopScan();
  }, [clearSamples, motion, net, vibrate]);

  const sigCol = net.sigPct >= 72 ? 'var(--green)' : net.sigPct >= 50 ? 'var(--gold)' : net.sigPct >= 28 ? 'var(--amber)' : 'var(--red)';
  const dist = (motion.steps * 0.65).toFixed(1);

  return (
    <div style={S.root}>
      {/* Hidden video element for camera feed */}
      <video ref={cam.videoRef} playsInline muted style={S.video} />

      {/* Main render canvas */}
      <canvas ref={canvasRef} style={S.canvas} />

      {/* Vertical dBm color legend (left) - Glowing AR Scale */}
      <div style={S.legend}>
        <span style={S.legendLabel}>100%</span>
        <div style={S.legendBar}>
          {net.scanning && (
            <div style={{
              position: 'absolute',
              bottom: `${Math.max(0, Math.min(100, net.sigPct))}%`,
              left: '50%',
              transform: 'translate(-50%, 50%)',
              width: '14px',
              height: '4px',
              background: '#fff',
              borderRadius: '2px',
              boxShadow: '0 0 6px #fff'
            }} />
          )}
        </div>
        <span style={S.legendLabel}>0%</span>
      </div>

      {/* Top bar */}
      <div style={S.topbar}>
        <div style={S.tbLogo}>WIPULSCAN</div>
        <div style={S.tbRight}>
          {cam.active && <div style={S.arBadge}>AR</div>}
          {motion.gyroAvailable && motion.hasPermission && <div style={S.arBadge}>GYRO</div>}
          <div style={S.tbBadge}>
            {net.scanning ? t('hScan', lang) : sampleCount > 0 ? t('hPause', lang) : t('hReady', lang)}
          </div>
        </div>
      </div>

      {/* Center Router Icon & Percentage (like reference image) */}
      <div style={S.centerHUD}>
        <div style={S.routerIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="14" width="16" height="6" rx="2" />
            <path d="M6 10v4" />
            <path d="M18 10v4" />
            <path d="M10 17h4" />
            <path d="M12 6v4" />
            <path d="M8.5 7.5a5 5 0 0 1 7 0" />
            <path d="M6 4a9 9 0 0 1 12 0" />
          </svg>
        </div>
        {net.scanning && net.sigPct > 0 && (
          <div style={{ ...S.sigValHUD, color: sigCol, textShadow: `0 0 12px ${sigCol}80, 0 0 4px rgba(0,0,0,0.8)` }}>
            {net.sigPct}%
          </div>
        )}
      </div>

      {/* Top-Center dBm Readout */}
      <div style={S.sigBox}>
        {net.scanning ? (
          <>
            <div style={S.sigDbmVal}>{(net.rssi ?? sigToDBm(net.sigPct))} dBm</div>
            {net.ssid && <div style={S.sigSSID}>{net.ssid}</div>}
          </>
        ) : (
          <div style={S.sigDbmValInactive}>– dBm</div>
        )}
      </div>

      {/* Metrics grid */}
      <div style={S.metricsRow}>
        <div style={S.mc}>
          <div style={S.mcL}>{t('mlDl', lang)}</div>
          <div style={S.mcV}>{net.scanning ? net.downlink : '\u2013'}</div>
          <div style={S.mcU}>Mbps</div>
        </div>
        <div style={S.mc}>
          <div style={S.mcL}>{t('mlRtt', lang)}</div>
          <div style={S.mcV}>{net.scanning ? net.rtt : '\u2013'}</div>
          <div style={S.mcU}>ms</div>
        </div>
        <div style={S.mc}>
          <div style={S.mcL}>SAMPLES</div>
          <div style={S.mcV}>{sampleCount}</div>
          <div style={S.mcU}>n</div>
        </div>
        <div style={S.mc}>
          <div style={S.mcL}>DISTANCE</div>
          <div style={S.mcV}>{dist}</div>
          <div style={S.mcU}>m \u00b7 {motion.steps} steps</div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={S.btnRow}>
        {!net.scanning ? (
          <button style={S.btnStart} onClick={handleStart}>
            {t('btnStart', lang)}
          </button>
        ) : (
          <button style={S.btnStop} onClick={handleStop}>
            {t('btnStop', lang)}
          </button>
        )}
        {sampleCount > 0 && !net.scanning && (
          <button style={S.btnReset} onClick={handleReset}>
            {t('resetBtn', lang)}
          </button>
        )}
      </div>

      {/* Desktop hint */}
      {!motion.gyroAvailable && !net.scanning && sampleCount === 0 && (
        <div style={S.hint}>
          <span style={S.hintIcon}>&#128433;</span>
          <span>Desktop: Mouse = look \u00b7 WASD = move</span>
        </div>
      )}

      {/* Camera error hint */}
      {cam.error && (
        <div style={S.camErr}>Camera: {cam.error === 'camera_denied' ? 'Permission denied' : cam.error}</div>
      )}

      {/* Gear + Info buttons */}
      {onOpenSettings && <div style={S.gearBtn} onClick={onOpenSettings}>&#9881;</div>}
      {onOpenInfo && <div style={S.infoBtn} onClick={onOpenInfo}>?</div>}
    </div>
  );
}

const S = {
  root: { position: 'relative', width: '100%', height: '100%', background: '#05050c', overflow: 'hidden' },
  video: { position: 'fixed', top: 0, left: 0, width: '1px', height: '1px', opacity: 0, pointerEvents: 'none', zIndex: -1 },
  canvas: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  legend: { position: 'absolute', left: '20px', top: '25%', bottom: '25%', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  legendBar: { position: 'relative', width: '4px', flex: 1, borderRadius: '2px', background: 'linear-gradient(to bottom, #00ff64, #88ff00, #ccdd00, #f5e070, #f07000, #ff3333)', boxShadow: '0 -20px 10px rgba(0,255,136,0.3), 0 20px 10px rgba(255,51,51,0.3)' },
  legendLabel: { fontFamily: 'var(--font-data)', fontSize: '8px', color: 'rgba(255,255,255,.5)' },
  topbar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: 'calc(env(safe-area-inset-top,0px) + 10px) 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg,rgba(0,0,10,.88) 0%,transparent 100%)' },
  tbLogo: { fontFamily: 'var(--font-ui)', fontSize: '14px', fontWeight: 700, letterSpacing: '.18em', background: 'linear-gradient(90deg,var(--gold-lt),var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  tbRight: { display: 'flex', alignItems: 'center', gap: '6px' },
  arBadge: { fontFamily: 'var(--font-data)', fontSize: '6.5px', letterSpacing: '.2em', color: 'var(--cyan)', padding: '2px 7px', borderRadius: '10px', border: '1px solid rgba(0,200,255,.2)', background: 'rgba(0,200,255,.06)' },
  tbBadge: { fontFamily: 'var(--font-data)', fontSize: '7px', letterSpacing: '.2em', color: 'rgba(212,175,55,.45)', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(212,175,55,.12)', background: 'rgba(0,0,10,.5)' },
  sigBox: { position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 56px)', left: '0', right: '0', zIndex: 20, textAlign: 'center', pointerEvents: 'none' },
  sigDbmVal: { fontFamily: 'var(--font-data)', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,.8)', letterSpacing: '1px' },
  sigDbmValInactive: { fontFamily: 'var(--font-data)', fontSize: '14px', color: 'rgba(255,255,255,.3)', letterSpacing: '1px' },
  sigSSID: { fontFamily: 'var(--font-data)', fontSize: '10px', color: 'rgba(0,200,255,.6)', marginTop: '4px', letterSpacing: '1px' },
  centerHUD: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' },
  routerIcon: { marginBottom: '8px' },
  sigValHUD: { fontFamily: 'var(--font-data)', fontSize: '32px', fontWeight: 700, lineHeight: 1 },
  metricsRow: { position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom,0px) + 72px)', left: '10px', right: '10px', zIndex: 20, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '5px' },
  mc: { background: 'rgba(0,0,10,.65)', backdropFilter: 'blur(6px)', border: '1px solid rgba(212,175,55,.06)', borderRadius: '8px', padding: '6px 4px 5px', textAlign: 'center' },
  mcL: { fontFamily: 'var(--font-data)', fontSize: '6px', letterSpacing: '.22em', color: 'rgba(212,175,55,.3)', textTransform: 'uppercase', marginBottom: '2px' },
  mcV: { fontFamily: 'var(--font-data)', fontSize: 'clamp(13px,3.8vw,18px)', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 },
  mcU: { fontFamily: 'var(--font-data)', fontSize: '6px', color: 'rgba(255,255,255,.2)', marginTop: '2px' },
  btnRow: { position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom,0px) + 18px)', left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', gap: '10px' },
  btnStart: { fontFamily: 'var(--font-ui)', fontSize: '12px', fontWeight: 700, letterSpacing: '.14em', padding: '12px 32px', borderRadius: '24px', border: 'none', background: 'linear-gradient(135deg,var(--gold-lt),var(--gold),var(--gold-dk))', color: '#000', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 4px 18px rgba(212,175,55,.3)' },
  btnStop: { fontFamily: 'var(--font-ui)', fontSize: '12px', fontWeight: 700, letterSpacing: '.14em', padding: '12px 32px', borderRadius: '24px', border: '1px solid rgba(255,60,60,.4)', background: 'rgba(255,50,50,.1)', color: 'var(--red)', cursor: 'pointer', textTransform: 'uppercase' },
  btnReset: { fontFamily: 'var(--font-data)', fontSize: '9px', letterSpacing: '.14em', padding: '11px 16px', borderRadius: '20px', border: '1px solid rgba(212,175,55,.2)', background: 'rgba(0,0,10,.5)', color: 'rgba(212,175,55,.5)', cursor: 'pointer', textTransform: 'uppercase' },
  hint: { position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom,0px) + 64px)', left: '50%', transform: 'translateX(-50%)', zIndex: 20, fontFamily: 'var(--font-data)', fontSize: '8px', color: 'rgba(255,255,255,.2)', letterSpacing: '.08em', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
  hintIcon: { fontSize: '12px' },
  camErr: { position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 42px)', left: '50%', transform: 'translateX(-50%)', zIndex: 20, fontFamily: 'var(--font-data)', fontSize: '8px', color: 'rgba(255,100,60,.5)', letterSpacing: '.06em' },
  gearBtn: { position: 'absolute', zIndex: 30, width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(212,175,55,.12)', background: 'rgba(0,0,10,.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', top: 'calc(env(safe-area-inset-top,0px) + 10px)', right: '52px', fontSize: '15px', color: 'rgba(212,175,55,.45)' },
  infoBtn: { position: 'absolute', zIndex: 30, width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(212,175,55,.12)', background: 'rgba(0,0,10,.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', top: 'calc(env(safe-area-inset-top,0px) + 10px)', right: '12px', fontFamily: 'var(--font-ui)', fontSize: '13px', fontWeight: 700, color: 'rgba(212,175,55,.45)' }
};
