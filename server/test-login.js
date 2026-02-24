const axios = require('axios');

async function testLogin() {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@geraetewelt.de',
            password: 'admin123'
        });
        console.log('Login Test Success:', res.data);
    } catch (err) {
        console.error('Login Test Failed:', err.response?.data || err.message);
    }
}

testLogin();
