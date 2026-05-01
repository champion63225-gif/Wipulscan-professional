# WIPULSCAN PRO – Flutter Cross-Platform App

## Architecture
```
lib/
├── main.dart                  # Entry point + boot flow
├── theme.dart                 # Colors, theme, signal helpers
├── models/
│   └── wifi_sample.dart       # 3D WiFi measurement data model
├── services/
│   ├── wifi_service.dart      # WiFi measurement (Android RSSI + iOS HTTP proxy)
│   ├── motion_service.dart    # Gyro orientation + step detection
│   └── purchase_service.dart  # IAP (€1.99 non-consumable)
├── screens/
│   ├── consent_screen.dart    # GDPR/Privacy consent
│   ├── intro_screen.dart      # Cinematic brand intro + sound
│   ├── ar_heatmap_screen.dart # Main AR camera + clouds + UI
│   └── paywall_screen.dart    # Pro upgrade gate
└── widgets/
    └── cloud_painter.dart     # 3D→2D cloud projection renderer
```

## Platform Differences

| Feature | Android | iOS |
|---------|---------|-----|
| WiFi RSSI | Real dBm via `network_info_plus` | Not available (Apple restriction) |
| Signal Source | 70% RSSI + 30% HTTP quality | 100% HTTP speed/latency proxy |
| Camera | `camera` plugin (back camera) | `camera` plugin (back camera) |
| Gyroscope | `sensors_plus` | `sensors_plus` |
| IAP | Google Play Billing | StoreKit |

## Setup

### Prerequisites
- Flutter SDK 3.16+
- Android Studio (for Android)
- Xcode 15+ (for iOS, macOS only)

### Install Dependencies
```bash
cd flutter_app
flutter pub get
```

### Run (Debug)
```bash
# Android
flutter run -d android

# iOS
flutter run -d ios
```

### Build Release

#### Android (AAB for Play Store)
```bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

#### iOS (IPA for App Store)
```bash
flutter build ipa --release
# Output: build/ios/ipa/WIPULSCAN PRO.ipa
```

## In-App Purchase Setup

### Product ID: `wipulscan_pro_unlock`
- Type: Non-consumable
- Price: €1.99

### Google Play Console
1. Go to Monetize → Products → In-app products
2. Create product ID: `wipulscan_pro_unlock`
3. Set price: €1.99
4. Activate

### App Store Connect
1. Go to Features → In-App Purchases
2. Create: Non-Consumable, ID: `wipulscan_pro_unlock`
3. Set price tier: €1.99
4. Submit for review

## Store Checklist
- [ ] App icon 1024×1024 (see `assets/icon/`)
- [ ] Screenshots (min 2 per device class)
- [ ] Privacy Policy URL
- [ ] Store descriptions (see `../store/listing-de.md` and `listing-en.md`)
- [ ] Signing keys (Android keystore + iOS certificates)
- [ ] In-App Purchase product created in both stores
- [ ] Internal testing (Play Console / TestFlight)

## Sound Assets
Place `jingle-intro-2.mp3` in `assets/sounds/`
(Copy from web project's `public/` folder)

## App Icon
Place `app_icon.png` (1024×1024) in `assets/icon/`
Then run: `flutter pub run flutter_launcher_icons`
