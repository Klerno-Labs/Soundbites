const express = require('express');
const pool = require('../config/database-local');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication
router.use(requireAuth);

// Get all results with optional filters
router.get('/results', async (req, res) => {
    try {
        const { fromDate, toDate, minScore, maxScore, utmSource } = req.query;
        
        let query = 'SELECT * FROM results WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (fromDate) {
            query += ` AND created_at >= $${paramCount}`;
            params.push(fromDate);
            paramCount++;
        }
        if (toDate) {
            query += ` AND created_at <= $${paramCount}`;
            params.push(toDate);
            paramCount++;
        }
        if (minScore !== undefined) {
            query += ` AND score >= $${paramCount}`;
            params.push(minScore);
            paramCount++;
        }
        if (maxScore !== undefined) {
            query += ` AND score <= $${paramCount}`;
            params.push(maxScore);
            paramCount++;
        }
        if (utmSource) {
            query += ` AND utm_source = $${paramCount}`;
            params.push(utmSource);
            paramCount++;
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// Get all leads
router.get('/leads', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM leads ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// Get analytics summary
router.get('/analytics', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_responses,
                AVG(score) as average_score,
                MIN(score) as min_score,
                MAX(score) as max_score,
                COUNT(DISTINCT utm_source) as unique_sources
            FROM results
        `);

        const recentActivity = await pool.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM results
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        const sourceBreakdown = await pool.query(`
            SELECT utm_source, COUNT(*) as count
            FROM results
            WHERE utm_source IS NOT NULL
            GROUP BY utm_source
            ORDER BY count DESC
        `);

        res.json({
            summary: stats.rows[0],
            recentActivity: recentActivity.rows,
            sourceBreakdown: sourceBreakdown.rows
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Get all questions (for admin editing)
router.get('/questions', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM questions ORDER BY id'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Add or update question (editor and admin only)
router.post('/questions', requireRole('editor', 'admin'), async (req, res) => {
    try {
        const { id, question, type, options, weight } = req.body;

        if (!question || !type) {
            return res.status(400).json({ error: 'Question and type required' });
        }

        let result;
        
        if (id) {
            // Update existing question
            result = await pool.query(
                `UPDATE questions 
                 SET question = $1, type = $2, options = $3, weight = $4, updated_at = NOW()
                 WHERE id = $5
                 RETURNING *`,
                [question, type, JSON.stringify(options), weight || 10, id]
            );
        } else {
            // Insert new question
            result = await pool.query(
                `INSERT INTO questions (question, type, options, weight)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [question, type, JSON.stringify(options), weight || 10]
            );
        }

        res.json({
            success: true,
            question: result.rows[0]
        });

    } catch (error) {
        console.error('Error saving question:', error);
        res.status(500).json({ error: 'Failed to save question' });
    }
});

// Delete question (editor and admin only)
router.delete('/questions/:id', requireRole('editor', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query('DELETE FROM questions WHERE id = $1', [id]);

        res.json({ success: true });

    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

// Export data as JSON
router.get('/export', async (req, res) => {
    try {
        const results = await pool.query('SELECT * FROM results ORDER BY created_at');
        const leads = await pool.query('SELECT * FROM leads ORDER BY created_at');
        const questions = await pool.query('SELECT * FROM questions ORDER BY id');

        res.json({
            exportDate: new Date().toISOString(),
            results: results.rows,
            leads: leads.rows,
            questions: questions.rows
        });

    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

module.exports = router;
