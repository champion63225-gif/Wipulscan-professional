// DEVICE MOTION – Gyroscope orientation + accelerometer step detection + position tracking
import { useState, useEffect, useRef, useCallback } from 'react';

const DEG = Math.PI / 180;
const STEP_LEN = 0.65; // average step length in meters
const STEP_THRESHOLD = 3.0; // acceleration delta for step detection
const STEP_COOLDOWN = 350; // ms between steps

export function useDeviceMotion() {
  const orientRef = useRef({ alpha: 0, beta: 90, gamma: 0 });
  const posRef = useRef({ x: 0, y: 0, z: 0 });
  const stepsRef = useRef(0);
  const headingRef = useRef(0);
  const lastMagRef = useRef(9.8);
  const cooldownRef = useRef(0);

  const [hasPermission, setHasPermission] = useState(false);
  const [gyroAvailable, setGyroAvailable] = useState(true);
  const [steps, setSteps] = useState(0);

  // iOS 13+ requires explicit user-gesture permission
  const requestPermission = useCallback(async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r === 'granted') { setHasPermission(true); return true; }
        return false;
      } catch { setGyroAvailable(false); return false; }
    }
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const r = await DeviceMotionEvent.requestPermission();
        if (r === 'granted') { setHasPermission(true); return true; }
        return false;
      } catch { /* fall through */ }
    }
    setHasPermission(true);
    return true;
  }, []);

  // Gyroscope + Accelerometer listeners
  useEffect(() => {
    if (!hasPermission) return;

    let orientCount = 0;

    const onOrient = (e) => {
      if (e.alpha == null && e.beta == null && e.gamma == null) return;
      orientRef.current = {
        alpha: e.alpha || 0,
        beta: e.beta != null ? e.beta : 90,
        gamma: e.gamma || 0
      };
      headingRef.current = (e.alpha || 0) * DEG;
      orientCount++;
    };

    const onMotion = (e) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x == null) return;

      const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      const diff = Math.abs(mag - lastMagRef.current);
      lastMagRef.current = 0.8 * lastMagRef.current + 0.2 * mag;

      const now = Date.now();
      if (diff > STEP_THRESHOLD && now - cooldownRef.current > STEP_COOLDOWN) {
        cooldownRef.current = now;
        const h = headingRef.current;
        const p = posRef.current;
        p.x += Math.sin(h) * STEP_LEN;
        p.z += Math.cos(h) * STEP_LEN;
        stepsRef.current++;
        setSteps(stepsRef.current);
      }
    };

    window.addEventListener('deviceorientation', onOrient, true);
    window.addEventListener('devicemotion', onMotion, true);

    // Desktop fallback: if no orientation events after 2s → mouse + WASD
    const fallbackTimer = setTimeout(() => {
      if (orientCount === 0) {
        setGyroAvailable(false);
        setupDesktopFallback();
      }
    }, 2000);

    let desktopCleanup = null;
    function setupDesktopFallback() {
      const onMouse = (e) => {
        orientRef.current = {
          alpha: (e.clientX / window.innerWidth) * 360,
          beta: 90 + (e.clientY / window.innerHeight - 0.5) * 50,
          gamma: 0
        };
        headingRef.current = orientRef.current.alpha * DEG;
      };
      const onKey = (e) => {
        const h = headingRef.current;
        const s = 0.35;
        const p = posRef.current;
        if (e.key === 'w' || e.key === 'ArrowUp') { p.x += Math.sin(h) * s; p.z += Math.cos(h) * s; stepsRef.current++; setSteps(c => c + 1); }
        if (e.key === 's' || e.key === 'ArrowDown') { p.x -= Math.sin(h) * s; p.z -= Math.cos(h) * s; }
        if (e.key === 'a' || e.key === 'ArrowLeft') { p.x -= Math.cos(h) * s; p.z += Math.sin(h) * s; stepsRef.current++; setSteps(c => c + 1); }
        if (e.key === 'd' || e.key === 'ArrowRight') { p.x += Math.cos(h) * s; p.z -= Math.sin(h) * s; stepsRef.current++; setSteps(c => c + 1); }
      };
      window.addEventListener('mousemove', onMouse);
      window.addEventListener('keydown', onKey);
      desktopCleanup = () => {
        window.removeEventListener('mousemove', onMouse);
        window.removeEventListener('keydown', onKey);
      };
    }

    return () => {
      window.removeEventListener('deviceorientation', onOrient, true);
      window.removeEventListener('devicemotion', onMotion, true);
      clearTimeout(fallbackTimer);
      if (desktopCleanup) desktopCleanup();
    };
  }, [hasPermission]);

  const reset = useCallback(() => {
    posRef.current = { x: 0, y: 0, z: 0 };
    stepsRef.current = 0;
    setSteps(0);
  }, []);

  return { orientRef, posRef, steps, hasPermission, gyroAvailable, requestPermission, reset };
}
