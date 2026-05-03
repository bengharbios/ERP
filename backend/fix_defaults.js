
import fs from 'fs';

const filePath = 'c:/Users/ALsalam - Marketing/Desktop/Coding/erp/backend/prisma/schema.prisma';
let content = fs.readFileSync(filePath, 'utf8');

// Unquote numbers in @default
content = content.replace(/@default\("(\d*\.?\d+)"\)/g, '@default($1)');

fs.writeFileSync(filePath, content);
console.log('Fixed quoted numeric defaults');
