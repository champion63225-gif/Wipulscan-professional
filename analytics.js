/**

 * WiFi Hunter - Intrinsic Analytics

 * Privacy-first, GDPR-compliant analytics for profit optimization

 * 

 * KPIs tracked:

 * - App starts

 * - Scan sessions

 * - Feature usage (heatmap, compass, audio)

 * - Purchase events

 * - User engagement (session duration, retention)

 */



// Analytics configuration

const ANALYTICS_CONFIG = {

  enabled: true,

  batchSize: 10,

  flushInterval: 30000, // 30 seconds

  endpoint: '/api/analytics', // In production, replace with your backend

  consentRequired: true

};



// Event queue (for batching)

let eventQueue = [];

let flushTimer = null;



/**

 * Check if analytics consent is given

 */

function hasAnalyticsConsent() {

  return localStorage.getItem('wipulscan_analytics_consent') === 'true';

}



/**

 * Set analytics consent

 */

function setAnalyticsConsent(consent) {

  localStorage.setItem('wipulscan_analytics_consent', consent.toString());

}



/**

 * Track event (privacy-first - no PII)

 * @param {string} eventName - Name of the event

 * @param {object} properties - Event properties (no PII)

 */

function trackEvent(eventName, properties = {}) {

  if (!ANALYTICS_CONFIG.enabled) return;

  if (ANALYTICS_CONFIG.consentRequired && !hasAnalyticsConsent()) return;



  // Remove any potential PII from properties

  const safeProperties = sanitizeProperties(properties);



  const event = {

    event_name: eventName,

    timestamp: Date.now(),

    properties: safeProperties,

    session_id: getSessionId(),

    app_version: '6.0.0'

  };



  eventQueue.push(event);



  // Flush if batch size reached

  if (eventQueue.length >= ANALYTICS_CONFIG.batchSize) {

    flushEvents();

  }

}



/**

 * Sanitize properties to remove PII

 */

function sanitizeProperties(properties) {

  const safe = {};

  const piiPatterns = [/email/i, /phone/i, /name/i, /address/i, /ssn/i];

  

  for (const [key, value] of Object.entries(properties)) {

    // Skip if key matches PII pattern

    if (piiPatterns.some(pattern => pattern.test(key))) continue;

    

    // Sanitize string values

    if (typeof value === 'string') {

      safe[key] = value.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED]');

    } else {

      safe[key] = value;

    }

  }

  

  return safe;

}



/**

 * Get or create session ID

 */

function getSessionId() {

  let sessionId = sessionStorage.getItem('wipulscan_session_id');

  if (!sessionId) {

    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    sessionStorage.setItem('wipulscan_session_id', sessionId);

  }

  return sessionId;

}



/**

 * Flush events to backend

 */

async function flushEvents() {

  if (eventQueue.length === 0) return;



  const events = [...eventQueue];

  eventQueue = [];



  try {

    // In production, send to backend

    // await fetch(ANALYTICS_CONFIG.endpoint, {

    //   method: 'POST',

    //   headers: { 'Content-Type': 'application/json' },

    //   body: JSON.stringify({ events })

    // });

    

    console.log('Analytics flushed:', events.length, 'events');

  } catch (error) {

    console.error('Analytics flush failed:', error);

    // Re-queue events on failure

    eventQueue = [...events, ...eventQueue];

  }

}



/**

 * Start auto-flush timer

 */

function startAutoFlush() {

  if (flushTimer) clearInterval(flushTimer);

  flushTimer = setInterval(flushEvents, ANALYTICS_CONFIG.flushInterval);

}



/**

 * Stop auto-flush timer

 */

function stopAutoFlush() {

  if (flushTimer) {

    clearInterval(flushTimer);

    flushTimer = null;

  }

}



/**

 * Autonomous tracking setup - define KPIs based on app functionality

 */

function autonomousTrackingSetup() {

  // Track app start

  trackEvent('app_start', {

    first_open: !localStorage.getItem('wipulscan_first_open_done'),

    language: localStorage.getItem('wipulscan_lang') || 'de'

  });

  localStorage.setItem('wipulscan_first_open_done', 'true');



  // Track session start

  trackEvent('session_start', {

    timestamp: Date.now()

  });

}



/**

 * Track scan session

 */

function trackScanSession(duration, maxSignal, networkCount) {

  trackEvent('scan_session_completed', {

    duration_seconds: Math.round(duration / 1000),

    max_signal_strength: maxSignal,

    networks_detected: networkCount

  });

}



/**

 * Track feature usage

 */

function trackFeatureUsage(feature) {

  trackEvent('feature_used', {

    feature: feature

  });

}



/**

 * Track purchase (called by monetization.js)

 */

function trackPurchase(productId, price, transactionId) {

  trackEvent('purchase_completed', {

    product_id: productId,

    price: price,

    currency: 'EUR',

    transaction_id: transactionId

  });

}



/**

 * Track paywall view

 */

function trackPaywallView(feature) {

  trackEvent('paywall_viewed', {

    feature: feature

  });

}



/**

 * Track upgrade button click

 */

function trackUpgradeClick(source) {

  trackEvent('upgrade_clicked', {

    source: source

  });

}



/**

 * Calculate KPIs (for dashboard integration)

 * In production, this would query analytics backend

 */

function calculateKPIs() {

  // Query analytics backend for real KPIs

  // This requires backend integration

  return {

    daily_active_users: 0,

    conversion_rate: 0,

    average_session_duration: 0,

    retention_rate: 0

  };

}



// Initialize on load

if (typeof window !== 'undefined') {

  window.addEventListener('load', () => {

    if (hasAnalyticsConsent()) {

      autonomousTrackingSetup();

      startAutoFlush();

    }

  });



  // Flush events on page unload

  window.addEventListener('beforeunload', () => {

    flushEvents();

    stopAutoFlush();

  });

}

