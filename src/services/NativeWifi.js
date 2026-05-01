// NATIVE WIFI BRIDGE – Platform-specific signal measurement
// Android: real RSSI via WifiManager (Capacitor plugin bridge)
// iOS: connection quality via speed/latency proxy
// Web: HTTP-based RTT + download measurement (existing useNetwork)

const IS_NATIVE = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
const PLATFORM = IS_NATIVE ? window.Capacitor.getPlatform() : 'web';

// Android native WiFi RSSI via Capacitor plugin bridge
async function getAndroidRSSI() {
  try {
    const result = await window.Capacitor.Plugins.WifiInfo?.getRSSI();
    if (result && typeof result.rssi === 'number') {
      return { rssi: result.rssi, ssid: result.ssid || '', bssid: result.bssid || '' };
    }
  } catch { /* plugin not available */ }
  return null;
}

// Convert RSSI dBm to signal percentage
function rssiToPercent(rssi) {
  if (rssi >= -30) return 99;
  if (rssi <= -95) return 2;
  return Math.round(((rssi + 95) / 65) * 97 + 2);
}

// iOS: quality from speed + latency (proxy metric)
function qualityFromMetrics(rtt, dlMbps) {
  let score = 50;
  if (rtt < 20) score += 30;
  else if (rtt < 50) score += 20;
  else if (rtt < 100) score += 10;
  else if (rtt > 200) score -= 15;
  if (dlMbps > 50) score += 20;
  else if (dlMbps > 20) score += 12;
  else if (dlMbps > 5) score += 5;
  else if (dlMbps < 1) score -= 20;
  return Math.max(2, Math.min(99, score));
}

export { IS_NATIVE, PLATFORM, getAndroidRSSI, rssiToPercent, qualityFromMetrics };
