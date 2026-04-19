# WIPULSCAN PRO — App Store Listing Template
**Cobra Dynamics · Dennis Stein & Christoph Frick · Langen, Germany**
**Version 5.2.0 · April 2026**

---

## APP NAME
`WIPULSCAN PRO — WiFi Signal Scanner`

## SHORT DESCRIPTION (≤80 chars)
`Real-time WiFi & network scanner with GPS signal trail and AR bubbles.`

---

## FULL DESCRIPTION (Google Play — max 4000 chars)

**WIPULSCAN PRO** is a professional-grade WiFi and network signal scanner with real-time visualization, GPS trail recording, and spatial AR bubble display.

### 🔍 WHAT IT DOES
Scan your wireless environment and instantly see every detected network as an interactive glass bubble — sized and colored by signal strength. Walk around to map signal coverage and let the built-in GPS compass guide you toward stronger reception.

### 📡 CORE FEATURES
- **Real-time signal measurement** via NetworkInformation API — RTT, download speed, connection type
- **Interactive network bubbles** with spring physics — each bubble represents a wireless network, colored green (strong) to red (weak)
- **Signal direction navigator** — the radar divides into 8 compass sectors showing measured signal per direction. A gold arrow points to where you should walk for better signal
- **GPS trail recording** — records your path during scanning, plotting signal quality at each GPS fix
- **Signal trend indicator** — ↑ green when signal improves, ↓ red when it declines
- **Tap-to-expand radar** — tap the small corner radar to open a full-screen navigation view
- **Filter bar** — quickly isolate WiFi, LTE, 5 GHz, or signals ≥ −70 dBm
- **Offline-ready** — full Service Worker caching, works without internet

### 🌍 10 LANGUAGES
German · English · Chinese · Spanish · Hindi · Arabic · Portuguese · French · Russian · Japanese

### 🔒 PRIVACY FIRST
- No personal data collected, stored or transmitted
- All processing is 100% local on your device
- No tracking, no analytics, no third-party servers
- GDPR / DSGVO compliant

### 💎 DESIGN
- OLED-black interface with gold accents
- Cinematic 3.75-second intro
- Haptic feedback
- PWA — installable on home screen without app store

**One-time purchase: €1.99 · No subscriptions · No in-app purchases**

---

## APPLE APP STORE DESCRIPTION (max 4000 chars — same content, slightly reformatted)

WIPULSCAN PRO is a professional WiFi and network signal scanner featuring real-time AR bubble visualization, GPS trail mapping, and a signal direction compass.

**FEATURES**
• Real-time RTT, download speed & connection quality measurement
• Interactive glass bubbles — each wireless network displayed as a physics-driven orb colored by signal strength (green = strong, red = weak)
• GPS signal trail — record your movement path with signal data at each location
• Signal direction compass — 8-sector radar heatmap shows which direction has the strongest signal; gold arrow guides you toward better reception
• Signal trend (↑/↓) shows whether you're walking toward or away from better coverage
• Tap-to-expand radar for full-screen navigation view
• Filter bar: WiFi only, LTE only, strong signals, 5 GHz
• Works fully offline (Service Worker cache)
• 10 interface languages: DE, EN, ZH, ES, HI, AR, PT, FR, RU, JA
• GDPR-compliant — zero data collection

One-time purchase: €1.99. No subscriptions, no in-app purchases.

---

## KEYWORDS (comma-separated, max 100 chars for App Store)
`wifi,signal,scanner,network,GPS,radar,AR,speed test,coverage,analyzer`

---

## PRIVACY POLICY URL
`https://champion63225-gif.github.io/Wipulscan-professional/`
*(Privacy policy text is embedded in the app under Settings → Datenschutzerklärung)*

---

## PERMISSIONS JUSTIFICATION

| Permission | Why needed | App Store text |
|---|---|---|
| **Location (Precise)** | GPS trail recording to map signal coverage as user moves | "Used to record your movement path and display signal strength at each GPS position. Data stays on device." |
| **Location (Always)** | Not needed — only "When in Use" required | N/A |
| **Motion/Orientation** | Compass heading for radar rotation | "Used to orient the signal compass in the correct north direction." |
| **Vibration** | Haptic feedback during scan | "Provides tactile feedback during scanning. Can be disabled in settings." |

**iOS Info.plist keys required:**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>WIPULSCAN uses your location to record signal strength along your path and show you which direction to walk for better WiFi reception.</string>
<key>NSMotionUsageDescription</key>
<string>WIPULSCAN uses motion data to orient the compass in the signal radar.</string>
```

---

## AGE RATING

| Store | Rating | Reason |
|---|---|---|
| Google Play | Everyone (E) | No violence, no user interaction, no external content |
| Apple App Store | 4+ | No objectionable content |

---

## CATEGORY
- **Primary**: Utilities
- **Secondary**: Productivity / Tools

---

## CONTENT RATING QUESTIONNAIRE (Google Play)
- Violence: None
- Sexual content: None
- User-generated content: No
- Sharing personal information: No
- Location sharing: No (stays on device)
- In-app purchases: No
- Ads: No

---

## APP STORE CHECKLIST

- [ ] App icon 1024×1024 PNG (required for both stores)
- [ ] At least 3 screenshots — recommended sizes:
  - iPhone 6.7": 1290×2796 px
  - iPhone 6.5": 1242×2688 px
  - Android: 1080×1920 px minimum
- [ ] Feature graphic (Google Play): 1024×500 px
- [ ] Privacy policy URL live and accessible
- [ ] `assetlinks.json` SHA256 fingerprint filled in (TWA / Play Store)
- [ ] `apple-touch-icon.png` 180×180 px present
- [ ] `icon-192.png` and `icon-512.png` generated from SVG
- [ ] Service Worker tested on real device
- [ ] GPS permission dialog tested (tap "STANDORT FREIGEBEN")
- [ ] All 10 languages manually verified on device

---

## TWA (Trusted Web Activity) — Google Play Store

Build command after installing Bubblewrap:
```bash
bubblewrap init --manifest https://champion63225-gif.github.io/Wipulscan-professional/manifest.json
bubblewrap build
```

Fill in during init:
- Package name: `com.cobradynamics.wipulscanpro`
- App name: `WIPULSCAN PRO`
- Launch URL: `https://champion63225-gif.github.io/Wipulscan-professional/`
- Icon: `icon-512.png`
- Signing key: generate with keytool, then update `.well-known/assetlinks.json`

---

## WHAT STILL NEEDS TO BE DONE

1. **Generate PNG icons** from the SVG files (icon-192.svg, icon-512.svg)  
   Tool: `sharp-cli`, Inkscape, or online SVG-to-PNG converter  
   Sizes needed: 192×192, 512×512, 1024×1024, 180×180 (apple-touch)

2. **Take screenshots** on a real device or simulator  
   Show: Intro screen, bubble scan view, radar expanded, bubble detail sheet, settings

3. **Publish privacy policy** at a public URL (GitHub Pages works)

4. **Run Bubblewrap** to create the Play Store APK/AAB

5. **Create Apple Developer account** and wrap with Capacitor or PWABuilder for App Store

6. **Fill in SHA256** in `.well-known/assetlinks.json` after generating your keystore
