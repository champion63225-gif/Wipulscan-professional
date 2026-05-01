// PAYWALL – Pro upgrade gate (1.99€ non-consumable)
import React, { useState } from 'react';
import { purchase, restore, PRODUCT_PRICE } from '../services/PurchaseService';
import { t } from '../i18n';

export default function Paywall({ lang, onUnlock, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleBuy = async () => {
    setLoading(true);
    setError(null);
    const result = await purchase();
    setLoading(false);
    if (result.success) {
      onUnlock();
    } else {
      setError(result.error);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    setError(null);
    const ok = await restore();
    setLoading(false);
    if (ok) onUnlock();
    else setError('no_previous_purchase');
  };

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <button style={S.closeBtn} onClick={onClose}>&times;</button>

        {/* Icon */}
        <div style={S.icon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          </svg>
        </div>

        <div style={S.title}>WIPULSCAN PRO</div>
        <div style={S.subtitle}>Full AR Heatmap Scanner</div>

        {/* Features */}
        <div style={S.features}>
          <div style={S.feat}><span style={S.check}>&#10003;</span> Unlimited AR Scans</div>
          <div style={S.feat}><span style={S.check}>&#10003;</span> Real-time Signal Measurement</div>
          <div style={S.feat}><span style={S.check}>&#10003;</span> 3D Cloud Visualization</div>
          <div style={S.feat}><span style={S.check}>&#10003;</span> Camera + Gyroscope Tracking</div>
          <div style={S.feat}><span style={S.check}>&#10003;</span> 12 Languages</div>
          <div style={S.feat}><span style={S.check}>&#10003;</span> No Subscription · One-time</div>
        </div>

        {/* Price + Buy */}
        <button style={S.buyBtn} onClick={handleBuy} disabled={loading}>
          {loading ? '...' : `Unlock Pro · €${PRODUCT_PRICE}`}
        </button>

        {/* Restore */}
        <button style={S.restoreBtn} onClick={handleRestore} disabled={loading}>
          Restore Purchase
        </button>

        {error && <div style={S.error}>{error}</div>}

        <div style={S.legal}>
          One-time purchase · No subscription · No recurring charges
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay: { position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(0,0,5,.97)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { maxWidth: '360px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', position: 'relative' },
  closeBtn: { position: 'absolute', top: '-10px', right: '0', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(212,175,55,.2)', background: 'transparent', color: 'var(--gold)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  icon: { marginBottom: '8px', opacity: 0.85 },
  title: { fontFamily: 'var(--font-ui)', fontSize: '20px', fontWeight: 700, letterSpacing: '.16em', background: 'linear-gradient(90deg,var(--gold-lt),var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle: { fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'rgba(255,255,255,.35)', letterSpacing: '.06em', marginTop: '-4px' },
  features: { width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 0', borderTop: '1px solid rgba(212,175,55,.08)', borderBottom: '1px solid rgba(212,175,55,.08)' },
  feat: { fontFamily: 'var(--font-ui)', fontSize: '12px', color: 'rgba(255,255,255,.55)', display: 'flex', alignItems: 'center', gap: '10px' },
  check: { color: 'var(--green)', fontSize: '13px', fontWeight: 700 },
  buyBtn: { width: '100%', fontFamily: 'var(--font-ui)', fontSize: '15px', fontWeight: 700, letterSpacing: '.1em', padding: '14px 0', borderRadius: '28px', border: 'none', background: 'linear-gradient(135deg,var(--gold-lt),var(--gold),var(--gold-dk))', color: '#000', cursor: 'pointer', boxShadow: '0 4px 20px rgba(212,175,55,.3)', textTransform: 'uppercase', marginTop: '8px' },
  restoreBtn: { fontFamily: 'var(--font-data)', fontSize: '10px', letterSpacing: '.1em', padding: '8px 18px', borderRadius: '16px', border: '1px solid rgba(212,175,55,.15)', background: 'transparent', color: 'rgba(212,175,55,.4)', cursor: 'pointer', textTransform: 'uppercase' },
  error: { fontFamily: 'var(--font-data)', fontSize: '9px', color: 'var(--red)', marginTop: '4px' },
  legal: { fontFamily: 'var(--font-data)', fontSize: '8px', color: 'rgba(255,255,255,.18)', textAlign: 'center', marginTop: '8px', letterSpacing: '.04em' }
};
