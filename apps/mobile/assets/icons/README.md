# WakaBoard app icon assets

Source: the final **Code Rhythm** glyph in the [Figma brand sheet](https://www.figma.com/design/F9Ewx6499vHvmxpQYHOCDX/Fitness-App--Community-?node-id=2103-2), node `2103:90`. The original four-path export is in `../icon-source/figma-master-glyph.svg`.

Brand colors: forest `#0A382F`, mint `#5EEAD4`, white `#FFFFFF`, amber `#F59E0B`.

## Android

- `android-foreground.png`: transparent adaptive icon layer, inset within the safe area for launcher masks.
- `android-monochrome.png`: white single-color alpha shape with a transparent cutout for the amber beacon. Android supplies the actual themed color.
- `android-legacy.png`: full-color square icon for Android launcher fallbacks.

These are 1024 × 1024 PNGs and are connected in `apps/mobile/app.json`. The adaptive background is the forest color in app config. The SVG files beside them are editable vector sources.

## iOS Icon Composer

Import these aligned 1024 × 1024 PNGs as separate layers, in this order:

1. `ios-composer/background.png`
2. `ios-composer/foreground-glyph.png`
3. `ios-composer/amber-beacon.png` (optional accent)

The source SVGs are alongside the PNGs. Keep the canvas alignment and let Icon Composer apply the platform mask and appearance treatments. The iOS icon is deliberately not connected to Expo config yet; add the completed Icon Composer export when it is ready.
