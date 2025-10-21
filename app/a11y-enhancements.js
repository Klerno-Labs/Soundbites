/**
 * Accessibility Enhancements
 * - Progress bar announcements
 * - Focus management
 * - Keyboard navigation
 * - High contrast mode detection
 */

(function() {
    'use strict';

    // Add ARIA live region for quiz progress announcements
    function enhanceProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.setAttribute('role', 'progressbar');
            progressBar.setAttribute('aria-label', 'Quiz progress');
            progressBar.setAttribute('aria-valuemin', '0');
            progressBar.setAttribute('aria-valuemax', '100');
            progressBar.setAttribute('aria-valuenow', '0');
        }
    }

    // Update progress bar ARIA attributes
    window.updateProgressA11y = function(currentQuestion, totalQuestions) {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            const percentage = Math.round((currentQuestion / totalQuestions) * 100);
            progressBar.setAttribute('aria-valuenow', percentage);
            progressBar.setAttribute('aria-valuetext', `Question ${currentQuestion} of ${totalQuestions}`);
        }
    };

    // Focus management for quiz navigation
    function setupFocusManagement() {
        const quizContainer = document.getElementById('quiz-container');
        if (!quizContainer) return;

        // Focus first input when question renders
        const observer = new MutationObserver(() => {
            const firstInput = quizContainer.querySelector('input, button, select, textarea');
            if (firstInput && document.activeElement === document.body) {
                firstInput.focus();
            }
        });

        observer.observe(quizContainer, {
            childList: true,
            subtree: true
        });
    }

    // Keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + N: Next question
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                const nextBtn = document.getElementById('next-btn');
                if (nextBtn && !nextBtn.disabled && nextBtn.style.display !== 'none') {
                    nextBtn.click();
                }
            }

            // Alt + P: Previous question
            if (e.altKey && e.key === 'p') {
                e.preventDefault();
                const prevBtn = document.getElementById('prev-btn');
                if (prevBtn && !prevBtn.disabled) {
                    prevBtn.click();
                }
            }

            // Alt + S: Submit quiz
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                const submitBtn = document.getElementById('submit-btn');
                if (submitBtn && submitBtn.style.display !== 'none') {
                    submitBtn.click();
                }
            }
        });
    }

    // Detect and respect prefers-reduced-motion
    function respectMotionPreferences() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        function applyMotionPreference(e) {
            if (e.matches) {
                document.documentElement.style.setProperty('--transition-speed', '0s');
            } else {
                document.documentElement.style.setProperty('--transition-speed', '0.3s');
            }
        }

        applyMotionPreference(prefersReducedMotion);
        prefersReducedMotion.addEventListener('change', applyMotionPreference);
    }

    // High contrast mode detection
    function detectHighContrast() {
        const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
        if (isHighContrast) {
            document.body.classList.add('high-contrast');
        }
    }

    // Ensure minimum touch target sizes (48x48px)
    function enforceTouchTargets() {
        const buttons = document.querySelectorAll('button, a, input[type="submit"], input[type="button"]');
        buttons.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            if (rect.width < 48 || rect.height < 48) {
                btn.style.minWidth = '48px';
                btn.style.minHeight = '48px';
            }
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        enhanceProgressBar();
        setupFocusManagement();
        setupKeyboardShortcuts();
        respectMotionPreferences();
        detectHighContrast();

        // Recheck touch targets after content loads
        setTimeout(enforceTouchTargets, 1000);
    }
})();
