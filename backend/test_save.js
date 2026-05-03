const http = require('http');

const data = JSON.stringify({
    country: 'KW',
    currency: 'KWD'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/settings',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => responseBody += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', responseBody);
    });
});

req.on('error', (err) => {
    console.error('Error:', err.message);
});

req.write(data);
req.end();
