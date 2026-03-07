const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

async function removeWhiteBackground(inputPath, outputPath) {
    try {
        const image = await Jimp.read(inputPath);

        // Define what is "white" (threshold)
        // Values are 0-255. High values mean it catches off-whites too.
        const threshold = 240;

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            const alpha = this.bitmap.data[idx + 3];

            // If the pixel is very close to white, make it transparent
            if (red >= threshold && green >= threshold && blue >= threshold) {
                this.bitmap.data[idx + 3] = 0; // Set Alpha to 0
            }
        });

        await image.writeAsync(outputPath);
        console.log('Background removed and saved to', outputPath);
    } catch (error) {
        console.error('Error removing background:', error);
    }
}

const input = 'C:\\\\Users\\\\muhasebe2\\\\.gemini\\\\antigravity\\\\brain\\\\8f0a1c53-5e26-4393-8f5b-3da32a6e56c9\\\\persis_logo_concept_10_1772110498480.png';
const output = path.join(__dirname, 'public', 'logo.png');

removeWhiteBackground(input, output);
