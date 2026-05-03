const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const dir = 'dataaa';

function probeFiles() {
    const files = fs.readdirSync(dir);
    console.log('Files in directory:', files);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        const buffer = fs.readFileSync(filePath);
        console.log(`\n--- File: ${file} (${stats.size} bytes) ---`);
        console.log('Magic Number (Hex):', buffer.slice(0, 8).toString('hex'));

        if (file.endsWith('.csv') || file.endsWith('.xlsx')) {
            try {
                const workbook = XLSX.read(buffer, { type: 'buffer' });
                console.log('Workbook Sheets:', workbook.SheetNames);
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(firstSheet);
                console.log('Number of rows in first sheet:', data.length);
                if (data.length > 0) {
                    console.log('First Row Sample:', JSON.stringify(data[0]));
                }
            } catch (e) {
                console.log('XLSX Read Error:', e.message);
            }
        }
    });
}

probeFiles();
