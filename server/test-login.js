const axios = require('axios');

const attempts = [
    { email: 'admin@geraetewelt.de', password: 'admin123' },
    { email: 'admin@geraetewelt.com', password: 'EK@2026!' }
];

async function testLogin() {
    for (const creds of attempts) {
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', creds, { timeout: 5000 });
            console.log(`Login Test Success for ${creds.email}:`, res.data);
        } catch (err) {
            console.error(`Login Test Failed for ${creds.email}:`, err.response?.data || err.message);
        }
    }
}

testLogin();
