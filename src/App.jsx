// BOOT FLOW – Production v5.2 · Store-Ready
import React, { useState, useEffect, useCallback, useRef } from 'react';
import LegalModal from './components/LegalModal';
import IntroScreen from './components/IntroScreen';
import TapToStart from './components/TapToStart';
import Heatmap from './components/Heatmap';
import SettingsPanel from './components/SettingsPanel';
import Paywall from './components/Paywall';
import { getLanguage } from './i18n';
import { initStore, isPro, onProChange } from './services/PurchaseService';

// Flow states: loading → consent → tap → intro → app
function readLS(key) { try { return localStorage.getItem(key); } catch { return null; } }
function writeLS(key, val) { try { localStorage.setItem(key, val); } catch { /* noop */ } }

export default function App() {
  const [lang, setLang] = useState(getLanguage());
  const [flow, setFlow] = useState('loading');
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [pro, setProState] = useState(isPro());
  const audioRef = useRef(null);

  useEffect(() => {
    const consent = readLS('wps_consent') || readLS('termsAccepted');
    setFlow(consent ? 'tap' : 'consent');
    // Init IAP store
    initStore().catch(() => {});
    return onProChange(setProState);
  }, []);

  // Apply font map for CJK/Arabic
  useEffect(() => {
    const fmap = { zh: "'Noto Sans SC'", ar: "'Noto Sans Arabic'", ja: "'Noto Sans JP'", hi: "'Noto Sans Devanagari'" };
    document.body.style.fontFamily = (fmap[lang] || "'Space Grotesk'") + ',sans-serif';
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const handleConsent = useCallback(() => {
    writeLS('wps_consent', '1');
    writeLS('termsAccepted', 'true');
    startAudio();
    setFlow('intro');
  }, []);

  const handleTap = useCallback(() => {
    startAudio();
    setFlow('intro');
  }, []);

  const handleIntroComplete = useCallback(() => {
    setFlow('app');
  }, []);

  function startAudio() {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/jingle-intro-2.mp3');
        audioRef.current.volume = 0.7;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // MP3 missing → generate synthetic intro chime via Web Audio API
        _synthChime();
      });
    } catch { _synthChime(); }
  }

  function _synthChime() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime;

      // 1. Deep Sub Bass Sweep (Cinematic Drone)
      const subOsc = ac.createOscillator();
      const subGain = ac.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(110, t); // A2
      subOsc.frequency.exponentialRampToValueAtTime(36.71, t + 3.0); // D1 drop
      subGain.gain.setValueAtTime(0, t);
      subGain.gain.linearRampToValueAtTime(0.8, t + 0.5);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
      subOsc.connect(subGain);
      subGain.connect(ac.destination);
      subOsc.start(t);
      subOsc.stop(t + 4);

      // 2. High Shimmer / Sci-Fi Scanner Sweep
      const shimOsc = ac.createOscillator();
      const shimGain = ac.createGain();
      shimOsc.type = 'triangle';
      shimOsc.frequency.setValueAtTime(2000, t);
      shimOsc.frequency.exponentialRampToValueAtTime(400, t + 1.5);
      shimGain.gain.setValueAtTime(0, t);
      shimGain.gain.linearRampToValueAtTime(0.15, t + 0.2);
      shimGain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
      
      // Auto-pan effect on shimmer
      const panner = ac.createStereoPanner ? ac.createStereoPanner() : ac.createPanner();
      if (panner.pan) {
        panner.pan.setValueAtTime(-0.8, t);
        panner.pan.linearRampToValueAtTime(0.8, t + 2.0);
      }
      shimOsc.connect(shimGain);
      shimGain.connect(panner);
      panner.connect(ac.destination);
      shimOsc.start(t);
      shimOsc.stop(t + 2);

      // 3. Wide Pad Chord (A minor 9)
      [220.00, 261.63, 329.63, 415.30].forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq + (i * 1.5); // slight detune
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 1.0);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(t);
        osc.stop(t + 4);
      });

    } catch { /* no audio at all */ }
  }

  if (flow === 'loading') return null;

  return (
    <>
      {flow === 'consent' && (
        <LegalModal lang={lang} onLangChange={setLang} onAccept={handleConsent} readOnly={false} />
      )}

      {flow === 'tap' && (
        <TapToStart lang={lang} onTap={handleTap} />
      )}

      {flow === 'intro' && (
        <IntroScreen onComplete={handleIntroComplete} onStartAudio={startAudio} />
      )}

      {flow === 'app' && (
        <Heatmap
          lang={lang}
          onOpenSettings={() => setShowSettings(true)}
          onOpenInfo={() => setShowInfo(true)}
        />
      )}

      {showSettings && (
        <SettingsPanel
          lang={lang}
          onLangChange={setLang}
          onClose={() => setShowSettings(false)}
          isPro={pro}
          onUpgrade={() => { setShowSettings(false); setShowPaywall(true); }}
        />
      )}

      {showPaywall && (
        <Paywall
          lang={lang}
          onUnlock={() => { setProState(true); setShowPaywall(false); }}
          onClose={() => setShowPaywall(false)}
        />
      )}

      {showInfo && (
        <div style={infoStyle} onClick={() => setShowInfo(false)}>
          <div style={infoInner} onClick={e => e.stopPropagation()}>
            <div style={infoTitle}>WIPULSCAN PRO v5.2</div>
            <p style={infoText}>Spatial WiFi Signal Scanner & AR Visualizer</p>
            <p style={infoText}>&copy; Cobra Dynamics 2026 &middot; All Rights Reserved</p>
            <p style={infoText}>Privacy: privacy@cobradynamics.com</p>
            <button style={infoClose} onClick={() => setShowInfo(false)}>&times;</button>
          </div>
        </div>
      )}
    </>
  );
}

const infoStyle = { position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,8,.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const infoInner = { maxWidth: '360px', width: '100%', padding: '32px 24px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(212,175,55,.12)', borderRadius: '18px', position: 'relative', textAlign: 'center' };
const infoTitle = { fontFamily: 'var(--font-ui)', fontSize: '18px', fontWeight: 700, letterSpacing: '.12em', background: 'linear-gradient(90deg,var(--gold-lt),var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '16px' };
const infoText = { fontFamily: 'var(--font-ui)', fontSize: '12px', color: 'rgba(255,255,255,.4)', lineHeight: 1.7, margin: '6px 0' };
const infoClose = { position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(212,175,55,.22)', background: 'transparent', color: 'var(--gold)', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
