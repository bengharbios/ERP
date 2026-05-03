
import fs from 'fs';
import path from 'path';

console.log('CWD:', process.cwd());
const logPath = path.join(process.cwd(), 'test_write.log');
try {
    fs.writeFileSync(logPath, 'Test write success');
    console.log('Successfully wrote to:', logPath);
    console.log('File content:', fs.readFileSync(logPath, 'utf8'));
} catch (error) {
    console.error('Failed to write:', error);
}
