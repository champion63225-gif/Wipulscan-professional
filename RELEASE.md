# WIPULSCAN PRO – Release Guide

## Architecture
- **Web Core:** React 18 + Vite (src/)
- **Native Shell:** Capacitor 5 (android/, ios/)
- **IAP:** cordova-plugin-purchase (non-consumable €1.99)
- **App ID:** com.cobradynamics.wipulscan

## Prerequisites
- Node.js 18+
- Android Studio (for Android builds)
- Xcode 15+ (for iOS builds, macOS only)
- Apple Developer Account ($99/year)
- Google Play Developer Account ($25 one-time)

---

## 1. Initial Setup (once)

```bash
# Build web assets
npm run build

# Initialize Capacitor (if not done)
npx cap init "WIPULSCAN PRO" com.cobradynamics.wipulscan --web-dir dist

# Add platforms
npx cap add android
npx cap add ios
```

## 2. Android Setup

### 2.1 Native Plugin
Copy `native/android/WifiInfoPlugin.java` to:
`android/app/src/main/java/com/cobradynamics/wipulscan/WifiInfoPlugin.java`

Register in `MainActivity.java`:
```java
import com.cobradynamics.wipulscan.WifiInfoPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WifiInfoPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
```

### 2.2 Permissions
Add contents of `native/android/AndroidManifest-permissions.xml` to `AndroidManifest.xml`

### 2.3 In-App Purchase
In Google Play Console:
1. Create In-App Product: `wipulscan_pro_unlock` (non-consumable, €1.99)
2. Activate the product
3. Add test accounts for internal testing

### 2.4 Build & Sign
```bash
npm run release:android
npx cap open android
```
In Android Studio:
- Build → Generate Signed Bundle (AAB)
- Use upload keystore
- Upload AAB to Play Console

---

## 3. iOS Setup

### 3.1 Permissions
Add contents of `native/ios/Info-plist-additions.xml` to `ios/App/App/Info.plist`

### 3.2 In-App Purchase
In App Store Connect:
1. Create In-App Purchase: `wipulscan_pro_unlock` (non-consumable, $1.99)
2. Submit for review
3. Configure Sandbox test accounts

### 3.3 Build & Sign
```bash
npm run release:ios
npx cap open ios
```
In Xcode:
- Select your Team/Signing
- Product → Archive
- Distribute to App Store Connect

---

## 4. Store Checklist

### Both Platforms
- [ ] App icon (1024x1024 master, all sizes auto-generated)
- [ ] Screenshots (min 2 per device class)
- [ ] Privacy Policy URL (host privacy-policy.html)
- [ ] Support email
- [ ] Store description (see store/listing-en.md and store/listing-de.md)

### Google Play
- [ ] Feature graphic (1024x500)
- [ ] Content rating questionnaire
- [ ] Target audience and content
- [ ] Data safety section
- [ ] Internal testing → Closed testing → Production

### App Store
- [ ] App Preview video (optional but recommended)
- [ ] Age Rating
- [ ] App Privacy (data types: None collected)
- [ ] Review notes: "This app measures WiFi signal quality, not individual networks"

---

## 5. IAP Testing

### Android
1. Add Gmail to "License Testing" in Play Console
2. Upload to Internal Testing track
3. Install via Play Store link
4. Purchase will be in sandbox mode

### iOS
1. Create Sandbox Tester in App Store Connect
2. Sign out of App Store on device
3. Trigger purchase in app
4. Sign in with sandbox account when prompted

---

## 6. Version Management
- `package.json` version → shown in app info
- Android: `android/app/build.gradle` versionCode + versionName
- iOS: `ios/App/App/Info.plist` CFBundleShortVersionString + CFBundleVersion
- Keep all three in sync!

---

## Price: €1.99 (non-consumable, one-time)
Product ID: `wipulscan_pro_unlock`
