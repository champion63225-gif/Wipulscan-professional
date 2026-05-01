// TAP TO START – Intermediary screen for user gesture to unlock audio
import React from 'react';
import { t } from '../i18n';

const S = {
  container: { position: 'fixed', inset: 0, zIndex: 9500, background: 'var(--deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', cursor: 'pointer' },
  logo: { fontFamily: 'var(--font-ui)', fontSize: 'clamp(32px,9vw,56px)', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', background: 'linear-gradient(150deg,var(--gold-lt) 0%,var(--gold) 50%,var(--gold-dk) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '14px' },
  hint: { fontFamily: 'var(--font-data)', fontSize: 'clamp(9px,2.2vw,12px)', letterSpacing: '.38em', color: 'rgba(212,175,55,.45)', textTransform: 'uppercase', marginBottom: '52px' },
  label: { fontFamily: 'var(--font-data)', fontSize: 'clamp(8px,2vw,10px)', letterSpacing: '.32em', color: 'rgba(212,175,55,.3)', textTransform: 'uppercase', marginTop: '22px' }
};

export default function TapToStart({ lang, onTap }) {
  return (
    <div style={S.container} onClick={onTap}>
      <div style={S.logo}>WIPULSCAN</div>
      <div style={S.hint}>PRO</div>
      <div className="wps-tap-orb">&#128225;</div>
      <div style={S.label}>{t('tapToStart', lang)}</div>
      <style>{`
        .wps-tap-orb{width:clamp(70px,18vw,90px);height:clamp(70px,18vw,90px);border-radius:50%;
          background:radial-gradient(ellipse at 38% 32%,rgba(245,224,112,.10) 0%,rgba(0,0,8,.98) 70%);
          border:1px solid rgba(212,175,55,.22);display:flex;align-items:center;justify-content:center;
          font-size:clamp(26px,7vw,36px);animation:wps-tap-pulse 2s ease-in-out infinite;}
        @keyframes wps-tap-pulse{
          0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,.28),0 0 24px rgba(212,175,55,.08);}
          50%{box-shadow:0 0 0 18px rgba(212,175,55,0),0 0 40px rgba(212,175,55,.18);}
        }
      `}</style>
    </div>
  );
}
