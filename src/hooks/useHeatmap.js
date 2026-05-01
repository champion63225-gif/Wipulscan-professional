// SPATIAL SIGNAL HEATMAP – 3D AR cloud projection from real WiFi measurements
import { useEffect, useRef, useState, useCallback } from 'react';

const DEG = Math.PI / 180;

// Signal % → RGB color: green(strong) → yellow → orange → red(weak) (Smooth flowing logic)
function sigToRGB(pct) {
  const p = Math.max(0, Math.min(100, pct));
  const r = p < 50 ? 255 : Math.floor(255 - (p - 50) * 5.1);
  const g = p < 50 ? Math.floor(p * 5.1) : 255;
  const b = Math.floor(255 - p * 2);
  return [r, g, b];
}

function sigToDBm(pct) { return Math.round(pct / 100 * 75 - 95); }

const MIN_SAMPLE_DIST = 0.25; // meters – minimum movement before placing new cloud
const MAX_SAMPLES = 500;

export function useSignalHeatmap(canvasRef, videoRef, scanning, sigPct, orientRef, posRef) {
  // orientRef = { alpha, beta, gamma } from useDeviceMotion
  const samplesRef = useRef([]);
  const rafRef = useRef(null);
  const lastSamplePosRef = useRef({ x: 0, z: 0 });
  const [sampleCount, setSampleCount] = useState(0);

  const clearSamples = useCallback(() => {
    samplesRef.current = [];
    lastSamplePosRef.current = { x: 0, z: 0 };
    setSampleCount(0);
  }, []);

  // Collect spatial sample – place on movement or periodically
  useEffect(() => {
    if (!scanning || sigPct <= 0) return;

    function placeSample() {
      const pos = posRef.current;
      const ori = orientRef.current;
      const heading = (ori.alpha || 0) * DEG;
      const last = lastSamplePosRef.current;
      const dx = pos.x - last.x, dz = pos.z - last.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Distance gate: require movement (or first sample)
      if (samplesRef.current.length > 0 && dist < MIN_SAMPLE_DIST) return false;

      lastSamplePosRef.current = { x: pos.x, z: pos.z };
      const rgb = sigToRGB(sigPct);
      // Place slightly in front of camera (0.5-1.2m forward) so clouds are visible
      const fwd = 0.5 + Math.random() * 0.7;
      const lat = (Math.random() - 0.5) * 0.4;
      const jy = (Math.random() - 0.5) * 0.2;
      samplesRef.current.push({
        x: pos.x + Math.sin(heading) * fwd + Math.cos(heading) * lat,
        y: jy,
        z: pos.z + Math.cos(heading) * fwd - Math.sin(heading) * lat,
        sig: sigPct, r: rgb[0], g: rgb[1], b: rgb[2],
        radius: 0.35 + Math.random() * 0.25,
        alpha: 0.55 + Math.random() * 0.2,
        ts: Date.now()
      });
      if (samplesRef.current.length > MAX_SAMPLES) samplesRef.current.shift();
      setSampleCount(samplesRef.current.length);
      return true;
    }

    // Try immediately
    placeSample();

      // Place a sample every 1s even without movement
      const iv = setInterval(() => {
        const pos = posRef.current;
        const ori = orientRef.current;
        const heading = (ori.alpha || 0) * DEG;
        const rgb = sigToRGB(sigPct);
        const fwd = 0.8 + Math.random() * 1.5;
        const lat = (Math.random() - 0.5) * 1.2;
        samplesRef.current.push({
          x: pos.x + Math.sin(heading) * fwd + Math.cos(heading) * lat,
          y: (Math.random() - 0.5) * 0.4,
          z: pos.z + Math.cos(heading) * fwd - Math.sin(heading) * lat,
          driftX: (Math.random() - 0.5) * 0.05, // Cloud drift velocity X
          driftY: Math.random() * 0.03, // Slight upward drift
          driftZ: (Math.random() - 0.5) * 0.05, // Cloud drift velocity Z
          sig: sigPct, r: rgb[0], g: rgb[1], b: rgb[2],
          radius: 0.5 + Math.random() * 0.6, // Larger clouds
          alpha: 0.4 + Math.random() * 0.2,
          ts: Date.now()
        });
        if (samplesRef.current.length > MAX_SAMPLES) samplesRef.current.shift();
        setSampleCount(samplesRef.current.length);
      }, 1000);

    return () => clearInterval(iv);
  }, [scanning, sigPct, posRef]);

  // Main render loop – reads refs directly each frame for low latency
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');

    function render() {
      const W = window.innerWidth, H = window.innerHeight;
      if (W < 1 || H < 1) { rafRef.current = requestAnimationFrame(render); return; }

      ctx.clearRect(0, 0, W, H);

      // === Camera feed background ===
      const vid = videoRef?.current;
      if (vid && vid.readyState >= vid.HAVE_CURRENT_DATA) {
        const vw = vid.videoWidth || W, vh = vid.videoHeight || H;
        const scale = Math.max(W / vw, H / vh);
        const sw = vw * scale, sh = vh * scale;
        ctx.drawImage(vid, (W - sw) / 2, (H - sh) / 2, sw, sh);
        // Slight overlay for contrast
        ctx.fillStyle = 'rgba(0,0,8,.18)';
        ctx.fillRect(0, 0, W, H);
      } else {
        // Fallback: dark background with subtle grid
        ctx.fillStyle = '#05050c';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(212,175,55,.025)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 36) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      }

      // === 3D Projection of signal clouds ===
      const samples = samplesRef.current;
      if (samples.length > 0) {
        const ori = orientRef.current;
        const camPos = posRef.current;
        const heading = ori.alpha * DEG;
        const pitch = (ori.beta - 90) * DEG;

        const fwdX = Math.sin(heading), fwdZ = Math.cos(heading);
        const rightX = Math.cos(heading), rightZ = -Math.sin(heading);
        const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
        const focal = W * 0.75;

        // Project all samples to screen space
        const proj = [];
        const now = Date.now();
        for (let i = 0; i < samples.length; i++) {
          const s = samples[i];
          const ageSec = (now - (s.ts || now)) / 1000;
          
          // Apply cloud drift
          const dx = (s.x + (s.driftX || 0) * ageSec) - camPos.x;
          const dz = (s.z + (s.driftZ || 0) * ageSec) - camPos.z;
          const dy = (s.y + (s.driftY || 0) * ageSec) - camPos.y;
          
          const depth = dx * fwdX + dz * fwdZ;
          const lat = dx * rightX + dz * rightZ;
          const vert = dy;
          const dp = depth * cosP - vert * sinP;
          const vp = depth * sinP + vert * cosP;
          if (dp < 0.15) continue; // behind camera

          const sx = W / 2 + lat / dp * focal;
          const sy = H / 2 - vp / dp * focal;
          
          // Clouds expand slightly over time
          const currentRadius = s.radius + ageSec * 0.05;
          const size = currentRadius / dp * focal;
          if (sx < -size * 2 || sx > W + size * 2 || sy < -size * 2 || sy > H + size * 2) continue;

          proj.push({ sx, sy, size, dp, r: s.r, g: s.g, b: s.b, alpha: s.alpha, sig: s.sig, age: ageSec });
        }

        // Sort far-to-near (painter's order)
        proj.sort((a, b) => b.dp - a.dp);

        // Draw cloud blobs with screen/lighter blend mode for volumetric look
        ctx.globalCompositeOperation = 'screen';
        for (const p of proj) {
          // Age fade: full opacity for 2min, fade to 0 over next 3min
          const ageFade = p.age < 120 ? 1 : p.age > 300 ? 0 : 1 - (p.age - 120) / 180;
          const af = Math.min(1, 1.8 / p.dp) * p.alpha * ageFade;
          if (af < 0.01) continue;

          // Main cloud
          const g1 = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, p.size);
          g1.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${(af * 0.45).toFixed(3)})`);
          g1.addColorStop(0.4, `rgba(${p.r},${p.g},${p.b},${(af * 0.25).toFixed(3)})`);
          g1.addColorStop(0.7, `rgba(${p.r},${p.g},${p.b},${(af * 0.08).toFixed(3)})`);
          g1.addColorStop(1, `rgba(${p.r},${p.g},${p.b},0)`);
          ctx.fillStyle = g1;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      // === Central crosshair / reticle ===
      const cx = W / 2, cy = H / 2;
      ctx.strokeStyle = 'rgba(212,175,55,.15)';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 26, cy); ctx.lineTo(cx - 10, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 10, cy); ctx.lineTo(cx + 26, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 26); ctx.lineTo(cx, cy - 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx, cy + 26); ctx.stroke();

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasRef, videoRef, orientRef, posRef]);

  return { clearSamples, sampleCount };
}

export { sigToRGB, sigToDBm };
