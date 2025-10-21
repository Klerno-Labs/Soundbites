/**
 * TikTok Events API - Server-Side Event Mirroring
 * Bypasses adblockers by sending events from server
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const TIKTOK_PIXEL_ID = process.env.TIKTOK_PIXEL_ID || 'D3QKIABC77U1STIOMN20';
const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || '';
const TIKTOK_API_VERSION = 'v1.3';
const TIKTOK_API_URL = `https://business-api.tiktok.com/open_api/${TIKTOK_API_VERSION}/pixel/track/`;

/**
 * Hash email (SHA256) for privacy
 */
function hashEmail(email) {
    return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

/**
 * Send event to TikTok Events API
 */
async function sendToTikTok(eventData) {
    if (!TIKTOK_ACCESS_TOKEN) {
        console.warn('[TikTok Events API] No access token configured, skipping');
        return { success: false, error: 'No access token' };
    }

    try {
        const response = await fetch(TIKTOK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Token': TIKTOK_ACCESS_TOKEN
            },
            body: JSON.stringify({
                pixel_code: TIKTOK_PIXEL_ID,
                ...eventData
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[TikTok Events API] Error:', data);
            return { success: false, error: data };
        }

        console.log('[TikTok Events API] Event sent:', eventData.event);
        return { success: true, data };

    } catch (error) {
        console.error('[TikTok Events API] Network error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * POST /api/tiktok-events/track
 * Mirror client-side events to server
 */
router.post('/track', async (req, res) => {
    try {
        const {
            event,
            event_id,
            properties = {},
            user = {}
        } = req.body;

        if (!event) {
            return res.status(400).json({ error: 'Event name required' });
        }

        // Build TikTok Events API payload
        const eventData = {
            event,
            event_id: event_id || crypto.randomUUID(),
            timestamp: Math.floor(Date.now() / 1000), // Unix timestamp
            context: {
                user_agent: req.headers['user-agent'],
                ip: req.ip || req.connection.remoteAddress,
                page: {
                    url: properties.page_url || req.headers.referer || 'https://otis.soundbites.com'
                }
            },
            properties: {
                ...properties,
                // Add server-detected info
                server_event_time: new Date().toISOString()
            }
        };

        // Add user data if provided (hashed email for privacy)
        if (user.email) {
            eventData.context.user = {
                external_id: user.user_id || hashEmail(user.email),
                email: [hashEmail(user.email)], // TikTok expects array of hashed emails
                phone: user.phone ? [crypto.createHash('sha256').update(user.phone).digest('hex')] : undefined
            };
        }

        // Send to TikTok
        const result = await sendToTikTok(eventData);

        res.json({
            success: result.success,
            event,
            event_id: eventData.event_id,
            mirrored: true
        });

    } catch (error) {
        console.error('[TikTok Events API] Error in /track:', error);
        res.status(500).json({ error: 'Failed to track event' });
    }
});

/**
 * POST /api/tiktok-events/lead
 * Track lead capture (email signup)
 */
router.post('/lead', async (req, res) => {
    try {
        const { email, score, recommendation_level, utm_params = {} } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }

        const result = await sendToTikTok({
            event: 'Lead',
            event_id: crypto.randomUUID(),
            timestamp: Math.floor(Date.now() / 1000),
            context: {
                user_agent: req.headers['user-agent'],
                ip: req.ip,
                user: {
                    email: [hashEmail(email)]
                },
                page: {
                    url: 'https://otis.soundbites.com'
                }
            },
            properties: {
                content_type: 'email_signup',
                value: 5.00,
                currency: 'USD',
                score,
                recommendation_level,
                ...utm_params
            }
        });

        res.json({ success: result.success, event: 'Lead' });

    } catch (error) {
        console.error('[TikTok Events API] Error in /lead:', error);
        res.status(500).json({ error: 'Failed to track lead' });
    }
});

/**
 * POST /api/tiktok-events/complete-quiz
 * Track quiz completion
 */
router.post('/complete-quiz', async (req, res) => {
    try {
        const { score, recommendation_level, utm_params = {} } = req.body;

        const result = await sendToTikTok({
            event: 'CompleteQuiz',
            event_id: crypto.randomUUID(),
            timestamp: Math.floor(Date.now() / 1000),
            context: {
                user_agent: req.headers['user-agent'],
                ip: req.ip,
                page: {
                    url: 'https://otis.soundbites.com'
                }
            },
            properties: {
                content_type: 'assessment',
                score,
                recommendation_level,
                value: score / 10,
                currency: 'USD',
                ...utm_params
            }
        });

        res.json({ success: result.success, event: 'CompleteQuiz' });

    } catch (error) {
        console.error('[TikTok Events API] Error in /complete-quiz:', error);
        res.status(500).json({ error: 'Failed to track quiz completion' });
    }
});

module.exports = router;
