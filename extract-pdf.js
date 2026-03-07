const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'C:\\Users\\muhasebe2\\.gemini\\antigravity\\brain\\f40c618c-2626-467c-b9f1-b87ad268c141\\.tempmediaStorage\\8246a6c9cf04a2e2.pdf';

async function extractText() {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);

        // Output text to console
        console.log(data.text);
    } catch (error) {
        console.error("Error extracting text:", error);
    }
}

extractText();
