// Update production database admin credentials via API
const https = require('https');

async function updateProductionAdmin() {
    console.log('Updating production admin credentials...\n');

    const data = JSON.stringify({
        email: 'c.hatfield309@gmail.com',
        password: 'Hearing2025'
    });

    const options = {
        hostname: 'soundbites-quiz-backend.onrender.com',
        port: 443,
        path: '/api/admin/update-credentials',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log('✅ Production admin credentials updated!');
                    console.log('-----------------------------------');
                    console.log('Email: c.hatfield309@gmail.com');
                    console.log('Password: Hearing2025');
                    console.log('-----------------------------------\n');
                    resolve(body);
                } else {
                    console.log(`Status: ${res.statusCode}`);
                    console.log('Response:', body);
                    reject(new Error(`Failed: ${res.statusCode}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(data);
        req.end();
    });
}

updateProductionAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Error:', err.message);
        console.log('\nNote: You may need to update credentials directly in the Render PostgreSQL database.');
        console.log('Or login with the existing production credentials: admin / admin123');
        process.exit(1);
    });
