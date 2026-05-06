# Screenshot Generierung — Playwright Befehle

## Installation
```bash
npm install -g playwright
npx playwright install chromium
```

## iPhone 14 Pro Max (1290×2796)
```bash
npx playwright screenshot --viewport-size="1290,2796" --wait-for-timeout=5000 --full-page https://champion63225-gif.github.io/Wipulscan-professional/ shot-iphone67-1.png
```

## iPhone 14/15 (1179×2556)
```bash
npx playwright screenshot --viewport-size="1179,2556" --wait-for-timeout=5000 --full-page https://champion63225-gif.github.io/Wipulscan-professional/ shot-iphone61-1.png
```

## Android Phone (1080×1920)
```bash
npx playwright screenshot --viewport-size="1080,1920" --wait-for-timeout=5000 --full-page https://champion63225-gif.github.io/Wipulscan-professional/ shot-android-1.png
```

## Batch-Script (alle Größen)
```bash
URL="https://champion63225-gif.github.io/Wipulscan-professional/"
npx playwright screenshot --viewport-size="1290,2796" --wait-for-timeout=8000 "$URL" shots/iphone67-scene1.png
npx playwright screenshot --viewport-size="1179,2556" --wait-for-timeout=8000 "$URL" shots/iphone61-scene1.png
npx playwright screenshot --viewport-size="1080,1920" --wait-for-timeout=8000 "$URL" shots/android-scene1.png
npx playwright screenshot --viewport-size="1242,2688" --wait-for-timeout=8000 "$URL" shots/iphone65-scene1.png
```

## Manuelle Screenshots (kostenlos)
1. Chrome DevTools öffnen (F12)
2. Device Toolbar aktivieren (Ctrl+Shift+M)
3. Device wählen: "iPhone 14 Pro Max"
4. Seite laden: `https://champion63225-gif.github.io/Wipulscan-professional/`
5. Rechtsklick → "Screenshot node" oder Print Screen

## Tipps für beste Ergebnisse
- **Dark Mode** aktivieren im OS → App sieht edler aus
- **Safari/Chrome** im Privatmodus → keine Cookies/Extensions
- **Batterie-Symbol ausblenden** (Chrome DevTools → Settings → Preferences → Uncheck "Show battery status")
- **Status bar sauber**: Nur Uhrzeit und Signal

