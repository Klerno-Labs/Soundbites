const OpenAI = require('openai');
const logger = require('../config/logger');

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

/**
 * Generate personalized recommendations based on quiz results
 * @param {number} score - Quiz score (0-100)
 * @param {Array} answers - User's quiz answers
 * @param {Object} metadata - Optional metadata (age, listenTime, etc.)
 * @returns {Promise<string>} Personalized recommendations
 */
async function generatePersonalizedRecommendations(score, answers, metadata = {}) {
    // Fallback if OpenAI not configured
    if (!openai) {
        logger.warn('OpenAI API key not set - using static recommendations');
        return getStaticRecommendations(score);
    }

    try {
        const prompt = buildPrompt(score, answers, metadata);

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Cheapest, fastest model
            messages: [
                {
                    role: 'system',
                    content: `You are a compassionate hearing health expert providing personalized advice.
                             Be encouraging, specific, and actionable. Focus on lifestyle tips and when to seek help.
                             Keep responses to 150 words max. Do not provide medical diagnoses.`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 250,
            temperature: 0.7
        });

        const recommendations = completion.choices[0].message.content;
        logger.info('AI recommendations generated', { score, tokensUsed: completion.usage.total_tokens });

        return recommendations;
    } catch (error) {
        logger.error('AI recommendation generation failed:', error);
        return getStaticRecommendations(score);
    }
}

/**
 * Build prompt for AI based on quiz data
 */
function buildPrompt(score, answers, metadata) {
    let prompt = `A user completed a hearing assessment quiz with a score of ${score}/100.\n\n`;

    // Add answer analysis
    if (answers && answers.length > 0) {
        prompt += `Quiz responses:\n`;
        answers.forEach((answer, index) => {
            if (typeof answer === 'number') {
                prompt += `- Question ${index + 1}: ${answer}/10\n`;
            } else {
                prompt += `- Question ${index + 1}: ${answer}\n`;
            }
        });
    }

    // Add metadata if available
    if (metadata.listenTime) {
        prompt += `\nListens to music ${metadata.listenTime} hours per day.\n`;
    }
    if (metadata.age) {
        prompt += `Age range: ${metadata.age}\n`;
    }
    if (metadata.concerns) {
        prompt += `Primary concerns: ${metadata.concerns}\n`;
    }

    prompt += `\nProvide personalized recommendations based on this data. Be specific to their situation.`;

    return prompt;
}

/**
 * Fallback static recommendations if AI unavailable
 */
function getStaticRecommendations(score) {
    if (score >= 70) {
        return `Your score suggests you may benefit from hearing enhancement. Consider scheduling a professional hearing assessment to explore your options. In the meantime, protect your hearing by reducing exposure to loud environments and using hearing protection at concerts or when using power tools.`;
    } else if (score >= 40) {
        return `You're experiencing some hearing challenges. Simple steps like facing people when they speak and reducing background noise can help. Consider a hearing check-up with a professional, especially if symptoms persist or worsen.`;
    } else {
        return `Your hearing appears to be in good shape! Continue protecting your ears by keeping volume at safe levels, using earplugs in loud environments, and getting regular check-ups. Early prevention is key to lifelong hearing health.`;
    }
}

/**
 * Generate quiz questions using AI (for admin)
 * @param {string} topic - Topic for questions
 * @param {number} count - Number of questions to generate
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Generated questions
 */
async function generateQuizQuestions(topic, count = 10, options = {}) {
    if (!openai) {
        throw new Error('OpenAI API key not configured');
    }

    try {
        const prompt = `Generate ${count} multiple choice quiz questions about ${topic} for a hearing health assessment.
                       Each question should have:
                       - Clear, simple language
                       - Yes/No answer OR 1-10 scale
                       - Focus on symptoms, behaviors, or experiences
                       ${options.targetAge ? `Target age: ${options.targetAge}` : ''}

                       Return as JSON array with format:
                       [{"question": "...", "type": "yes-no" or "slider", "weight": 10}]`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(completion.choices[0].message.content);
        logger.info('AI questions generated', { topic, count, tokensUsed: completion.usage.total_tokens });

        return result.questions || [];
    } catch (error) {
        logger.error('AI question generation failed:', error);
        throw error;
    }
}

module.exports = {
    generatePersonalizedRecommendations,
    generateQuizQuestions
};
