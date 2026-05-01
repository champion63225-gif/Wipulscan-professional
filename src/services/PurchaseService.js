// IN-APP PURCHASE SERVICE – 1.99€ non-consumable unlock
// Uses cordova-plugin-purchase via Capacitor bridge
// Product ID must match Play Store Console + App Store Connect

const PRODUCT_ID = 'wipulscan_pro_unlock';
const PRODUCT_PRICE = '1.99';

let _store = null;
let _isPro = false;
let _listeners = [];

function readLS(key) { try { return localStorage.getItem(key); } catch { return null; } }
function writeLS(key, val) { try { localStorage.setItem(key, val); } catch { /* noop */ } }

// Check if Pro is unlocked (local cache + store verification)
function isPro() {
  if (_isPro) return true;
  const cached = readLS('wps_pro');
  if (cached === '1') { _isPro = true; return true; }
  return false;
}

function setPro(val) {
  _isPro = val;
  writeLS('wps_pro', val ? '1' : '0');
  _listeners.forEach(fn => { try { fn(val); } catch { /* noop */ } });
}

function onProChange(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(f => f !== fn); };
}

// Initialize IAP store (call once at app start)
async function initStore() {
  if (typeof window === 'undefined') return;
  if (!window.CdvPurchase) {
    console.log('[IAP] CdvPurchase not available (web mode)');
    return;
  }

  _store = window.CdvPurchase.store;
  const { Platform, ProductType } = window.CdvPurchase;

  _store.register([{
    id: PRODUCT_ID,
    type: ProductType.NON_CONSUMABLE,
    platform: Platform.AUTO
  }]);

  _store.when()
    .productUpdated(() => { console.log('[IAP] Product updated'); })
    .approved(transaction => {
      console.log('[IAP] Purchase approved');
      setPro(true);
      transaction.finish();
    })
    .verified(receipt => {
      console.log('[IAP] Receipt verified');
      setPro(true);
    });

  await _store.initialize([Platform.AUTO]);
  await _store.update();

  // Check if already owned
  const product = _store.get(PRODUCT_ID);
  if (product && product.owned) {
    setPro(true);
  }
}

// Trigger purchase flow
async function purchase() {
  if (!_store) {
    console.warn('[IAP] Store not initialized');
    // Web fallback: simulate purchase for testing
    if (!window.CdvPurchase) {
      setPro(true);
      return { success: true, simulated: true };
    }
    return { success: false, error: 'store_not_ready' };
  }

  try {
    const product = _store.get(PRODUCT_ID);
    if (!product) return { success: false, error: 'product_not_found' };
    if (product.owned) { setPro(true); return { success: true }; }

    const offer = product.getOffer();
    if (!offer) return { success: false, error: 'no_offer' };

    await _store.order(offer);
    return { success: true };
  } catch (err) {
    console.error('[IAP] Purchase error:', err);
    return { success: false, error: err.message || 'purchase_failed' };
  }
}

// Restore previous purchases
async function restore() {
  if (!_store) return;
  try {
    await _store.restorePurchases();
    const product = _store.get(PRODUCT_ID);
    if (product && product.owned) {
      setPro(true);
      return true;
    }
  } catch (err) {
    console.error('[IAP] Restore error:', err);
  }
  return false;
}

export { isPro, setPro, onProChange, initStore, purchase, restore, PRODUCT_ID, PRODUCT_PRICE };
