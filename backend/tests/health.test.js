const request = require('supertest');
const express = require('express');
const healthRoutes = require('../routes/health');

const app = express();
app.use('/health', healthRoutes);

describe('Health Routes', () => {
    describe('GET /health', () => {
        it('should return 200 and status healthy', async () => {
            const res = await request(app).get('/health');

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('healthy');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('uptime');
        });

        it('should include database type', async () => {
            const res = await request(app).get('/health');

            expect(res.body).toHaveProperty('database');
            expect(typeof res.body.database).toBe('string');
        });
    });
});
