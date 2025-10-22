const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
    describe('POST /api/auth/login', () => {
        it('should return 400 if email and password are missing', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Validation failed');
        });

        it('should return 400 if password is too short', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: '123'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Validation failed');
        });

        it('should return 400 if email format is invalid', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email',
                    password: 'password123'
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Validation failed');
        });
    });

    describe('GET /api/auth/verify', () => {
        it('should return 401 if no token is provided', async () => {
            const res = await request(app)
                .get('/api/auth/verify');

            expect(res.status).toBe(401);
            expect(res.body.valid).toBe(false);
        });

        it('should return 401 for invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', 'Bearer invalid-token-here');

            expect(res.status).toBe(401);
            expect(res.body.valid).toBe(false);
        });
    });
});
