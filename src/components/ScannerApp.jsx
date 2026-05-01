// SCANNER APP – Main app view with scan button, metrics, legend, canvas
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNetwork } from '../hooks/useNetwork';
import { t } from '../i18n';

function sigCol(s) {
  if (s >= 72) return 'var(--green)';
  if (s >= 50) return 'var(--gold)';
  if (s >= 28) return 'var(--amber)';
  return 'var(--red)';
}
function sigColRGB(s) {
  if (s >= 72) return '0,255,136';
  if (s >= 50) return '212,175,55';
  if (s >= 28) return '240,112,0';
  return '255,51,51';
}
function mvClass(s) {
  if (s >= 72) return { color: 'var(--green)' };
  if (s >= 50) return { color: 'var(--gold)' };
  if (s >= 28) return { color: 'var(--amber)' };
  return { color: 'var(--red)' };
}

export default function ScannerApp({ lang, onOpenSettings, onOpenInfo }) {
  const net = useNetwork();
  const cvRef = useRef(null);
  const ctxRef = useRef(null);
  const bubblesRef = useRef([]);
  const rafRef = useRef(null);
  const [statusMsg, setStatusMsg] = useState('');

  // Status messages based on signal
  useEffect(() => {
    if (!net.scanning) return;
    const msgs = [
      { min: 88, key: 'msgExcellent' },
      { min: 72, key: 'msgStrong' },
      { min: 50, key: 'msgGood' },
      { min: 30, key: 'msgMedium' },
      { min: 12, key: 'msgWeak' },
      { min: 0, key: 'msgCritical' }
    ];
    const found = msgs.find(m => net.sigPct >= m.min);
    if (found) setStatusMsg(t(found.key, lang));
  }, [net.sigPct, net.scanning, lang]);

  // Canvas bubble visualization
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctxRef.current = ctx;
    let W = window.innerWidth, H = window.innerHeight;
    const DPR = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    window.addEventListener('resize', onResize);

    function initBubbles() {
      const cx = W * 0.5, cy = H * 0.4;
      const main = { x: cx, y: cy, hx: cx, hy: cy, r: 32, sig: net.sigPct || 65, label: 'MAIN', vx: 0, vy: 0, main: true };
      const subs = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const dist = 80 + Math.random() * 60;
        const sx = cx + Math.cos(a) * dist, sy = cy + Math.sin(a) * dist;
        subs.push({ x: sx, y: sy, hx: sx, hy: sy, r: 10 + Math.random() * 14, sig: 20 + Math.random() * 70, label: 'NET-' + i, vx: 0, vy: 0 });
      }
      bubblesRef.current = [main, ...subs];
    }
    initBubbles();

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const bubbles = bubblesRef.current;

      // Draw connection lines
      bubbles.forEach((b, i) => {
        if (i === 0) return;
        ctx.beginPath();
        ctx.moveTo(bubbles[0].x, bubbles[0].y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = 'rgba(212,175,55,.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Physics
      bubbles.forEach(b => {
        b.vx += (b.hx - b.x) * 0.008;
        b.vy += (b.hy - b.y) * 0.008;
        b.vx *= 0.92; b.vy *= 0.92;
        b.x += b.vx; b.y += b.vy;
      });

      // Draw bubbles
      bubbles.forEach(b => {
        const rgb = sigColRGB(b.sig);
        // Glow
        const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 2.5);
        glow.addColorStop(0, 'rgba(' + rgb + ',.08)');
        glow.addColorStop(1, 'rgba(' + rgb + ',0)');
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();

        // Body
        const bg = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 0, b.x, b.y, b.r);
        bg.addColorStop(0, 'rgba(' + rgb + ',.25)');
        bg.addColorStop(0.7, 'rgba(' + rgb + ',.08)');
        bg.addColorStop(1, 'rgba(0,0,0,.3)');
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = bg; ctx.fill();
        ctx.strokeStyle = 'rgba(' + rgb + ',.35)'; ctx.lineWidth = 1; ctx.stroke();

        // Highlight
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.2, b.y - b.r * 0.25, b.r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Update main bubble sig when scanning
  useEffect(() => {
    if (bubblesRef.current.length > 0 && net.scanning) {
      bubblesRef.current[0].sig = net.sigPct;
    }
  }, [net.sigPct, net.scanning]);

  return (
    <div style={S.root}>
      <canvas ref={cvRef} style={S.canvas} />

      {/* TOP BAR */}
      <div style={S.topbar}>
        <div style={S.tbLogo}>WIPULSCAN</div>
        <div style={S.tbConn}>{net.type === 'wifi' ? 'WIFI' : net.type === 'cellular' ? 'LTE' : net.type.toUpperCase()}</div>
      </div>

      {/* BADGE */}
      <div style={S.badge}>
        <div style={{ ...S.badgeInner, ...(net.scanning ? {} : { color: 'var(--amber)' }) }}>
          {net.scanning ? t('hScan', lang) : net.paused ? t('hPause', lang) : t('hReady', lang)}
        </div>
      </div>

      {/* STATUS MESSAGE */}
      {net.scanning && statusMsg && (
        <div style={S.smsg}>{statusMsg}</div>
      )}

      {/* GEAR + INFO BUTTONS */}
      <div style={S.gearBtn} onClick={onOpenSettings}>&#9881;</div>
      <div style={S.infoBtn} onClick={onOpenInfo}>?</div>

      {/* SCAN BUTTON */}
      <div style={S.scanBtn} onClick={net.toggleScan}>
        <div style={S.orb}>
          <span style={{ ...S.orbVal, ...mvClass(net.sigPct) }}>{net.scanning ? net.sigPct : '\u2013'}</span>
          <span style={S.orbUnit}>%</span>
          <span style={S.orbDbm}>{net.scanning ? net.dBm + ' dBm' : '\u2013 dBm'}</span>
        </div>
        <span style={S.btnIcon}>&#128225;</span>
        <span style={S.btnLbl}>{net.scanning ? t('btnStop', lang) : t('btnStart', lang)}</span>
      </div>

      {/* LEGEND */}
      <div style={S.legend}>
        {[
          { color: 'var(--green)', key: 'lStrong' },
          { color: 'var(--gold)', key: 'lGood' },
          { color: 'var(--amber)', key: 'lMedium' },
          { color: 'var(--red)', key: 'lWeak' }
        ].map(l => (
          <div key={l.key} style={S.legendItem}>
            <div style={{ ...S.legendDot, background: l.color }} />
            <span style={S.legendLabel}>{t(l.key, lang)}</span>
          </div>
        ))}
      </div>

      {/* METRICS */}
      <div style={S.metrics}>
        <div style={S.mgrid}>
          <div style={S.mc}>
            <div style={S.ml}>{t('mlSig', lang)}</div>
            <div style={{ ...S.mv, ...mvClass(net.sigPct) }}>{net.scanning ? net.sigPct : '\u2013'}</div>
            <div style={S.mu}>%</div>
          </div>
          <div style={S.mc}>
            <div style={S.ml}>{t('mlDl', lang)}</div>
            <div style={{ ...S.mv, color: 'var(--gold)' }}>{net.scanning ? net.downlink : '\u2013'}</div>
            <div style={S.mu}>Mbps</div>
          </div>
          <div style={S.mc}>
            <div style={S.ml}>{t('mlRtt', lang)}</div>
            <div style={{ ...S.mv, color: 'var(--gold)' }}>{net.scanning ? net.rtt : '\u2013'}</div>
            <div style={S.mu}>ms</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  root: { position: 'relative', width: '100%', height: '100%', background: 'var(--deep)' },
  canvas: { position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' },
  topbar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, padding: 'calc(env(safe-area-inset-top,0px) + 10px) 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg,rgba(0,0,10,.96) 0%,transparent 100%)', pointerEvents: 'none' },
  tbLogo: { fontFamily: 'var(--font-ui)', fontSize: '16px', fontWeight: 700, letterSpacing: '.18em', background: 'linear-gradient(90deg,var(--gold-lt),var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  tbConn: { fontFamily: 'var(--font-data)', fontSize: '8px', letterSpacing: '.18em', color: 'rgba(212,175,55,.4)', textTransform: 'uppercase' },
  badge: { position: 'absolute', top: '60px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 },
  badgeInner: { fontFamily: 'var(--font-data)', fontSize: '8px', letterSpacing: '.28em', color: 'rgba(212,175,55,.45)', textTransform: 'uppercase', padding: '4px 14px', borderRadius: '20px', border: '1px solid rgba(212,175,55,.12)', background: 'rgba(0,0,10,.6)', backdropFilter: 'blur(8px)' },
  smsg: { position: 'absolute', top: '17%', left: '50%', transform: 'translateX(-50%)', zIndex: 105, fontFamily: 'var(--font-ui)', fontSize: 'clamp(10px,2.5vw,11.5px)', color: 'rgba(255,255,255,.38)', letterSpacing: '.05em', textAlign: 'center', width: 'min(280px,76vw)', pointerEvents: 'none' },
  gearBtn: { position: 'absolute', zIndex: 120, width: '42px', height: '42px', borderRadius: '50%', border: '1px solid rgba(212,175,55,.18)', background: 'rgba(0,0,10,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', bottom: '340px', left: '14px', fontSize: '18px', color: 'rgba(212,175,55,.6)' },
  infoBtn: { position: 'absolute', zIndex: 120, width: '42px', height: '42px', borderRadius: '50%', border: '1px solid rgba(212,175,55,.18)', background: 'rgba(0,0,10,.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', bottom: '340px', right: '14px', fontFamily: 'var(--font-ui)', fontSize: '16px', fontWeight: 700, color: 'rgba(212,175,55,.6)' },
  scanBtn: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(env(safe-area-inset-bottom,0px) + 128px)', width: 'clamp(130px,38vw,170px)', height: 'clamp(130px,38vw,170px)', borderRadius: '50%', border: 'none', cursor: 'pointer', zIndex: 110, background: 'radial-gradient(ellipse at 36% 30%,rgba(245,224,112,.12) 0%,#000 65%)', boxShadow: '0 0 0 1px rgba(212,175,55,.2),0 0 0 6px rgba(212,175,55,.04),0 8px 40px rgba(0,0,0,.85),inset 0 1px 0 rgba(212,175,55,.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  orb: { position: 'absolute', inset: '14px', borderRadius: '50%', overflow: 'hidden', background: 'radial-gradient(ellipse at 38% 30%,rgba(245,224,112,.06) 0%,rgba(0,0,8,.97) 70%)', border: '1px solid rgba(212,175,55,.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  orbVal: { fontFamily: 'var(--font-data)', fontSize: 'clamp(24px,7vw,34px)', fontWeight: 700, lineHeight: 1 },
  orbUnit: { fontFamily: 'var(--font-data)', fontSize: '10px', color: 'rgba(255,255,255,.3)', marginTop: '2px' },
  orbDbm: { fontFamily: 'var(--font-data)', fontSize: '8px', color: 'rgba(255,255,255,.25)', marginTop: '4px' },
  btnIcon: { position: 'absolute', top: '8px', fontSize: '14px', zIndex: 5 },
  btnLbl: { position: 'absolute', bottom: '10px', fontFamily: 'var(--font-ui)', fontSize: 'clamp(9px,2.2vw,11px)', fontWeight: 700, letterSpacing: '.16em', color: 'var(--gold)', textTransform: 'uppercase', zIndex: 5 },
  legend: { position: 'absolute', right: '12px', top: '33%', zIndex: 100 },
  legendItem: { display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' },
  legendDot: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 },
  legendLabel: { fontFamily: 'var(--font-data)', fontSize: '7.5px', letterSpacing: '.1em', color: 'rgba(255,255,255,.38)' },
  metrics: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100, padding: '12px 12px calc(env(safe-area-inset-bottom,0px) + 12px)', background: 'linear-gradient(0deg,rgba(0,0,10,.97) 0%,rgba(0,0,10,.7) 60%,transparent 100%)' },
  mgrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '7px' },
  mc: { background: 'rgba(255,255,255,.022)', border: '1px solid rgba(212,175,55,.07)', borderRadius: '10px', padding: '9px 7px 7px', textAlign: 'center', position: 'relative', overflow: 'hidden' },
  ml: { fontFamily: 'var(--font-data)', fontSize: '7.5px', letterSpacing: '.22em', color: 'rgba(212,175,55,.4)', textTransform: 'uppercase', marginBottom: '4px' },
  mv: { fontFamily: 'var(--font-data)', fontSize: 'clamp(17px,4.8vw,23px)', fontWeight: 700, lineHeight: 1 },
  mu: { fontSize: '8px', color: 'rgba(255,255,255,.28)', marginTop: '2px' }
};
