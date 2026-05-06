# WiFi Hunter — Native Build Guide

## Overview
This project uses **Capacitor** to wrap the web app into native Android/iOS apps with **real WiFi scanning**.

| Platform | WiFi Scanning | Notes |
|----------|--------------|-------|
| **Android** | ✅ Full scan (SSID, BSSID, dBm, frequency) | Uses WifiManager |
| **iOS** | ⚠️ Current connection only | Apple restricts WiFi scanning |
| **Web/PWA** | ❌ Simulated signal | Fallback to device orientation |

---

## Prerequisites

- **Node.js** 18+ and npm
- **Android Studio** (for Android builds)
- **Xcode** 14+ (for iOS builds, macOS only)
- **Python 3** (for icon generation)

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Icons (if you have a master image)
```bash
# Place your 1024x1024 icon as icon-master.png, then:
python generate-icons.py
```

### 3. Copy Web Assets
```bash
npx cap sync
```

---

## Android Build

### Build APK
```bash
npx cap open android
# In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK
```

### Or build from command line
```bash
cd android
./gradlew assembleDebug    # Debug APK
./gradlew assembleRelease  # Release APK (needs signing)
```

### Permissions (already configured)
The app requests these permissions at runtime:
- `ACCESS_FINE_LOCATION` — Required for WiFi scanning on Android 10+
- `ACCESS_WIFI_STATE` — Read WiFi state
- `CHANGE_WIFI_STATE` — Trigger WiFi scans
- `NEARBY_WIFI_DEVICES` — Android 12+ nearby devices

---

## iOS Build

### Open in Xcode
```bash
npx cap open ios
```

### Important iOS Notes
- **WiFi scanning is restricted by Apple**. Only the currently connected network info is available.
- The app uses `NEHotspotConfiguration` for limited WiFi features.
- For full WiFi scanning on iOS, you need:
  - Apple MFi program enrollment
  - `com.apple.developer.networking.wifi-info` entitlement
  - Or use CoreWLAN (macOS only)

### Build & Archive
In Xcode:
1. Select target device / "Any iOS Device"
2. Product → Archive
3. Distribute App → App Store Connect

---

## Web Build (GitHub Pages)
```bash
# Already deployed automatically via GitHub Pages
# Just push to main branch
```

---

## Project Structure

```
├── www/                  → Web assets (copied to native projects)
│   └── index.html        → Main app
├── android/              → Android Studio project
│   └── app/src/main/java/.../plugins/
│       └── WifiScanPlugin.java
├── ios/                  → Xcode project
│   └── App/App/Plugins/
│       └── WifiScanPlugin.swift
├── capacitor.config.json → Capacitor config
└── generate-icons.py     → Icon generator script
```

---

## Monetization (Code-Ready)

The app includes UI for:
- **Pro Upgrade** (9,99 € one-time)
- **Pro Subscription** (4,99 €/month)
- **Points & Streaks** system
- **Achievements** (10, 50, 100 hotspots)
- **Share** with referral link

To connect real payments:
1. Android: Integrate Google Play Billing SDK in `WifiScanPlugin.java`
2. iOS: Integrate StoreKit in `WifiScanPlugin.swift`
3. Web: Integrate Stripe or PayPal

---

## Next Steps for Million-App

1. ✅ Web MVP with simulated signal (DONE)
2. ✅ Native Android with real dBm scanning (DONE)
3. ⚠️ iOS limited to current connection (Apple restriction)
4. ⬜ Add real In-App Purchase integration
5. ⬜ Add Firebase backend for hotspot database
6. ⬜ Publish to Google Play Store
7. ⬜ Publish to Apple App Store (with iOS limitations noted)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "WiFi scan failed" | Enable Location permission in Android settings |
| "WiFi is disabled" | Turn on WiFi before scanning |
| iOS shows no networks | Expected — Apple restricts WiFi scanning |
| Build fails | Run `npx cap sync` then rebuild |

---

Built by Cobra Dynamics — Dennis Stein & Christoph Frick
