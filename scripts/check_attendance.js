const http = require('http');

http.get('http://localhost:3000/attendance', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        // Find all "message" occurrences
        const messages = [...data.matchAll(/"message":"([^"]{1,500})"/g)];
        messages.forEach((m, i) => console.log(`Message ${i}:`, m[1]));

        // Find digest
        const digests = [...data.matchAll(/"digest":"([^"]+)"/g)];
        digests.forEach((d, i) => console.log(`Digest ${i}:`, d[1]));

        // Find stack  
        const stacks = [...data.matchAll(/"stack":"([^"]{1,2000})"/g)];
        stacks.forEach((s, i) => console.log(`Stack ${i}:`, s[1].replace(/\\n/g, '\n').substring(0, 500)));
    });
}).on('error', (e) => {
    console.error('Request error:', e.message);
});
