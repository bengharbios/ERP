const fs = require('fs');
const content = fs.readFileSync('c:/Users/Al Salam/Desktop/Coding/institute-erp/backend/prisma/schema.prisma', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.trim().startsWith('model Employee')) {
        console.log(`Found at line: ${index + 1}`);
    }
});
