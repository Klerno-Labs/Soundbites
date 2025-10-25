const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key from environment
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Generate personalized quiz results email HTML
 * @param {Object} params - Email parameters
 * @param {string} params.recipientEmail - User's email address
 * @param {number} params.score - Quiz score (0-100)
 * @param {string} params.recommendation - Recommendation level (high-need, moderate-need, low-need)
 * @param {Array} params.responses - Array of question responses
 * @param {Array} params.questions - Array of question objects
 * @returns {string} HTML email content
 */
function generateResultsEmailHTML({ recipientEmail, score, recommendation, responses, questions }) {
  // Determine recommendation details
  let recommendationTitle, recommendationMessage, recommendationColor;

  if (recommendation === 'high-need' || score >= 60) {
    recommendationTitle = 'Soundbites May Significantly Support Your Needs';
    recommendationMessage = 'Based on your responses, you indicated experiencing challenges in daily listening situations. Soundbites may help support your listening experience.';
    recommendationColor = '#C92A76';
  } else if (recommendation === 'moderate-need' || score >= 30) {
    recommendationTitle = 'Soundbites May Be Worth Exploring';
    recommendationMessage = 'Your responses suggest occasional listening challenges. Soundbites could help enhance your daily listening experiences.';
    recommendationColor = '#764ba2';
  } else {
    recommendationTitle = 'Thanks for Learning About Soundbites';
    recommendationMessage = 'While your responses suggest minimal listening challenges currently, Soundbites may still support your daily listening experiences.';
    recommendationColor = '#667eea';
  }

  // Generate question breakdown HTML
  const questionBreakdownHTML = responses.map((response, index) => {
    const question = questions[index];
    if (!question) return '';

    let answerDisplay = response.answer;

    // Format answer based on question type
    if (question.type === 'slider' || question.type === 'hours-slider') {
      answerDisplay = `${response.answer}/10`;
    } else if (question.type === 'yes-no') {
      answerDisplay = response.answer === 'yes' ? 'Yes' : 'No';
    }

    // Provide insight based on the answer
    let insight = '';
    if (question.type === 'slider' && response.answer >= 7) {
      insight = 'This indicates a significant area where Soundbites may provide support.';
    } else if (question.type === 'slider' && response.answer >= 4) {
      insight = 'This suggests moderate support needs in this area.';
    } else if (question.type === 'yes-no' && response.answer === 'yes') {
      insight = 'This is a common challenge that Soundbites is designed to address.';
    }

    return `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 8px;">
            ${question.text}
          </div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <span style="background: #C92A76; color: white; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600;">
              Your Answer: ${answerDisplay}
            </span>
          </div>
          ${insight ? `<div style="color: #6b7280; font-size: 14px; font-style: italic;">${insight}</div>` : ''}
        </td>
      </tr>
    `;
  }).join('');

  // Generate full HTML email
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Soundbites Results</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Main Container -->
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #C92A76 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
                Your Personalized Results
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Soundbites Listening Experience Assessment
              </p>
            </td>
          </tr>

          <!-- Overall Score -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <div style="background: white; border: 4px solid ${recommendationColor}; border-radius: 50%; width: 120px; height: 120px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                      <span style="font-size: 48px; font-weight: 800; color: ${recommendationColor};">
                        ${score}
                      </span>
                    </div>
                    <h2 style="margin: 15px 0 10px 0; color: #111827; font-size: 22px; font-weight: 700;">
                      ${recommendationTitle}
                    </h2>
                    <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                      ${recommendationMessage}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Question Breakdown -->
          <tr>
            <td style="padding: 30px;">
              <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 700;">
                📊 Your Response Breakdown
              </h3>
              <table role="presentation" style="width: 100%; border: 1px solid #e5e7eb; border-radius: 8px;">
                ${questionBreakdownHTML}
              </table>
            </td>
          </tr>

          <!-- Mission Statement -->
          <tr>
            <td style="padding: 30px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-top: 1px solid #e5e7eb;">
              <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 700;">
                💙 Why We Do This
              </h3>
              <p style="margin: 0 0 15px 0; color: #374151; font-size: 15px; line-height: 1.7;">
                At Soundbites, our mission is simple: <strong>help as many people as possible</strong> improve their listening experience. We believe everyone deserves to engage fully in conversations, enjoy music, and connect with the world around them.
              </p>
              <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.7;">
                That's why we donate <strong>10% of our proceeds to KeepHearing.org</strong>, a nonprofit dedicated to hearing health education and advocacy. When you choose Soundbites, you're not just supporting your own hearing—you're helping others too.
              </p>
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td align="center" style="padding: 40px 30px;">
              <a href="https://soundbites.com" style="display: inline-block; background: #C92A76; color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 12px rgba(201,42,118,0.3);">
                🎧 Visit Soundbites.com
              </a>
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
                Explore our products and learn more about how we can help
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                You're receiving this email because you requested your quiz results from Soundbites.
              </p>
              <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 13px;">
                ${process.env.COMPANY_ADDRESS || 'Soundbites, [Your Address]'}
              </p>
              <p style="margin: 0; font-size: 12px;">
                <a href="https://soundbites.com" style="color: #C92A76; text-decoration: none;">Visit Website</a> •
                <a href="https://www.keephearing.org" style="color: #C92A76; text-decoration: none;">KeepHearing.org</a> •
                <a href="{{{unsubscribe}}}" style="color: #9ca3af; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send quiz results email to user
 * @param {Object} params - Email parameters
 * @returns {Promise<Object>} SendGrid response
 */
async function sendQuizResultsEmail(params) {
  const { recipientEmail, score, recommendation, responses, questions } = params;

  // Validate required environment variables
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY not configured in environment variables');
  }

  if (!process.env.SENDGRID_FROM_EMAIL) {
    throw new Error('SENDGRID_FROM_EMAIL not configured in environment variables');
  }

  // Generate email HTML
  const htmlContent = generateResultsEmailHTML(params);

  // Prepare email message
  const msg = {
    to: recipientEmail,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME || 'Soundbites Team'
    },
    subject: 'Your Soundbites Listening Experience Results',
    html: htmlContent,
    // Track email opens and clicks
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true }
    },
    // Add custom unsubscribe
    asm: {
      groupId: parseInt(process.env.SENDGRID_UNSUBSCRIBE_GROUP_ID || '0')
    }
  };

  try {
    const response = await sgMail.send(msg);
    console.log(`✅ Quiz results email sent to ${recipientEmail}`);
    return response;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    throw error;
  }
}

module.exports = {
  sendQuizResultsEmail,
  generateResultsEmailHTML
};
