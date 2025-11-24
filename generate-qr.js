const QRCode = require('qrcode');
const fs = require('fs');

const url = 'https://your-app-name.onrender.com';

async function generateQR() {
  try {
    await QRCode.toFile('qr-code.png', url, {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 1,
      margin: 2,
      width: 500,
      color: {
        dark: '#2A5220',
        light: '#FFFFFF'
      }
    });

    await QRCode.toFile('qr-code-large.png', url, {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 1,
      margin: 2,
      width: 1000,
      color: {
        dark: '#2A5220',
        light: '#FFFFFF'
      }
    });

    console.log('✅ QR Codes generated successfully!');
    console.log('');
    console.log('Files created:');
    console.log('- qr-code.png (500x500px - for digital display)');
    console.log('- qr-code-large.png (1000x1000px - for printing)');
    console.log('');
    console.log('QR Code URL:', url);
    console.log('');
    console.log('⚠️  IMPORTANT: Update the URL in generate-qr.js once you deploy to Render!');

  } catch (error) {
    console.error('Error generating QR codes:', error);
  }
}

generateQR();