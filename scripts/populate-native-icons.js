const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function populateNativeIcons() {
  const svgPath = path.join(__dirname, '..', 'public', 'icons', 'icon.svg');
  if (!fs.existsSync(svgPath)) {
    console.error('icon.svg not found!');
    process.exit(1);
  }
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Rendering native icons for iOS & Android...');

  // 1. iOS AppIcon
  const iosIconPath = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png');
  if (fs.existsSync(path.dirname(iosIconPath))) {
    await sharp(svgBuffer)
      .resize(1024, 1024)
      .png({ quality: 100 })
      .toFile(iosIconPath);
    console.log('✓ Updated iOS 1024x1024 AppIcon');
  }

  // 2. Android mipmaps
  const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
  const densities = [
    { folder: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { folder: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { folder: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { folder: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { folder: 'mipmap-xxxhdpi', size: 192, fgSize: 432 }
  ];

  for (const d of densities) {
    const targetFolder = path.join(androidResDir, d.folder);
    if (!fs.existsSync(targetFolder)) continue;

    // Standard icon
    await sharp(svgBuffer)
      .resize(d.size, d.size)
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher.png'));

    // Round icon
    await sharp(svgBuffer)
      .resize(d.size, d.size)
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher_round.png'));

    // Foreground adaptive icon
    await sharp(svgBuffer)
      .resize(d.fgSize, d.fgSize)
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));

    console.log(`✓ Updated Android ${d.folder} (${d.size}x${d.size})`);
  }

  console.log('Native icons setup complete!');
}

populateNativeIcons().catch(console.error);

