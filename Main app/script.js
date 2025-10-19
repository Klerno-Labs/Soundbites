// Quiz Application - Main JavaScript
class SoundbiteQuiz {
    constructor() {
        this.currentQuestion = 0;
        this.answers = {};
        this.questions = this.getDefaultQuestions();
        this.init();
    }

    // Default 10 hearing-related questions
    getDefaultQuestions() {
        return [
            {
                id: 1,
                text: "How many hours a day do you listen to music on average?",
                type: "hours-slider",
                min: 1,
                max: 24,
                unit: "hours",
                weight: 2
            },
            {
                id: 2,
                text: "How often do you have trouble understanding people in noisy environments?",
                type: "multiple-choice",
                options: [
                    { value: 1, text: "Never" },
                    { value: 3, text: "Rarely" },
                    { value: 5, text: "Sometimes" },
                    { value: 7, text: "Often" },
                    { value: 10, text: "Always" }
                ],
                weight: 3
            },
            {
                id: 3,
                text: "How high do you typically turn your volume when listening to music or videos?",
                type: "slider",
                min: 1,
                max: 10,
                labels: ["Very Low", "Very High"],
                weight: 3
            },
            {
                id: 4,
                text: "Do you often ask people to repeat themselves?",
                type: "yes-no",
                weight: 2
            },
            {
                id: 5,
                text: "How often do you experience ringing in your ears (tinnitus)?",
                type: "multiple-choice",
                options: [
                    { value: 1, text: "Never" },
                    { value: 3, text: "Rarely" },
                    { value: 5, text: "Sometimes" },
                    { value: 8, text: "Frequently" },
                    { value: 10, text: "Constantly" }
                ],
                weight: 3
            },
            {
                id: 6,
                text: "How comfortable are you in group conversations?",
                type: "slider",
                min: 1,
                max: 10,
                labels: ["Very Uncomfortable", "Very Comfortable"],
                weight: 2,
                reverse: true // Lower score means higher need
            },
            {
                id: 7,
                text: "Do you avoid social gatherings because of hearing difficulties?",
                type: "yes-no",
                weight: 3
            },
            {
                id: 8,
                text: "How often do you mishear words in conversation?",
                type: "multiple-choice",
                options: [
                    { value: 1, text: "Never" },
                    { value: 3, text: "Rarely" },
                    { value: 5, text: "Sometimes" },
                    { value: 7, text: "Often" },
                    { value: 10, text: "Very Often" }
                ],
                weight: 2
            },
            {
                id: 9,
                text: "How much do hearing issues affect your daily life?",
                type: "slider",
                min: 1,
                max: 10,
                labels: ["Not At All", "Significantly"],
                weight: 3
            },
            {
                id: 10,
                text: "Have you noticed any changes in your hearing over the past year?",
                type: "yes-no",
                weight: 2
            }
        ];
    }

    init() {
        this.loadCustomQuestions();
        this.renderQuestion();
        this.attachEventListeners();
        this.updateProgress();
    }

    loadCustomQuestions() {
        // Try to load from API first, fallback to localStorage
        if (window.api) {
            window.api.getQuestions()
                .then(questions => {
                    if (questions && questions.length > 0) {
                        // Convert API questions to quiz format
                        this.questions = questions.map((q, index) => ({
                            id: q.id || index + 1,
                            text: q.question,
                            type: "multiple-choice",
                            options: q.options.map((opt, i) => ({
                                value: i + 1,
                                text: opt
                            })),
                            weight: 1
                        }));
                        console.log('✅ Loaded questions from API');
                        this.renderQuestion();
                    }
                })
                .catch(err => {
                    console.log('Using default questions (API unavailable):', err);
                    this.loadQuestionsFromLocalStorage();
                });
        } else {
            this.loadQuestionsFromLocalStorage();
        }
    }

    loadQuestionsFromLocalStorage() {
        const savedQuestions = localStorage.getItem('quiz-questions');
        if (savedQuestions) {
            try {
                this.questions = JSON.parse(savedQuestions);
            } catch (e) {
                console.log('Using default questions');
            }
        }
    }

    attachEventListeners() {
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        const submitBtn = document.getElementById('submit-btn');
        const emailForm = document.getElementById('email-form');

        nextBtn.addEventListener('click', () => this.nextQuestion());
        prevBtn.addEventListener('click', () => this.prevQuestion());
        submitBtn.addEventListener('click', () => this.submitQuiz());
        
        if (emailForm) {
            emailForm.addEventListener('submit', (e) => this.sendResults(e));
        }
    }

    renderQuestion() {
        const container = document.getElementById('question-container');
        const question = this.questions[this.currentQuestion];
        
    let html = `<fieldset class="question active" role="group" aria-labelledby="q-${question.id}-legend">
              <legend id="q-${question.id}-legend">Question ${this.currentQuestion + 1} of ${this.questions.length}: ${question.text}</legend>`;

        switch (question.type) {
            case 'slider':
            case 'hours-slider':
                html += this.renderSlider(question);
                break;
            case 'multiple-choice':
                html += this.renderMultipleChoice(question);
                break;
            case 'yes-no':
                html += this.renderYesNo(question);
                break;
            case 'text':
                html += this.renderTextInput(question);
                break;
        }

    html += '</fieldset>';
        container.innerHTML = html;

        // Restore previous answer if exists
        if (this.answers[question.id] !== undefined) {
            this.restoreAnswer(question);
        }

        this.updateNavigationButtons();
    }

    renderSlider(question) {
        const value = this.answers[question.id] || question.min || 1;
        const unit = question.unit || '';
        
        return `
            <div class="slider-container">
                <input type="range" 
                       class="slider" 
                       id="question-${question.id}" 
                       min="${question.min}" 
                       max="${question.max}" 
                       value="${value}"
                       aria-label="${question.text}"
                       aria-describedby="slider-value-${question.id}"
                       oninput="quiz.updateSliderValue(${question.id}, this.value, '${unit}')">
                <div class="slider-labels">
                    <span>${question.labels ? question.labels[0] : question.min + unit}</span>
                    <span>${question.labels ? question.labels[1] : question.max + unit}</span>
                </div>
                <div class="slider-value" id="slider-value-${question.id}">
                    ${value}${unit}
                </div>
            </div>
        `;
    }

    renderMultipleChoice(question) {
        let html = '<div class="options-container">';
        question.options.forEach((option, index) => {
            const checked = this.answers[question.id] === option.value ? 'selected' : '';
            html += `
                <label class="option ${checked}" tabindex="0" onkeydown="quiz.optionKeydown(event, ${question.id}, ${option.value})" onclick="quiz.selectOption(this, ${question.id}, ${option.value})">
                    <input type="radio" name="question-${question.id}" value="${option.value}">
                    ${option.text}
                </label>
            `;
        });
        html += '</div>';
        return html;
    }

    renderYesNo(question) {
        return `
            <div class="options-container">
                <label class="option ${this.answers[question.id] === 10 ? 'selected' : ''}" tabindex="0" onkeydown="quiz.optionKeydown(event, ${question.id}, 10)" 
                       onclick="quiz.selectOption(this, ${question.id}, 10)">
                    <input type="radio" name="question-${question.id}" value="10">
                    Yes
                </label>
                <label class="option ${this.answers[question.id] === 1 ? 'selected' : ''}" tabindex="0" onkeydown="quiz.optionKeydown(event, ${question.id}, 1)" 
                       onclick="quiz.selectOption(this, ${question.id}, 1)">
                    <input type="radio" name="question-${question.id}" value="1">
                    No
                </label>
            </div>
        `;
    }

    renderTextInput(question) {
        const value = this.answers[question.id] || '';
        return `
            <div class="text-input-container">
                <input type="text" 
                       id="question-${question.id}" 
                       value="${value}"
                       placeholder="Enter your answer..."
                       onchange="quiz.updateTextAnswer(${question.id}, this.value)">
            </div>
        `;
    }

    updateSliderValue(questionId, value, unit = '') {
        document.getElementById(`slider-value-${questionId}`).textContent = value + unit;
        this.answers[questionId] = parseInt(value);
        // Also set a CSS percentage var so the slider track fill reflects the value
        const sliderEl = document.getElementById(`question-${questionId}`);
        if (sliderEl) {
            const min = Number(sliderEl.min || 0);
            const max = Number(sliderEl.max || 100);
            const pct = Math.max(0, Math.min(100, Math.round(((value - min) / (max - min)) * 100)));
            sliderEl.style.setProperty('--percent', pct + '%');
        }
    }

    selectOption(targetEl, questionId, value) {
        // Remove previous selection
        document.querySelectorAll(`input[name="question-${questionId}"]`).forEach(input => {
            input.closest('.option').classList.remove('selected');
            // Uncheck radios in the group for accessibility consistency
            input.checked = false;
        });
        
        // Add selection to clicked option
        if (targetEl && targetEl.classList) {
            targetEl.classList.add('selected');
            const radio = targetEl.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                radio.setAttribute('aria-checked', 'true');
            }
        }
        this.answers[questionId] = value;
    }

    optionKeydown(e, questionId, value) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Pass the element explicitly to selectOption
            this.selectOption(e.currentTarget, questionId, value);
        }
    }

    updateTextAnswer(questionId, value) {
        this.answers[questionId] = value;
    }

    restoreAnswer(question) {
        const answer = this.answers[question.id];
        
        switch (question.type) {
            case 'slider':
            case 'hours-slider':
                const slider = document.getElementById(`question-${question.id}`);
                if (slider) {
                    slider.value = answer;
                    this.updateSliderValue(question.id, answer, question.unit || '');
                }
                break;
            case 'multiple-choice':
            case 'yes-no':
                const option = document.querySelector(`input[name="question-${question.id}"][value="${answer}"]`);
                if (option) {
                    option.closest('.option').classList.add('selected');
                    option.checked = true;
                    option.setAttribute('aria-checked', 'true');
                }
                break;
            case 'text':
                const textInput = document.getElementById(`question-${question.id}`);
                if (textInput) {
                    textInput.value = answer;
                }
                break;
        }
    }

    nextQuestion() {
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            this.renderQuestion();
            this.updateProgress();
        }
    }

    prevQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.renderQuestion();
            this.updateProgress();
        }
    }

    updateNavigationButtons() {
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        const submitBtn = document.getElementById('submit-btn');
        
        prevBtn.disabled = this.currentQuestion === 0;
        
        if (this.currentQuestion === this.questions.length - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        }
    }

    updateProgress() {
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
        document.getElementById('progress').style.width = progress + '%';
    }

    calculateScore() {
        let totalScore = 0;
        let totalWeight = 0;

        this.questions.forEach(question => {
            if (this.answers[question.id] !== undefined) {
                let raw = this.answers[question.id];
                let score = raw;
                // Normalize hours-slider (e.g., 1..24) to a 1..10 scale
                if (question.type === 'hours-slider') {
                    const min = question.min ?? 1;
                    const max = question.max ?? 24;
                    const span = Math.max(1, max - min);
                    const normalized = 1 + ((raw - min) * (9 / span)); // map min->1, max->10
                    score = Math.max(1, Math.min(10, normalized));
                }
                
                // Handle reverse scoring
                if (question.reverse) {
                    const max = question.max || 10;
                    // When normalized, keep within 1..10 expectations
                    score = (question.type === 'hours-slider')
                        ? (11 - score) // since score is 1..10
                        : (max + 1 - score);
                }
                
                // Handle text inputs (assign neutral score)
                if (question.type === 'text') {
                    score = 5;
                }
                
                totalScore += score * (question.weight || 1);
                totalWeight += (question.weight || 1);
            }
        });
        if (totalWeight === 0) return 0;
        const avg = totalScore / totalWeight; // expect ~1..10
        const scaled = Math.round(avg * 10); // 10..100
        return Math.max(0, Math.min(100, scaled));
    }

    getRecommendation(score) {
        if (score >= 70) {
            return {
                level: 'high-need',
                title: 'Soundbites Highly Recommended',
                message: 'Based on your responses, you would significantly benefit from Soundbites. Your hearing challenges are affecting your daily life, and our solution can help improve your listening experience.',
                action: 'Get Soundbites now and improve your hearing experience!'
            };
        } else if (score >= 40) {
            return {
                level: 'moderate-need',
                title: 'Soundbites Could Help',
                message: 'You show some signs of hearing difficulties that Soundbites could help address. Consider trying our solution to enhance your listening experience.',
                action: 'Try Soundbites to see the difference it can make.'
            };
        } else {
            return {
                level: 'low-need',
                title: 'Good Hearing Health',
                message: 'Your hearing appears to be in good condition. Soundbites could still enhance your listening experience, especially in challenging environments.',
                action: 'Keep monitoring your hearing health!'
            };
        }
    }

    submitQuiz() {
        const score = this.calculateScore();
        const recommendation = this.getRecommendation(score);
        
        // Store results for analytics
        this.storeResults(score, recommendation);
        
        // Show results
        this.showResults(score, recommendation);
    }

    showResults(score, recommendation) {
        document.getElementById('quiz-container').style.display = 'none';

        const resultsContainer = document.getElementById('results-container');
        const resultContent = document.getElementById('result-content');

        // Load admin overrides for result box
        const quizSettings = JSON.parse(localStorage.getItem('quiz-settings') || '{}');
        const accent = quizSettings.resultColor || getComputedStyle(document.documentElement).getPropertyValue('--sb-primary')?.trim() || '#C92A76';
        // Determine final text values (use recommendation defaults if no override provided)
        const title = quizSettings.resultTitle || recommendation.title;
        const message = quizSettings.resultMessage || recommendation.message;
        const ctaText = quizSettings.resultCta || 'Visit soundbites.com';
        const ctaUrl = quizSettings.resultCtaUrl || 'https://soundbites.com';

        resultContent.innerHTML = `
            <div class="result-summary">
                <div class="score-meter">
                    <div class="score-ring" id="score-ring" style="--p:0; --ringColor: ${accent}">
                        <div class="score-number">
                            <span class="score-value" id="score-value">0</span>
                            <span class="score-max">/100</span>
                        </div>
                    </div>
                    <div class="score-bar" style="display:none">
                        <div class="score-fill" id="score-fill"></div>
                    </div>
                </div>
                <div class="recommendation ${recommendation.level}" style="--accent:${accent}">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <p><strong>${recommendation.action}</strong></p>
                    <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <a href="${ctaUrl}" class="btn btn-secondary" target="_blank" rel="noopener">${ctaText}</a>
                        <a href="https://www.tiktok.com/shop/store/soundbites/7494162119735018619?source=product_detail&enter_from=product_detail&enter_method=product_info_right_shop&first_entrance=homepage_hot" class="btn btn-secondary" target="_blank" rel="noopener">Try on TikTok Shop</a>
                    </div>
                </div>
            </div>
        `;

        // Animate the ring and number up to the score
        const ring = document.getElementById('score-ring');
        const valueEl = document.getElementById('score-value');
        const barFill = document.getElementById('score-fill');

    const duration = 900; // ms
        const start = performance.now();

        function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

        function step(now){
            const t = Math.min(1, (now - start) / duration);
            const eased = easeOutCubic(t);
            const current = Math.round(score * eased);
            if (ring) ring.style.setProperty('--p', String(current));
            if (valueEl) valueEl.textContent = String(current);
            if (barFill) barFill.style.width = current + '%';
            if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);

        resultsContainer.style.display = 'block';
    }

    storeResults(score, recommendation) {
        // Capture UTM for better analytics attribution
        const params = new URLSearchParams(window.location.search);
        const utm = {
            source: params.get('utm_source') || '',
            medium: params.get('utm_medium') || '',
            campaign: params.get('utm_campaign') || '',
            term: params.get('utm_term') || '',
            content: params.get('utm_content') || ''
        };

        const results = {
            timestamp: new Date().toISOString(),
            score: score,
            recommendation: recommendation.level,
            answers: this.answers,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            utm
        };
        
        // Submit to API if available, fallback to localStorage
        if (window.api) {
            window.api.submitQuiz(results)
                .then(response => {
                    console.log('✅ Results submitted to API:', response);
                })
                .catch(err => {
                    console.error('Failed to submit to API, storing locally:', err);
                    this.storeResultsLocally(results);
                });
        } else {
            this.storeResultsLocally(results);
        }
    }

    storeResultsLocally(results) {
        // Store in localStorage for analytics
        const allResults = JSON.parse(localStorage.getItem('quiz-results') || '[]');
        allResults.push(results);
        localStorage.setItem('quiz-results', JSON.stringify(allResults));
    }

    async sendResults(event) {
        event.preventDefault();
        
        const email = document.getElementById('user-email').value;
        const score = this.calculateScore();
        const recommendation = this.getRecommendation(score);
        
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            // Initialize EmailJS (you'll need to configure this)
            const emailSettings = JSON.parse(localStorage.getItem('email-settings') || '{}');
            
            if (emailSettings.serviceId && emailSettings.templateId && emailSettings.userId && typeof emailjs !== 'undefined') {
                const subject = `[Soundbites Results] ${recommendation.title} (${score}/100)`;
                await emailjs.send(
                    emailSettings.serviceId,
                    emailSettings.templateId,
                    {
                        to_email: email,
                        subject: subject,
                        email_subject: subject,
                        user_score: score,
                        recommendation_level: recommendation.level,
                        recommendation_title: recommendation.title,
                        recommendation_message: recommendation.message,
                        answers: JSON.stringify(this.answers, null, 2)
                    },
                    emailSettings.userId
                );
                
                alert('Results sent successfully! Check your email for detailed recommendations.');
            } else {
                console.log('Email not configured. Results would be sent to:', email);
                alert('Thank you! Your results have been processed.');
            }
            
            // Store lead information
            this.storeLead(email, score, recommendation);
            
        } catch (error) {
            console.error('Error sending email:', error);
            alert('There was an error sending your results. Please try again.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    storeLead(email, score, recommendation) {
        // Capture UTM params and referrer for attribution
        const params = new URLSearchParams(window.location.search);
        const utm = {
            source: params.get('utm_source') || '',
            medium: params.get('utm_medium') || '',
            campaign: params.get('utm_campaign') || '',
            term: params.get('utm_term') || '',
            content: params.get('utm_content') || ''
        };

        const lead = {
            email: email,
            timestamp: new Date().toISOString(),
            score: score,
            recommendation: recommendation.level,
            answers: this.answers,
            source: 'tiktok-quiz',
            utm: utm,
            referrer: document.referrer
        };
        
        // Submit to API if available, fallback to localStorage
        if (window.api) {
            window.api.captureLead(lead)
                .then(response => {
                    console.log('✅ Lead captured via API:', response);
                })
                .catch(err => {
                    console.error('Failed to capture lead via API, storing locally:', err);
                    this.storeLeadLocally(lead);
                });
        } else {
            this.storeLeadLocally(lead);
        }
    }

    storeLeadLocally(lead) {
        const leads = JSON.parse(localStorage.getItem('quiz-leads') || '[]');
        leads.push(lead);
        localStorage.setItem('quiz-leads', JSON.stringify(leads));
    }
}

// Initialize the quiz when the page loads
let quiz;
document.addEventListener('DOMContentLoaded', () => {
    quiz = new SoundbiteQuiz();
});

// TikTok embed compatibility
window.addEventListener('message', (event) => {
    if (event.data.type === 'tiktok-embed-resize') {
        document.body.classList.add('tiktok-embed');
    }
});

// Export for use in other files
window.SoundbiteQuiz = SoundbiteQuiz;

// Signature ratio sizing (logo + dot wave)
function applySignatureRatios() {
    const logo = document.querySelector('.brand-logo');
    const wave = document.querySelector('.wave-graphic');
    const play = document.querySelector('.play-button-accent');
    if (!logo || !wave) return;

    // Determine available container width
    const container = document.querySelector('header') || document.body;
    const maxWidth = Math.min(container.clientWidth, 800); // constrain for readability

    // Brand guide visual suggests approx: overall width ~10x unit; logo ~5x; wave height ~0.25x of overall logo height
    const unit = Math.max(40, Math.floor(maxWidth / 10));
    // Logo width based on unit multiplier (brand-configurable)
    const logoUnitMult = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sb-logo-unit-multiplier')) || 5.0;
    const logoWidth = Math.round(unit * logoUnitMult);
    // Use configurable multiplier for wave width relative to logo
    const widthMultiplier = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sb-wave-width-multiplier')) || 2.0;
    const waveWidth = Math.round(logoWidth * widthMultiplier);

    // Set explicit sizes (height auto to preserve intrinsic aspect)
    logo.style.width = logoWidth + 'px';
    logo.style.height = 'auto';

    wave.style.width = waveWidth + 'px';
    // Lock wave height to 0.25 × logo height for precise adherence
    const measuredLogoHeight = logo.clientHeight || (logoWidth * 0.2); // fallback ratio if not yet painted
    const heightMultiplier = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sb-wave-height-multiplier')) || 0.25;
    const waveHeight = Math.max(1, Math.round(measuredLogoHeight * heightMultiplier));
    wave.style.height = waveHeight + 'px';

    // Clear space: 0.25X above/below and spacing between logo and wave
    const clearSpace = Math.round(logo.clientHeight * 0.25);
    const logoContainer = logo.closest('.logo-container');
    const waveContainer = wave.closest('.wave-decoration');
    if (logoContainer) {
        logoContainer.style.marginTop = clearSpace + 'px';
        logoContainer.style.marginBottom = Math.round(clearSpace * 0.5) + 'px';
        // Ensure the container stays centered as an inline-block
        const header = document.querySelector('header');
        if (header) {
            header.style.textAlign = 'center';
        }
    }
    if (waveContainer) {
        waveContainer.style.marginTop = Math.round(clearSpace * 0.5) + 'px';
        waveContainer.style.marginBottom = clearSpace + 'px';
    }

    // Size play button relative to logo height
    if (play) {
        const playMult = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sb-play-size-multiplier')) || 0.35;
        const playSize = Math.round(measuredLogoHeight * playMult);
        play.style.width = playSize + 'px';
        play.style.height = playSize + 'px';
        document.documentElement.style.setProperty('--sb-play-size', playSize + 'px');
    }
}

window.addEventListener('resize', applySignatureRatios);
document.addEventListener('DOMContentLoaded', () => {
    // Initial calculation
    applySignatureRatios();
    // Recalculate once images load to get accurate intrinsic sizes
    const logo = document.querySelector('.brand-logo');
    const wave = document.querySelector('.wave-graphic');
    if (logo && !logo.complete) {
        logo.addEventListener('load', applySignatureRatios, { once: true });
    }
    if (wave && !wave.complete) {
        wave.addEventListener('load', applySignatureRatios, { once: true });
    }
});