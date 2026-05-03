const http = require('http');

http.get('http://localhost:3000/api/v1/settings', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const s = json.data.settings;
            console.log(`ID: ${s.id}`);
            console.log(`Currency: ${s.currency}`);
            console.log(`Country: ${s.country}`);
            console.log(`Timezone: ${s.timezone}`);
        } catch (e) {
            console.log('Error parsing JSON or structure');
        }
    });
}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
