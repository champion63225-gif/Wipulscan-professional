/**
 * WiFi Hunter - Masterful Monetization System
 * Freemium Model with Pro Purchase and Subscription
 * 
 * Products:
 * - WiFi Hunter Pro (One-time): €9.99 - Unlimited scans, no ads, cloud sync
 * - WiFi Hunter Pro Subscription: €4.99/month - All Pro features + monthly updates
 */

// Product IDs (iOS/Android)
const PRODUCTS = {
  PRO_ONE_TIME: 'de.cobradynamics.wifihunter.pro.onetime',
  PRO_SUBSCRIPTION: 'de.cobradynamics.wifihunter.pro.subscription'
};

// Pricing
const PRICING = {
  PRO_ONE_TIME: 9.99, // EUR
  PRO_SUBSCRIPTION: 4.99 // EUR per month
};

// User entitlements
class UserEntitlements {
  constructor() {
    this.isPro = false;
    this.isSubscription = false;
    this.subscriptionExpiry = null;
    this.purchaseDate = null;
    this.transactionId = null;
    this.loadFromStorage();
  }

  loadFromStorage() {
    const stored = localStorage.getItem('wfh_entitlements');
    if (stored) {
      const data = JSON.parse(stored);
      this.isPro = data.isPro || false;
      this.isSubscription = data.isSubscription || false;
      this.subscriptionExpiry = data.subscriptionExpiry || null;
      this.purchaseDate = data.purchaseDate || null;
      this.transactionId = data.transactionId || null;
    }
  }

  saveToStorage() {
    localStorage.setItem('wfh_entitlements', JSON.stringify({
      isPro: this.isPro,
      isSubscription: this.isSubscription,
      subscriptionExpiry: this.subscriptionExpiry,
      purchaseDate: this.purchaseDate,
      transactionId: this.transactionId
    }));
  }

  hasProAccess() {
    if (this.isPro) {
      // Check subscription expiry if subscription
      if (this.isSubscription && this.subscriptionExpiry) {
        return new Date(this.subscriptionExpiry) > new Date();
      }
      return true;
    }
    return false;
  }

  grantProAccess(productId, transactionId) {
    this.isPro = true;
    this.purchaseDate = new Date().toISOString();
    this.transactionId = transactionId;

    if (productId === PRODUCTS.PRO_SUBSCRIPTION) {
      this.isSubscription = true;
      // Subscription expires in 1 month
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);
      this.subscriptionExpiry = expiry.toISOString();
    } else {
      this.isSubscription = false;
      this.subscriptionExpiry = null;
    }

    this.saveToStorage();
  }

  revokeProAccess() {
    this.isPro = false;
    this.isSubscription = false;
    this.subscriptionExpiry = null;
    this.saveToStorage();
  }
}

// Monetization Manager
class MonetizationManager {
  constructor() {
    this.entitlements = new UserEntitlements();
    this.purchaseListeners = [];
  }

  /**
   * Check if user has Pro access
   */
  isProUser() {
    return this.entitlements.hasProAccess();
  }

  /**
   * Purchase Pro (One-time)
   * In production, this would call IAP SDK (StoreKit / Billing Library)
   */
  purchaseProOneTime() {
    return new Promise((resolve, reject) => {
      // Simulate IAP purchase
      // In production: await IAP.purchase(PRODUCTS.PRO_ONE_TIME)
      
      setTimeout(() => {
        const transactionId = 'txn_' + Date.now();
        this.entitlements.grantProAccess(PRODUCTS.PRO_ONE_TIME, transactionId);
        
        // Track purchase (Intrinsic Analytics)
        this.trackPurchase(PRODUCTS.PRO_ONE_TIME, PRICING.PRO_ONE_TIME, transactionId);
        
        this.notifyPurchaseListeners(PRODUCTS.PRO_ONE_TIME);
        resolve({ success: true, transactionId });
      }, 1000);
    });
  }

  /**
   * Purchase Pro Subscription
   * In production, this would call IAP SDK (StoreKit / Billing Library)
   */
  purchaseProSubscription() {
    return new Promise((resolve, reject) => {
      // Simulate IAP purchase
      // In production: await IAP.purchase(PRODUCTS.PRO_SUBSCRIPTION)
      
      setTimeout(() => {
        const transactionId = 'sub_' + Date.now();
        this.entitlements.grantProAccess(PRODUCTS.PRO_SUBSCRIPTION, transactionId);
        
        // Track purchase (Intrinsic Analytics)
        this.trackPurchase(PRODUCTS.PRO_SUBSCRIPTION, PRICING.PRO_SUBSCRIPTION, transactionId);
        
        this.notifyPurchaseListeners(PRODUCTS.PRO_SUBSCRIPTION);
        resolve({ success: true, transactionId });
      }, 1000);
    });
  }

  /**
   * Restore purchases
   * In production, this would call IAP SDK to restore previous purchases
   */
  restorePurchases() {
    return new Promise((resolve, reject) => {
      // In production: await IAP.restorePurchases()
      
      // For demo, just check local storage
      if (this.entitlements.hasProAccess()) {
        resolve({ success: true, isPro: true });
      } else {
        resolve({ success: false, isPro: false });
      }
    });
  }

  /**
   * Track purchase (Intrinsic Analytics)
   */
  trackPurchase(productId, price, transactionId) {
    if (typeof trackEvent === 'function') {
      trackEvent('purchase_completed', {
        product_id: productId,
        price: price,
        currency: 'EUR',
        transaction_id: transactionId
      });
    }
  }

  /**
   * Add purchase listener
   */
  onPurchase(listener) {
    this.purchaseListeners.push(listener);
  }

  /**
   * Notify purchase listeners
   */
  notifyPurchaseListeners(productId) {
    this.purchaseListeners.forEach(listener => listener(productId));
  }

  /**
   * Show paywall for Pro features
   */
  showPaywall(feature) {
    return {
      isLocked: !this.isProUser(),
      feature: feature,
      callToAction: 'Upgrade to Pro to unlock this feature'
    };
  }
}

// Global instance
const monetization = new MonetizationManager();
