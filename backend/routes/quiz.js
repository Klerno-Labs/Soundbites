const express = require('express');
const pool = require('../config/database-local');
const { sendQuizResultsEmail } = require('../services/emailService');

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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Save lead to database
        const result = await pool.query(
            `INSERT INTO leads (email, name, phone, result_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (email)
             DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone, result_id = EXCLUDED.result_id
             RETURNING id, email, created_at`,
            [email, name || null, phone || null, resultId || null]
        );

        // Fetch quiz result data to send in email
        let score = 0;
        let recommendation = 'low-need';
        let responses = [];
        let questions = [];

        if (resultId) {
            try {
                // Get the quiz result
                const quizResult = await pool.query(
                    'SELECT score, answers FROM results WHERE id = $1',
                    [resultId]
                );

                if (quizResult.rows.length > 0) {
                    score = quizResult.rows[0].score;
                    const answersData = JSON.parse(quizResult.rows[0].answers);

                    // Determine recommendation based on score
                    if (score >= 60) {
                        recommendation = 'high-need';
                    } else if (score >= 30) {
                        recommendation = 'moderate-need';
                    } else {
                        recommendation = 'low-need';
                    }

                    // Get all questions for context
                    const questionsResult = await pool.query(
                        'SELECT id, question AS text, type, options FROM questions ORDER BY id'
                    );
                    questions = questionsResult.rows;

                    // Map answers to responses array
                    responses = answersData.map((answer, index) => ({
                        questionId: index + 1,
                        answer: answer
                    }));

                    // Send personalized results email
                    await sendQuizResultsEmail({
                        recipientEmail: email,
                        score,
                        recommendation,
                        responses,
                        questions
                    });

                    console.log(`📧 Quiz results email sent to ${email}`);
                }
            } catch (emailError) {
                // Log email error but don't fail the lead capture
                console.error('Failed to send results email:', emailError);
                // Continue execution - lead is still captured
            }
        }

        res.json({
            success: true,
            lead: result.rows[0],
            emailSent: resultId ? true : false
        });

    } catch (error) {
        console.error('Error capturing lead:', error);
        res.status(500).json({ error: 'Failed to capture lead' });
    }
});

module.exports = router;
