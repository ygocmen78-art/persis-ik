const pngToIcoModule = require('png-to-ico');
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'build', 'icon.png');
const dest = path.join(__dirname, 'build', 'icon.ico');

if (!fs.existsSync(src)) {
    console.error('Source icon.png not found at ' + src);
    process.exit(1);
}

// Handle potential ESM default export in some versions of the package
const convert = typeof pngToIcoModule === 'function' ? pngToIcoModule : pngToIcoModule.default;

if (typeof convert !== 'function') {
    console.error('png-to-ico is not a function. Module exports:', pngToIcoModule);
    process.exit(1);
}

convert(src)
    .then(buf => {
        fs.writeFileSync(dest, buf);
        console.log('Successfully created icon.ico at ' + dest);
    })
    .catch(err => {
        console.error('Error creating ico:', err);
        process.exit(1);
    });
