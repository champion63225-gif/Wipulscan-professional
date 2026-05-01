import { useEffect, useRef, useState, useCallback } from "react";

/* ══════════════════════════════════════════════════════════════════════
   CobraNebula — Spectral Heatmap Cloud Engine
   RSSI-basiert · Keine Mock-Daten · Nur echte Signalwerte
   ══════════════════════════════════════════════════════════════════════

   Datenquellen (Priorität):
   1. Props:  <CobraNebula rssiDbm={-52} />
              → Für native Bridge (Android/iOS WiFiManager RSSI)
   2. API:    navigator.connection (NetworkInformation Web-API)
              → Schätzt dBm aus downlink/rtt/effectiveType
   3. Kein Signal → zeigt "KEIN SIGNAL" / Cloud steht still

   Props:
     rssiDbm   : number|null  — Echtzeit-RSSI vom nativen Layer
     band      : string       — "2.4 GHz" | "5 GHz" | "6 GHz"
     ssid      : string       — Netzwerkname (optional, für Display)
     width     : string       — CSS width
     height    : string       — CSS height
   ══════════════════════════════════════════════════════════════════════ */

/* ── Farb-Engine ────────────────────────────────────────────────────── */

const hexRgb = (h) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const rgbHex = (r,g,b) => "#"+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");

// Diese Funktion sorgt dafür, dass die Farbe nicht springt, sondern fließt.
const getCobraColor = (percent) => {
  const r = percent < 50 ? 255 : Math.floor(255 - (percent - 50) * 5.1);
  const g = percent < 50 ? Math.floor(percent * 5.1) : 255;
  // Hier wird die Logik für Gold (#d4af37) und Cyan (#00c8ff) gemischt
  return [r, g, Math.floor(255 - percent * 2)];
};

// RSSI → Prozent:  -30 dBm = 100%,  -90 dBm = 0%
function rssiToPercent(dBm) {
  if (dBm == null) return 0;
  return ((Math.max(-90, Math.min(-30, dBm)) + 90) / 60) * 100;
}

/* ── RSSI-Schätzung aus NetworkInformation API ─────────────────────── */

function estimateRssiFromNetworkAPI() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return null;

  let dBm = null;

  // Methode 1: downlink + rtt Kombination (genaueste Web-Schätzung)
  if (conn.downlink != null && conn.rtt != null) {
    // Hoher Downlink + niedriger RTT = starkes Signal
    const dlScore = Math.min(conn.downlink / 30, 1);      // 30 Mbps = max
    const rttScore = Math.max(0, 1 - (conn.rtt / 500));   // 500ms = min
    const combined = dlScore * 0.6 + rttScore * 0.4;
    dBm = -90 + combined * 60;  // Map zu -90..-30 Bereich
  }
  // Methode 2: Nur downlink
  else if (conn.downlink != null) {
    dBm = -90 + Math.min(conn.downlink / 30, 1) * 60;
  }
  // Methode 3: effectiveType als grobe Schätzung
  else if (conn.effectiveType) {
    const map = { "4g": -45, "3g": -65, "2g": -80, "slow-2g": -88 };
    dBm = map[conn.effectiveType] || null;
  }

  return dBm != null ? Math.round(Math.max(-90, Math.min(-30, dBm))) : null;
}

/* ── Simplex Noise ─────────────────────────────────────────────────── */

class Simplex {
  constructor(seed=42) {
    this.g=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
    this.p=new Uint8Array(512); const a=new Uint8Array(256);
    for(let i=0;i<256;i++) a[i]=i; let s=seed|0;
    for(let i=255;i>0;i--){s=(s*16807)%2147483647;const j=s%(i+1);[a[i],a[j]]=[a[j],a[i]];}
    for(let i=0;i<512;i++) this.p[i]=a[i&255];
  }
  n(x,y) {
    const F=.5*(Math.sqrt(3)-1), G=(3-Math.sqrt(3))/6, s=(x+y)*F;
    const i=Math.floor(x+s), j=Math.floor(y+s), t=(i+j)*G;
    const x0=x-(i-t), y0=y-(j-t), i1=x0>y0?1:0, j1=x0>y0?0:1;
    const x1=x0-i1+G, y1=y0-j1+G, x2=x0-1+2*G, y2=y0-1+2*G;
    const ii=i&255, jj=j&255, d=(g,a,b)=>g[0]*a+g[1]*b;
    const c=(gi,a,b)=>{let t0=.5-a*a-b*b;return t0<0?0:(t0*=t0)*t0*d(this.g[gi%12],a,b);};
    return 70*(c(this.p[ii+this.p[jj]],x0,y0)+c(this.p[ii+i1+this.p[jj+j1]],x1,y1)+c(this.p[ii+1+this.p[jj+1]],x2,y2));
  }
}

/* ── Particle Factory ──────────────────────────────────────────────── */

function mkParticle(w, h) {
  const a = Math.random() * Math.PI * 2;
  const d = Math.random() * Math.min(w, h) * 0.38;
  const cx = w/2 + Math.cos(a)*d, cy = h/2 + Math.sin(a)*d;
  return {
    x:cx, y:cy, bx:cx, by:cy,
    r: 20 + Math.random()*80,
    a: 0.02 + Math.random()*0.06,
    sp: 0.15 + Math.random()*0.4,
    nox: Math.random()*1000, noy: Math.random()*1000,
    dr: 0.3 + Math.random()*0.7,
    ph: Math.random()*Math.PI*2,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

export default function CobraNebula({
  rssiDbm = null,
  band = "–",
  ssid = null,
  width = "100%",
  height = "100vh",
}) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const eng = useRef({
    parts:[], curC:[239,68,68], tarC:[239,68,68],
    curP:0, tarP:0, curD:-90, tarD:-90,
    pulse:1, pulseTar:1, lastD:-90,
    noise: new Simplex(42), t:0, mob:false,
    hasSignal: false,
  });

  const [dispPct, setDispPct]   = useState(null);
  const [dispDbm, setDispDbm]   = useState(null);
  const [dispHex, setDispHex]   = useState("#ef4444");
  const [label, setLabel]       = useState("–");
  const [source, setSource]     = useState("–");
  const [hasData, setHasData]   = useState(false);

  /* ── RSSI Update: Props > NetworkInfo API > kein Signal ─────────── */

  const updateRssi = useCallback(() => {
    const e = eng.current;
    let dBm = null;
    let src = "–";

    // Priorität 1: Native RSSI via Props
    if (rssiDbm != null && isFinite(rssiDbm)) {
      dBm = Math.round(Math.max(-90, Math.min(-30, rssiDbm)));
      src = "NATIVE RSSI";
    }
    // Priorität 2: NetworkInformation Web-API
    else {
      const estimated = estimateRssiFromNetworkAPI();
      if (estimated != null) {
        dBm = estimated;
        src = "NETWORK API";
      }
    }

    if (dBm != null) {
      const pct = rssiToPercent(dBm);
      e.tarD = dBm;
      e.tarP = pct;
      e.tarC = getCobraColor(pct);
      e.hasSignal = true;

      // Puls bei >3 dBm Änderung
      if (Math.abs(dBm - e.lastD) > 3) {
        e.pulseTar = 1.14;
        e.lastD = dBm;
      }
    } else {
      // Kein Signal — Cloud geht in Ruhe
      e.tarP = 0;
      e.tarD = -90;
      e.tarC = [239, 68, 68];
      e.hasSignal = false;
    }

    setSource(src);
    setHasData(dBm != null);
  }, [rssiDbm]);

  /* ── Canvas + 60FPS Loop ────────────────────────────────────────── */

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha:true });
    const e = eng.current;
    e.mob = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    let w, h;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rc = cv.getBoundingClientRect();
      w = rc.width; h = rc.height;
      cv.width = w*dpr; cv.height = h*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const cnt = e.mob ? 54 : 90;
      e.parts = [];
      for (let i=0; i<cnt; i++) e.parts.push(mkParticle(w, h));
    };
    resize();
    window.addEventListener("resize", resize);

    // NetworkInformation change listener
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const onConnChange = () => updateRssi();
    if (conn) conn.addEventListener("change", onConnChange);

    // Poll-Intervall für RSSI-Updates
    const pollInterval = setInterval(updateRssi, 1000);
    updateRssi();

    /* ── Render Loop ─────────────────────────────────────────────── */

    const loop = () => {
      e.t += 0.008;

      // Ghosting — 0.05/frame
      for (let i=0; i<3; i++) e.curC[i] += (e.tarC[i] - e.curC[i]) * 0.05;
      e.curP += (e.tarP - e.curP) * 0.05;
      e.curD += (e.tarD - e.curD) * 0.05;
      e.pulse += (e.pulseTar - e.pulse) * 0.08;
      if (Math.abs(e.pulse - e.pulseTar) < 0.002) e.pulseTar = 1;

      const r = Math.round(e.curC[0]);
      const g = Math.round(e.curC[1]);
      const b = Math.round(e.curC[2]);
      const en = e.curP / 100;

      // Wenn kein Signal: Cloud fast unsichtbar, kaum Bewegung
      const ba = e.hasSignal ? (0.25 + en * 0.55) : 0.08;
      const sm = e.hasSignal ? (0.5 + en * 1.5)   : 0.15;

      ctx.clearRect(0, 0, w, h);

      // Background glow
      const bg = ctx.createRadialGradient(w/2,h/2,0, w/2,h/2,w*0.6);
      bg.addColorStop(0,   `rgba(${r},${g},${b},${e.hasSignal ? .08 : .02})`);
      bg.addColorStop(0.5, `rgba(${r},${g},${b},${e.hasSignal ? .03 : .01})`);
      bg.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0,0,w,h);

      // Cloud particles
      for (const p of e.parts) {
        const nx = e.noise.n(p.nox + e.t*p.dr, e.t*0.5);
        const ny = e.noise.n(p.noy + e.t*p.dr, e.t*0.5 + 100);
        p.x = p.bx + nx * 60 * sm;
        p.y = p.by + ny * 60 * sm;
        p.bx += Math.cos(e.t + p.ph) * p.sp * sm * 0.3;
        p.by += Math.sin(e.t + p.ph) * p.sp * sm * 0.3;
        if (p.bx < -50) p.bx = w+50;
        if (p.bx > w+50) p.bx = -50;
        if (p.by < -50) p.by = h+50;
        if (p.by > h+50) p.by = -50;

        const dr = p.r * (0.8 + en*0.6);
        ctx.globalAlpha = p.a * ba;
        const gr = ctx.createRadialGradient(p.x,p.y,0, p.x,p.y,dr);
        gr.addColorStop(0,   `rgba(${r},${g},${b},.6)`);
        gr.addColorStop(0.4, `rgba(${r},${g},${b},.2)`);
        gr.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(p.x, p.y, dr, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Scanning rings (nur bei Signal)
      if (e.hasSignal) {
        const rr = Math.min(w,h) * 0.18;
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.12 + Math.sin(e.t*3)*0.05})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(w/2, h/2, rr*(1 + Math.sin(e.t*2)*0.05), 0, Math.PI*2);
        ctx.stroke();

        const rr2 = Math.min(w,h) * 0.28;
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.04 + Math.sin(e.t*1.3)*0.02})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(w/2, h/2, rr2*(1 + Math.sin(e.t*1.1)*0.03), 0, Math.PI*2);
        ctx.stroke();
      }

      // State ~20fps
      if (Math.floor(e.t*100) % 3 === 0) {
        if (e.hasSignal) {
          setDispPct(Math.round(e.curP));
          setDispDbm(Math.round(e.curD));
          setDispHex(rgbHex(r, g, b));
          const p = e.curP;
          setLabel(p < 25 ? "CRITICAL" : p < 50 ? "WEAK" : p < 75 ? "GOOD" : "ELITE");
        } else {
          setDispPct(null);
          setDispDbm(null);
          setDispHex("#ef444466");
          setLabel("KEIN SIGNAL");
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(pollInterval);
      window.removeEventListener("resize", resize);
      if (conn) conn.removeEventListener("change", onConnChange);
    };
  }, [updateRssi]);

  /* ── UI ─────────────────────────────────────────────────────────── */

  const F = "'Space Grotesk', system-ui, sans-serif";
  const activeHex = hasData ? dispHex : "#ef4444";

  return (
    <div style={{ position:"relative", width, height, minHeight:400, overflow:"hidden", background:"transparent", fontFamily:F }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}} @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>

      {/* Ambient */}
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 50% 45%,${activeHex}18 0%,transparent 65%),radial-gradient(ellipse at 30% 70%,${activeHex}10 0%,transparent 50%),transparent`, transition:"background 2s ease", zIndex:0 }}/>

      {/* Canvas */}
      <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:1 }}/>

      {/* Overlay */}
      <div style={{ position:"absolute", inset:0, zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"space-between", padding:"24px 20px", pointerEvents:"none" }}>

        {/* Top */}
        <div style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background: hasData ? activeHex : "#ffffff22", transition:"background 1s", animation: hasData ? "none" : "pulse 2s infinite" }}/>
            <span style={{ fontSize:13, fontWeight:600, letterSpacing:3, color:"#fff" }}>WIPULSCAN</span>
            <span style={{ fontSize:10, letterSpacing:2, color:"#fff4", marginLeft:4 }}>PRO · v6.0</span>
          </div>
          <span style={{ fontSize:10, fontWeight:600, letterSpacing:3, padding:"4px 12px", border:`1px solid ${hasData ? activeHex+"44" : "#ffffff15"}`, borderRadius:4, color: hasData ? activeHex : "#fff4", transition:"all 1s" }}>{label}</span>
        </div>

        {/* Center */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
          {hasData ? (
            <>
              <div style={{ display:"flex", alignItems:"flex-start" }}>
                <span style={{
                  fontSize:"clamp(80px,20vw,160px)", fontWeight:300, lineHeight:1, color:activeHex,
                  textShadow:`0 0 50px ${activeHex}55, 0 0 100px ${activeHex}22`,
                  transform:`scale(${eng.current.pulse})`,
                  transition:"color 1s, text-shadow 1.5s, transform .3s cubic-bezier(.34,1.56,.64,1)",
                  fontVariantNumeric:"tabular-nums",
                }}>{dispPct}</span>
                <span style={{ fontSize:"clamp(26px,6vw,48px)", fontWeight:300, marginTop:".12em", color:`${activeHex}99`, transition:"color 1s" }}>%</span>
              </div>
              <div style={{ fontSize:"clamp(14px,3vw,22px)", letterSpacing:5, color:`${activeHex}77`, transition:"color 1s", marginTop:-2, fontWeight:400 }}>
                {dispDbm} dBm
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize:"clamp(32px,8vw,56px)", fontWeight:300, letterSpacing:6, color:"#fff2", lineHeight:1 }}>
                – –
              </div>
              <div style={{ fontSize:12, letterSpacing:4, color:"#fff3", marginTop:12 }}>
                WARTE AUF RSSI-DATEN
              </div>
            </>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:16 }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background: hasData ? activeHex : "#fff3", boxShadow: hasData ? `0 0 8px ${activeHex}` : "none", animation:"blink 2s infinite" }}/>
            <span style={{ fontSize:9, fontWeight:500, letterSpacing:4, color:"#fff3" }}>SPECTRAL CLOUD ENGINE</span>
          </div>

          {ssid && (
            <div style={{ fontSize:10, letterSpacing:3, color:"#fff3", marginTop:8 }}>
              {ssid}
            </div>
          )}
        </div>

        {/* Bottom */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16, padding:"12px 28px", background:"rgba(255,255,255,.03)", borderRadius:14, backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,.06)" }}>
            {[
              ["SIGNAL", hasData ? `${dispPct}%` : "–"],
              ["dBm",    hasData ? `${dispDbm}` : "–"],
              ["BAND",   band],
              ["QUELLE", source],
            ].map(([l,v],i,a)=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, minWidth:50 }}>
                  <span style={{ fontSize:7, fontWeight:500, letterSpacing:2, color:"#fff4" }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, fontVariantNumeric:"tabular-nums", color: hasData ? activeHex : "#fff4", transition:"color 1s" }}>{v}</span>
                </div>
                {i < a.length-1 && <div style={{ width:1, height:24, background: hasData ? `${activeHex}22` : "#fff1" }}/>}
              </div>
            ))}
          </div>
          <span style={{ fontSize:8, letterSpacing:4, color:"#fff2" }}>COBRA DYNAMICS · 2026</span>
        </div>
      </div>
    </div>
  );
}
