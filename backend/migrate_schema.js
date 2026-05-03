
import fs from 'fs';

const filePath = 'c:/Users/ALsalam - Marketing/Desktop/Coding/erp/backend/prisma/schema.prisma';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update provider and previewFeatures
content = content.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
if (!content.includes('previewFeatures')) {
    content = content.replace(/generator client\s*\{/, 'generator client {\n  previewFeatures = ["driverAdapters"]');
}

// 2. Replace Decimal with Float and remove @db attributes
content = content.replace(/Decimal/g, 'Float');
content = content.replace(/@db\.Decimal\(\d+,\s*\d+\)/g, '');
content = content.replace(/@db\.Float\(\d+,\s*\d+\)/g, '');
content = content.replace(/@db\.Date/g, '');
content = content.replace(/@db\.Time\(\d+\)/g, '');
content = content.replace(/@db\.Text/g, '');

// 3. Replace Json with String (SQLite workaround)
content = content.replace(/(\s+\w+\s+)Json(\??|\\[\\])/g, '$1String$2');

// 4. Replace Scalar Lists with String (SQLite workaround)
content = content.replace(/(\s+\w+\s+)String\[\](\s*@default\(\[\]\))?/g, '$1String @default("")');

// 5. Handle Enums (SQLite doesn't support them)
const enumRegex = /enum\s+(\w+)\s*\{([\s\S]*?)\}/g;
const enumNames = [];
let match;
while ((match = enumRegex.exec(content)) !== null) {
    enumNames.push(match[1]);
}

// Remove enum definitions
content = content.replace(enumRegex, '');

// Replace enum usages in models with String
enumNames.forEach(name => {
    const fieldRegex = new RegExp(`(\\s+\\w+\\s+)${name}(\\??|\\[\\])(\\s+@|\\s*\\n)`, 'g');
    content = content.replace(fieldRegex, `$1String$2$3`);
});

// Fix default values: quote identifiers but NOT numbers, booleans, or special functions
content = content.replace(/@default\((?!"|true|false|now|uuid|dbgenerated|autoincrement)([a-zA-Z_]\w*)\)/g, '@default("$1")');

fs.writeFileSync(filePath, content);
console.log('Schema updated successfully for Turso/SQLite (Fixed Enums, Json, Floats, and Lists)');
