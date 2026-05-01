// CONSENT – Production v5.2 aligned
import React, { useState } from 'react';
import { t, LANGUAGES, setLanguage } from '../i18n';

const LANG_SHORT = { de:'DE', en:'EN', zh:'\u4e2d\u6587', es:'ES', hi:'\u0939\u093f', ar:'\u0639', pt:'PT', fr:'FR', ru:'\u0420\u0423', ja:'\u65e5', it:'IT', tr:'TR' };

export default function LegalModal({ lang, onLangChange, onAccept, readOnly }) {
  const [checked, setChecked] = useState(false);

  const handleLang = (l) => { setLanguage(l); onLangChange(l); };
  const handleAccept = () => {
    if (!readOnly) { try { localStorage.setItem('termsAccepted', 'true'); } catch (e) { /* noop */ } }
    onAccept();
  };
  const canAccept = readOnly || checked;

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        {/* Language pills */}
        <div style={S.langRow}>
          {LANGUAGES.map(l => (
            <button key={l} style={l === lang ? S.lbOn : S.lb} onClick={() => handleLang(l)}>
              {LANG_SHORT[l] || l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Eye icon + title */}
        <div style={S.eye}>&#128065;</div>
        <div style={S.title}>{t('cEye', lang)}</div>
        <div style={S.sub} dangerouslySetInnerHTML={{ __html: t('cSub', lang) }} />

        {/* Legal text scroll */}
        <div style={S.legalBox}>
          <div style={S.legalText}>{t('privacyBody', lang)}</div>
        </div>

        {/* Checkbox */}
        {!readOnly && (
          <label style={S.chkRow}>
            <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={S.chk} />
            <span style={S.chkLabel}>{t('cChk', lang)}</span>
          </label>
        )}

        {/* CTA */}
        <button style={canAccept ? S.cta : S.ctaOff} onClick={canAccept ? handleAccept : undefined} disabled={!canAccept}>
          {readOnly ? t('closeBtn', lang) : t('acceptBtn', lang)}
        </button>
      </div>
    </div>
  );
}

const S = {
  overlay: { position: 'fixed', inset: 0, zIndex: 9800, background: 'rgba(0,0,5,.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' },
  langRow: { display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '8px' },
  lb: { fontFamily: 'var(--font-data)', fontSize: '8px', letterSpacing: '.18em', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(212,175,55,.2)', background: 'transparent', color: 'rgba(212,175,55,.4)', cursor: 'pointer', textTransform: 'uppercase' },
  lbOn: { fontFamily: 'var(--font-data)', fontSize: '8px', letterSpacing: '.18em', padding: '4px 10px', borderRadius: '20px', border: '1px solid var(--gold)', background: 'rgba(212,175,55,.1)', color: 'var(--gold)', cursor: 'pointer', textTransform: 'uppercase' },
  eye: { fontSize: 'clamp(38px,12vw,58px)', lineHeight: 1, opacity: 0.7 },
  title: { fontFamily: 'var(--font-ui)', fontSize: 'clamp(13px,3.5vw,16px)', fontWeight: 500, color: 'rgba(255,255,255,.7)', textAlign: 'center', letterSpacing: '.04em' },
  sub: { fontFamily: 'var(--font-ui)', fontSize: 'clamp(10px,2.5vw,11.5px)', color: 'rgba(255,255,255,.32)', textAlign: 'center', lineHeight: 1.5 },
  legalBox: { width: '100%', maxHeight: '24vh', overflowY: 'auto', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(212,175,55,.07)', borderRadius: '10px', padding: '12px 14px' },
  legalText: { fontFamily: 'var(--font-ui)', fontSize: '10.5px', color: 'rgba(255,255,255,.35)', lineHeight: 1.7, whiteSpace: 'pre-wrap' },
  chkRow: { display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%', cursor: 'pointer' },
  chk: { width: '16px', height: '16px', accentColor: 'var(--gold)', marginTop: '1px', flexShrink: 0, cursor: 'pointer' },
  chkLabel: { fontFamily: 'var(--font-ui)', fontSize: 'clamp(10px,2.5vw,11.5px)', color: 'rgba(255,255,255,.45)', lineHeight: 1.4 },
  cta: { width: '100%', maxWidth: '260px', fontFamily: 'var(--font-ui)', fontSize: '14px', fontWeight: 700, letterSpacing: '.12em', padding: '13px 0', borderRadius: '30px', border: 'none', background: 'linear-gradient(135deg,var(--gold-lt),var(--gold),var(--gold-dk))', color: '#000', cursor: 'pointer', boxShadow: '0 4px 20px rgba(212,175,55,.3)', transition: 'transform .15s', textTransform: 'uppercase' },
  ctaOff: { width: '100%', maxWidth: '260px', fontFamily: 'var(--font-ui)', fontSize: '14px', fontWeight: 700, letterSpacing: '.12em', padding: '13px 0', borderRadius: '30px', border: 'none', background: 'rgba(212,175,55,.08)', color: 'rgba(212,175,55,.25)', cursor: 'not-allowed', textTransform: 'uppercase' }
};
