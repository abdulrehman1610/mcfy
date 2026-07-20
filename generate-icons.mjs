import sharp from 'sharp';

const svgPath = './assets/images/logo.svg';

async function run() {
  await sharp(svgPath).resize(1024, 1024).png().toFile('./assets/images/icon-v2.png');
  await sharp(svgPath).resize(1024, 1024).png().toFile('./assets/images/splash-v2.png');
  await sharp(svgPath).resize(192, 192).png().toFile('./assets/images/favicon.png');
  await sharp(svgPath).resize(1080, 1080).png().toFile('./assets/images/android-icon-foreground.png');
  
  await sharp({
    create: {
      width: 1080,
      height: 1080,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  }).png().toFile('./assets/images/android-icon-background.png');
  
  await sharp(svgPath).resize(1080, 1080).grayscale().png().toFile('./assets/images/android-icon-monochrome.png');
  console.log('Icons generated successfully');
}

run();
