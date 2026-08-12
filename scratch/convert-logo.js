const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(__dirname, '..', 'assets');
const svgPath = path.join(assetsDir, 'mylogo.svg');

async function convert() {
  console.log('Starting conversion of mylogo.svg...');
  
  if (!fs.existsSync(svgPath)) {
    console.error('mylogo.svg not found in assets!');
    return;
  }

  // 1. App Icon (1024x1024) - standard icon
  await sharp(svgPath)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('Generated icon.png');

  // 2. Android Adaptive Foreground (1024x1024)
  // Adaptive icon foreground should have some padding to fit inside safe zone (usually 66% of the size)
  // Let's resize mylogo to 660x660 and put it on a 1024x1024 transparent canvas
  const foregroundImage = await sharp(svgPath)
    .resize(660, 660)
    .png()
    .toBuffer();
    
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: foregroundImage }])
    .png()
    .toFile(path.join(assetsDir, 'android-icon-foreground.png'));
  console.log('Generated android-icon-foreground.png');

  // 3. Splash Icon (1024x1024 or 512x512)
  // Let's make the splash icon centered with appropriate padding
  const splashSubImage = await sharp(svgPath)
    .resize(512, 512)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: splashSubImage }])
    .png()
    .toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('Generated splash-icon.png');

  // 4. Favicon (48x48)
  await sharp(svgPath)
    .resize(48, 48)
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('Generated favicon.png');

  console.log('Logo conversions completed successfully!');
}

convert().catch(err => {
  console.error('Error during conversion:', err);
});
