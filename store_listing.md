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
| **Camera** | AR overlay — camera feed behind heatmap visualization | "Used for the AR mode to display the camera feed behind signal heatmaps. Video is never recorded or uploaded." |
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

- [x] App icon 1024×1024 PNG → `icon-1024.png` ✓
- [x] Screenshots generated → `screenshots/` folder ✓
  - iPhone 6.7": `screen-iphone67-1290x2796.png`
  - iPhone 6.5": `screen-iphone65-1242x2688.png`
  - Android: `screen-android-1080x1920.png`
- [x] Feature graphic (Google Play): 1024×500 px → `feature-graphic.png` ✓
- [ ] Privacy policy URL live and accessible — push to GitHub Pages
- [x] `assetlinks.json` SHA256 fingerprint filled in ✓ `93:CD:0B:08:…`
- [x] `apple-touch-icon.png` 180×180 px present ✓
- [x] `icon-192.png` and `icon-512.png` generated from SVG ✓
- [ ] Service Worker tested on real device
- [ ] GPS permission dialog tested (tap "STANDORT FREIGEBEN")
- [ ] All 10 languages manually verified on device

---

## TWA (Trusted Web Activity) — Google Play Store

**Keystore already generated** — `android.keystore`
- Alias: `wipulscan` · Password: `wipulscan2026`
- SHA256: `93:CD:0B:08:F0:79:BE:F6:14:ED:FD:8E:FC:87:A5:58:83:69:0E:E9:87:D0:66:DC:9E:02:DC:D1:91:5E:35:6C`

**Android project already generated** — `android-twa/`

To build the AAB manually:
```bash
cd android-twa
set ANDROID_HOME=C:\Users\STEIN\AppData\Local\Android\Sdk
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
gradlew.bat bundleRelease
```
*Note: use Android Studio's JBR (Java 21), not oracleJdk-26 (Java 26 is too new for Gradle 8.11)*
Output: `android-twa/app/build/outputs/bundle/release/app-release.aab`

Then sign with:
```bash
jarsigner -keystore ..\android.keystore -storepass wipulscan2026 -keypass wipulscan2026 ^
  app\build\outputs\bundle\release\app-release.aab wipulscan
```

Upload `app-release.aab` to Google Play Console.

---

## iOS — App Store

**Requires:** Apple Developer account ($99/yr) + Mac with Xcode

Steps:
1. Go to **https://www.pwabuilder.com**
2. Enter: `https://champion63225-gif.github.io/Wipulscan-professional/`
3. Click **Package for stores → iOS**
4. Download the generated Xcode project zip
5. Open in Xcode on a Mac → set your Developer Team
6. **Archive → Distribute App → App Store Connect**

---

## WHAT STILL NEEDS TO BE DONE

1. **Push to GitHub Pages** — `git push` to publish the app and activate the privacy policy URL

2. **Feature graphic** (Google Play only) — 1024×500 px JPG/PNG  
   Show: WIPULSCAN PRO logo on dark background with signal bubble visualization  
   Tools: Canva / Figma / Photoshop

3. **Upload AAB to Google Play Console** — `wipulscan-release.aab` is ready (1.6 MB)  
   Go to: Play Console → Create app → Release → Production → Upload AAB

4. **iOS App Store** — use PWABuilder web tool (see above) + Apple Developer account ($99/yr)

5. **Test on real device** — verify GPS dialog, 10 languages, Service Worker offline mode
