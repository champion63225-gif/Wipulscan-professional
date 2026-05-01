// INTRO FLOW – Cinematic canvas intro matching production v5.2
import React, { useRef, useEffect, useState, useCallback } from 'react';

const INTRO_DUR = 3750;

export default function IntroScreen({ onComplete, onStartAudio }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const doneRef = useRef(false);
  const [preVis, setPreVis] = useState(false);
  const [brandShoot, setBrandShoot] = useState(false);
  const [subVis, setSubVis] = useState(false);
  const [descVis, setDescVis] = useState(false);
  const [barVis, setBarVis] = useState(false);
  const [footVis, setFootVis] = useState(false);
  const [flashBurst, setFlashBurst] = useState(false);
  const [progress, setProgress] = useState(0);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const el = containerRef.current;
    if (el) {
      el.style.transition = 'opacity .65s ease';
      el.style.opacity = '0';
    }
    setTimeout(onComplete, 700);
  }, [onComplete]);

  useEffect(() => {
    const cvEl = canvasRef.current;
    if (!cvEl) return;
    const sc = cvEl.getContext('2d');
    let iw = window.innerWidth, ih = window.innerHeight;
    cvEl.width = iw; cvEl.height = ih;

    const pts = [];
    for (let i = 0; i < 100; i++) {
      pts.push({
        x: Math.random() * iw, y: Math.random() * ih,
        vx: 0.35 * (Math.random() - 0.5), vy: 0.35 * (Math.random() - 0.5),
        r: Math.random() * 1.6 + 0.3, a: Math.random() * 0.38 + 0.06,
        col: Math.random() > 0.55 ? '212,175,55' : '245,224,112'
      });
    }

    const onResize = () => { iw = cvEl.width = window.innerWidth; ih = cvEl.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    // Timeline
    const timers = [];
    timers.push(setTimeout(() => setPreVis(true), 200));
    timers.push(setTimeout(() => { setBrandShoot(true); setFlashBurst(true); }, 600));
    timers.push(setTimeout(() => setSubVis(true), 1800));
    timers.push(setTimeout(() => setDescVis(true), 2400));
    timers.push(setTimeout(() => { setBarVis(true); setFootVis(true); }, 400));
    timers.push(setTimeout(finish, INTRO_DUR + 900));

    // Try start audio
    if (onStartAudio) onStartAudio();

    const t0 = Date.now();
    let raf;
    const tick = () => {
      if (doneRef.current) return;
      const elapsed = Date.now() - t0;
      const pct = Math.min(elapsed / INTRO_DUR, 1);
      setProgress(pct * 100);

      sc.clearRect(0, 0, iw, ih);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = iw; if (p.x > iw) p.x = 0;
        if (p.y < 0) p.y = ih; if (p.y > ih) p.y = 0;
        sc.beginPath(); sc.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
        sc.fillStyle = 'rgba(' + p.col + ',' + p.a + ')'; sc.fill();
      });

      [0, 0.33, 0.66].forEach(off => {
        const ph = (5.5e-5 * elapsed + off) % 1;
        const r2 = ph * Math.min(iw, ih) * 0.42;
        const a2 = 0.09 * (1 - ph);
        sc.beginPath(); sc.arc(iw * 0.5, ih * 0.5, r2, 0, 2 * Math.PI);
        sc.strokeStyle = 'rgba(212,175,55,' + a2 + ')'; sc.lineWidth = 1.5; sc.stroke();
      });

      const gp = Math.max(0, 1 - Math.abs(elapsed - 3380) / 400);
      if (gp > 0.02) {
        const gg = sc.createRadialGradient(iw * 0.5, ih * 0.5, 0, iw * 0.5, ih * 0.5, Math.min(iw, ih) * 0.3);
        gg.addColorStop(0, 'rgba(212,175,55,' + (0.12 * gp) + ')');
        gg.addColorStop(1, 'rgba(212,175,55,0)');
        sc.beginPath(); sc.arc(iw * 0.5, ih * 0.5, Math.min(iw, ih) * 0.3, 0, 2 * Math.PI);
        sc.fillStyle = gg; sc.fill();
      }

      if (pct < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [finish, onStartAudio]);

  const ilBase = { opacity: 0, transform: 'translateY(14px)', transition: 'opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1)' };
  const ilVis = { opacity: 1, transform: 'none' };

  return (
    <div ref={containerRef} style={S.container} onClick={finish}>
      <canvas ref={canvasRef} style={S.canvas} />
      <div className={flashBurst ? 'wps-intro-flash burst' : 'wps-intro-flash'} style={S.flash} />

      <div style={{ ...S.pre, ...ilBase, ...(preVis ? ilVis : {}) }}>COBRA DYNAMICS PRESENTS</div>
      <div className={brandShoot ? 'wps-brand shoot' : 'wps-brand'} style={S.brand}>WIPULSCAN</div>
      <div style={{ ...S.sub, ...ilBase, ...(subVis ? ilVis : {}) }}>PRO EDITION</div>
      <div style={{ ...S.desc, ...ilBase, ...(descVis ? ilVis : {}) }}>Spatial WiFi Signal Scanner & AR Visualizer</div>

      <div style={{ ...S.barWrap, opacity: barVis ? 1 : 0 }}>
        <div style={{ ...S.bar, width: progress + '%' }} />
      </div>
      <div style={{ ...S.foot, opacity: footVis ? 1 : 0 }}>&copy; Cobra Dynamics 2026</div>

      <style>{`
        .wps-brand{font-family:var(--font-ui);font-size:clamp(38px,10vw,64px);font-weight:700;
          letter-spacing:.14em;text-transform:uppercase;
          background:linear-gradient(150deg,var(--gold-lt) 0%,var(--gold) 45%,var(--gold-dk) 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
          position:relative;z-index:4;line-height:1;opacity:0;transform:scale(0);}
        .wps-brand.shoot{animation:wps-brand-shoot 1.1s cubic-bezier(.12,.8,.2,1) forwards;}
        @keyframes wps-brand-shoot{
          0%{opacity:0;transform:scale(0);filter:brightness(4) blur(2px);}
          12%{opacity:1;transform:scale(1.28);filter:brightness(3) blur(0);}
          30%{transform:scale(0.92);filter:brightness(1.8);}
          50%{transform:scale(1.10);filter:brightness(1.3);}
          70%{transform:scale(0.97);filter:brightness(1.1);}
          88%{transform:scale(1.03);filter:brightness(1.02);}
          100%{opacity:1;transform:scale(1);filter:brightness(1);}
        }
        .wps-intro-flash{position:absolute;inset:0;z-index:3;pointer-events:none;
          background:radial-gradient(ellipse at 50% 48%,rgba(245,224,112,.95) 0%,rgba(212,175,55,.55) 22%,rgba(180,130,20,.15) 48%,transparent 70%);
          opacity:0;}
        .wps-intro-flash.burst{animation:wps-flash-burst 1.4s ease-out forwards;}
        @keyframes wps-flash-burst{0%{opacity:0;}6%{opacity:1;}28%{opacity:.35;}100%{opacity:0;}}
      `}</style>
    </div>
  );
}

const S = {
  container: { position: 'fixed', inset: 0, zIndex: 9000, background: '#000002', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' },
  canvas: { position: 'absolute', inset: 0, width: '100%', height: '100%' },
  flash: {},
  pre: { fontFamily: 'var(--font-data)', fontSize: 'clamp(8px,1.8vw,11px)', letterSpacing: '.42em', color: 'rgba(212,175,55,.4)', textTransform: 'uppercase', marginBottom: '20px', position: 'relative', zIndex: 2 },
  brand: {},
  sub: { fontFamily: 'var(--font-data)', fontSize: 'clamp(8px,1.9vw,11px)', letterSpacing: '.32em', color: 'rgba(212,175,55,.5)', textTransform: 'uppercase', marginTop: '10px', position: 'relative', zIndex: 2 },
  desc: { fontFamily: 'var(--font-ui)', fontSize: 'clamp(10px,2.4vw,13px)', fontWeight: 300, letterSpacing: '.06em', color: 'rgba(255,255,255,.28)', marginTop: '36px', position: 'relative', zIndex: 2, textAlign: 'center' },
  barWrap: { position: 'absolute', bottom: '56px', left: '50%', transform: 'translateX(-50%)', width: 'min(260px,58vw)', height: '1px', background: 'rgba(212,175,55,.1)', borderRadius: '1px', zIndex: 2, transition: 'opacity .5s' },
  bar: { height: '100%', background: 'linear-gradient(90deg,transparent,var(--gold),var(--gold-lt))', borderRadius: '1px', transition: 'width .06s linear' },
  foot: { position: 'absolute', bottom: '22px', left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-data)', fontSize: '8px', letterSpacing: '.24em', color: 'rgba(212,175,55,.22)', textTransform: 'uppercase', zIndex: 2, transition: 'opacity 1s', whiteSpace: 'nowrap' }
};
