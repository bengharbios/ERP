
const fs = require('fs');

try {
    const data = fs.readFileSync('device_users.json', 'utf16le');
    console.log(data);
} catch (err) {
    // If utf16le fails, try utf8 just in case
    try {
        const dataUtf8 = fs.readFileSync('device_users.json', 'utf8');
        console.log(dataUtf8);
    } catch (e) {
        console.error(e);
    }
}
