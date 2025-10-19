const express = require('express');
const pool = require('../config/database-local');

const router = express.Router();

// Get all questions for quiz
router.get('/questions', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, question, options FROM questions ORDER BY id',
            []
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Submit quiz results
router.post('/submit', async (req, res) => {
    try {
        const { answers, score, utm } = req.body;

        if (!answers || score === undefined) {
            return res.status(400).json({ error: 'Answers and score required' });
        }

        const result = await pool.query(
            `INSERT INTO results (score, answers, utm_source, utm_medium, utm_campaign, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, score, created_at`,
            [
                score,
                JSON.stringify(answers),
                utm?.source || null,
                utm?.medium || null,
                utm?.campaign || null,
                req.ip,
                req.headers['user-agent']
            ]
        );

        res.json({
            success: true,
            result: result.rows[0]
        });

    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ error: 'Failed to submit quiz' });
    }
});

// Capture lead
router.post('/lead', async (req, res) => {
    try {
        const { email, name, phone, resultId } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }

        const result = await pool.query(
            `INSERT INTO leads (email, name, phone, result_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (email) 
             DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone, result_id = EXCLUDED.result_id
             RETURNING id, email, created_at`,
            [email, name || null, phone || null, resultId || null]
        );

        res.json({
            success: true,
            lead: result.rows[0]
        });

    } catch (error) {
        console.error('Error capturing lead:', error);
        res.status(500).json({ error: 'Failed to capture lead' });
    }
});

module.exports = router;
