const fs = require('fs');
const path = require('path');

const dir = 'dataaa';
const namesToSearch = ['ASAD', 'SALMA', 'Rabiaa', 'abdelqader', '17-02', '2026', '2024'];

function searchInFiles() {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        if (file === 'sample.txt') return;
        const filePath = path.join(dir, file);
        const buffer = fs.readFileSync(filePath);

        console.log(`\n--- Searching in ${file} ---`);

        // Try simple string match in different encodings
        const encodings = ['utf8', 'utf16le', 'latin1'];

        encodings.forEach(enc => {
            const content = buffer.toString(enc);
            const found = namesToSearch.filter(name => content.includes(name));
            if (found.length > 0) {
                console.log(`Found using ${enc}: ${found.join(', ')}`);
                // Print a snippet around the first found name
                const index = content.indexOf(found[0]);
                console.log(`Snippet: ${content.substring(Math.max(0, index - 50), Math.min(content.length, index + 100)).replace(/\n/g, ' ')}`);
            }
        });

        // If it's a proprietary binary format, search for hex patterns of names
        namesToSearch.forEach(name => {
            const hex = Buffer.from(name).toString('hex');
            if (buffer.toString('hex').includes(hex)) {
                console.log(`Hex Pattern for "${name}" found in ${file}`);
            }
        });
    });
}

searchInFiles();
