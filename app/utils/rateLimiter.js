/**
 * Rate Limiter for Quiz Submissions
 * Prevents analytics contamination by limiting quiz retakes
 */

class QuizRateLimiter {
    constructor(cooldownHours = 24) {
        this.cooldownMs = cooldownHours * 60 * 60 * 1000;
        this.storageKey = 'soundbites_quiz_last_submission';
    }

    canTakeQuiz() {
        const lastSubmission = localStorage.getItem(this.storageKey);
        if (!lastSubmission) return true;

        const timeSinceLastQuiz = Date.now() - parseInt(lastSubmission, 10);
        return timeSinceLastQuiz >= this.cooldownMs;
    }

    getTimeUntilNextQuiz() {
        const lastSubmission = localStorage.getItem(this.storageKey);
        if (!lastSubmission) return 0;

        const timeSinceLastQuiz = Date.now() - parseInt(lastSubmission, 10);
        const remaining = this.cooldownMs - timeSinceLastQuiz;
        return Math.max(0, remaining);
    }

    recordSubmission() {
        localStorage.setItem(this.storageKey, Date.now().toString());
    }

    formatTimeRemaining(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
}

// Export for use in script.js
window.QuizRateLimiter = QuizRateLimiter;
