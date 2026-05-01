// SETTINGS PANEL
import React from 'react';
import { t, LANGUAGES, LANGUAGE_LABELS, setLanguage } from '../i18n';

const S = {
  overlay: { position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,8,.98)', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 'calc(env(safe-area-inset-top,0px) + 16px) 20px calc(env(safe-area-inset-bottom,0px) + 20px)' },
  hdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', paddingTop: '14px' },
  title: { fontFamily: 'var(--font-ui)', fontSize: '17px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', background: 'linear-gradient(90deg,var(--gold-lt),var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  closeBtn: { width: '34px', height: '34px', borderRadius: '50%', border: '1px solid rgba(212,175,55,.22)', background: 'transparent', color: 'var(--gold)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: '20px' },
  sectionTitle: { fontFamily: 'var(--font-data)', fontSize: '8px', letterSpacing: '.28em', color: 'rgba(212,175,55,.38)', textTransform: 'uppercase', paddingBottom: '7px', borderBottom: '1px solid rgba(212,175,55,.07)', marginBottom: '10px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,.03)' },
  rowLabel: { fontSize: '12.5px', color: 'rgba(255,255,255,.65)' },
  rowSub: { fontSize: '9.5px', color: 'rgba(255,255,255,.28)', marginTop: '2px' },
  langRow: { display: 'flex', gap: '6px', justifyContent: 'flex-start', flexWrap: 'wrap' },
  lb: { fontFamily: 'var(--font-data)', fontSize: '9px', letterSpacing: '.18em', padding: '5px 14px', borderRadius: '20px', border: '1px solid rgba(212,175,55,.25)', background: 'transparent', color: 'rgba(212,175,55,.5)', cursor: 'pointer', textTransform: 'uppercase', transition: 'all .2s' },
  lbOn: { fontFamily: 'var(--font-data)', fontSize: '9px', letterSpacing: '.18em', padding: '5px 14px', borderRadius: '20px', border: '1px solid var(--gold)', background: 'rgba(212,175,55,.1)', color: 'var(--gold)', cursor: 'pointer', textTransform: 'uppercase' },
  resetBtn: { fontFamily: 'var(--font-data)', fontSize: '9px', letterSpacing: '.18em', padding: '5px 14px', borderRadius: '20px', border: '1px solid rgba(212,175,55,.25)', background: 'transparent', color: 'rgba(212,175,55,.5)', cursor: 'pointer' },
  featList: { listStyle: 'none', padding: 0 },
  featItem: { padding: '7px 0', fontSize: '11.5px', color: 'rgba(255,255,255,.45)', borderBottom: '1px solid rgba(255,255,255,.03)', display: 'flex', alignItems: 'center', gap: '9px' },
  featDot: { color: 'var(--gold-dk)', fontSize: '6px' },
  price: { fontFamily: 'var(--font-data)', fontSize: '11px', color: 'var(--gold)', fontWeight: 700 },
  proBadge: { fontFamily: 'var(--font-data)', fontSize: '9px', letterSpacing: '.2em', padding: '5px 12px', borderRadius: '16px', border: '1px solid var(--green)', background: 'rgba(0,255,136,.08)', color: 'var(--green)', fontWeight: 700 },
  upgradeBtn: { fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', padding: '7px 16px', borderRadius: '20px', border: 'none', background: 'linear-gradient(135deg,var(--gold-lt),var(--gold))', color: '#000', cursor: 'pointer', textTransform: 'uppercase', whiteSpace: 'nowrap' }
};

const LANG_SHORT = { de: 'DE', en: 'EN', zh: '\u4e2d\u6587', es: 'ES', hi: '\u0939\u093f', ar: '\u0639', pt: 'PT', fr: 'FR', ru: '\u0420\u0423', ja: '\u65e5', it: 'IT', tr: 'TR' };

export default function SettingsPanel({ lang, onLangChange, onClose, isPro, onUpgrade }) {
  const handleLang = (l) => {
    setLanguage(l);
    onLangChange(l);
  };

  const resetConsent = () => {
    try { localStorage.removeItem('termsAccepted'); localStorage.removeItem('wps_consent'); } catch (e) { /* noop */ }
    window.location.reload();
  };

  const feats = [
    t('feat1', lang), t('feat2', lang), t('feat3', lang), t('feat4', lang), t('feat5', lang)
  ].filter(Boolean);

  return (
    <div style={S.overlay}>
      <div style={S.hdr}>
        <div style={S.title}>{t('sTitle', lang)}</div>
        <button style={S.closeBtn} onClick={onClose}>&times;</button>
      </div>

      {/* Pro Status */}
      <div style={S.section}>
        <div style={S.sectionTitle}>STATUS</div>
        <div style={S.row}>
          <div>
            <div style={S.rowLabel}>WIPULSCAN PRO v5.2</div>
            <div style={S.rowSub}>{isPro ? 'Pro Unlocked' : 'Free Version'}</div>
          </div>
          {isPro ? (
            <span style={S.proBadge}>PRO &#10003;</span>
          ) : (
            <button style={S.upgradeBtn} onClick={onUpgrade}>Upgrade · 1,99 €</button>
          )}
        </div>
      </div>

      <div style={S.section}>
        <div style={S.sectionTitle}>SPRACHE / LANGUAGE / \u8bed\u8a00</div>
        <div style={S.langRow}>
          {LANGUAGES.map(l => (
            <button key={l} style={l === lang ? S.lbOn : S.lb} onClick={() => handleLang(l)}>
              {LANG_SHORT[l] || l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={S.section}>
        <div style={S.sectionTitle}>{t('sFeat', lang)}</div>
        <ul style={S.featList}>
          {feats.map((f, i) => (
            <li key={i} style={S.featItem}><span style={S.featDot}>{'\u25C6'}</span>{f}</li>
          ))}
        </ul>
      </div>

      <div style={S.section}>
        <div style={S.sectionTitle}>DSGVO / GDPR / \u6570\u636e\u4fdd\u62a4</div>
        <div style={S.row}>
          <div>
            <div style={S.rowLabel}>Consent {t('resetBtn', lang)}</div>
            <div style={S.rowSub}>{t('resetSub', lang)}</div>
          </div>
          <button style={S.resetBtn} onClick={resetConsent}>Reset</button>
        </div>
      </div>

      <div style={S.section}>
        <div style={S.sectionTitle}>LIZENZ / LICENSE / \u8bb8\u53ef</div>
        <div style={S.row}>
          <div>
            <div style={S.rowLabel}>WIPULSCAN PRO</div>
            <div style={S.rowSub}>{isPro ? 'Lifetime License · Activated' : 'Single License'}</div>
          </div>
          <span style={S.price}>{isPro ? '\u2713' : '1,99 \u20ac'}</span>
        </div>
        <div style={{...S.row, borderBottom: 'none'}}>
          <div>
            <div style={S.rowLabel}>Privacy Policy</div>
            <div style={S.rowSub}>privacy@cobradynamics.com</div>
          </div>
          <a href="/privacy-policy.html" target="_blank" style={S.resetBtn}>View</a>
        </div>
      </div>
    </div>
  );
}
