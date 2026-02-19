const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Simple blue pixel PNG
const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==', 'base64');

const files = [
    'icon.png',
    'splash-icon.png',
    'adaptive-icon.png',
    'favicon.png'
];

files.forEach(file => {
    const filePath = path.join(assetsDir, file);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, pngBuffer);
        console.log(`Created ${file}`);
    } else {
        console.log(`Skipped ${file} (exists)`);
    }
});
