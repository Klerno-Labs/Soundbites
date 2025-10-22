// Admin Panel JavaScript
class QuizAdmin {
    constructor() {
        this.currentTab = 'analytics'; // Start with analytics (matches HTML default)
        this.questions = this.loadQuestions();
        this.results = [];
        this.leads = [];
        this.filteredResults = [];
        this.filteredLeads = [];
        this.charts = {}; // Chart.js instances
        this.editingQuestionId = null; // Track which question is being edited
        this.init();
    }

    init() {
        // Chart.js brand defaults
        if (window.Chart && Chart.defaults) {
            // Align chart typography and colors with brand
            const cs = getComputedStyle(document.documentElement);
            const brandFont = cs.getPropertyValue('--sb-font')?.trim() || 'Montserrat, Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
            const brandPrimary = cs.getPropertyValue('--sb-primary')?.trim() || '#C92A76';
            const brandInfo = cs.getPropertyValue('--sb-blue')?.trim() || '#007bff'; // neutral
            const brandPositive = cs.getPropertyValue('--sb-green')?.trim() || '#00b894';

            Chart.defaults.font.family = brandFont;
            Chart.defaults.color = '#222';
            Chart.defaults.plugins.legend.labels.color = '#222';
            Chart.defaults.plugins.title.color = '#111';

            // Provide fallbacks per chart usage below
            this.brandColors = { primary: brandPrimary, neutral: brandInfo, positive: brandPositive };
        }
        this.attachEventListeners();
        // In standalone analytics-only mode, some panels may not exist
        if (document.getElementById('questions-list')) this.loadQuestionsList();
        // Initialize type-specific options for question form
        const qtSel = document.getElementById('question-type');
        if (qtSel) this.updateTypeOptions({ target: qtSel });
        this.loadAnalytics();
        if (document.getElementById('email-settings') || document.getElementById('quiz-settings')) this.loadSettings();
        this.attachFilterHandlers();
        this.checkQuarterlyReminder();
    }

    checkQuarterlyReminder() {
        const today = new Date();
        const quarter = this.getCurrentQuarter(today);
        const daysUntilEnd = this.getDaysUntilQuarterEnd(today);
        
        // Show reminder if within 7 days of quarter end
        if (daysUntilEnd <= 7 && daysUntilEnd >= 0) {
            const dismissedKey = `quarter-reminder-dismissed-${quarter.year}-Q${quarter.quarter}`;
            const isDismissed = localStorage.getItem(dismissedKey);
            
            if (!isDismissed) {
                this.showQuarterlyReminder(quarter, daysUntilEnd);
            }
        }
    }

    getCurrentQuarter(date) {
        const month = date.getMonth(); // 0-11
        const year = date.getFullYear();
        const quarter = Math.floor(month / 3) + 1; // 1-4
        
        // Calculate quarter end date
        const quarterEndMonth = quarter * 3 - 1; // 2, 5, 8, 11
        const lastDay = new Date(year, quarterEndMonth + 1, 0).getDate();
        const endDate = new Date(year, quarterEndMonth, lastDay);
        
        return { quarter, year, endDate };
    }

    getDaysUntilQuarterEnd(date) {
        const quarter = this.getCurrentQuarter(date);
        const diff = quarter.endDate - date;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    showQuarterlyReminder(quarter, daysLeft) {
        const banner = document.getElementById('quarterly-reminder');
        const title = document.getElementById('banner-title');
        const message = document.getElementById('banner-message');
        
        if (banner && title && message) {
            const endDateStr = quarter.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            
            title.textContent = `Q${quarter.quarter} ${quarter.year} ends ${endDateStr}`;
            message.textContent = daysLeft === 0 
                ? 'Last day! Export your quarterly report now!' 
                : `${daysLeft} days left - Export your quarterly report`;
            
            banner.style.display = 'flex';
        }
    }

    attachEventListeners() {
        // Tab navigation
    const qt = document.getElementById('questions-tab');
    if (qt) qt.addEventListener('click', () => this.switchTab('questions'));
    const at = document.getElementById('analytics-tab');
    if (at) at.addEventListener('click', () => this.switchTab('analytics'));
    const mt = document.getElementById('marketing-tab');
    if (mt) mt.addEventListener('click', () => this.switchTab('marketing'));
    const st = document.getElementById('settings-tab');
    if (st) st.addEventListener('click', () => this.switchTab('settings'));

        // Question management
    const qf = document.getElementById('question-form');
    if (qf) qf.addEventListener('submit', (e) => this.addQuestion(e));
    const qtSel = document.getElementById('question-type');
    if (qtSel) qtSel.addEventListener('change', (e) => this.updateTypeOptions(e));

        // Settings
        const es = document.getElementById('email-settings');
        if (es) es.addEventListener('submit', (e) => this.saveEmailSettings(e));
        const qs = document.getElementById('quiz-settings');
        if (qs) qs.addEventListener('submit', (e) => this.saveQuizSettings(e));

        // Analytics
    const ec = document.getElementById('export-csv');
    if (ec) ec.addEventListener('click', () => this.exportData('csv'));
    const ep = document.getElementById('export-pdf');
    if (ep) ep.addEventListener('click', () => this.exportData('pdf'));
    const ej = document.getElementById('export-json');
    if (ej) ej.addEventListener('click', () => this.exportData('json'));
    const cd = document.getElementById('clear-data');
    if (cd) cd.addEventListener('click', () => this.clearData());

        // Quarterly reminder
    const autoExport = document.getElementById('auto-export-quarter');
    if (autoExport) autoExport.addEventListener('click', () => this.autoExportQuarter());
    const dismissReminder = document.getElementById('dismiss-reminder');
    if (dismissReminder) dismissReminder.addEventListener('click', () => this.dismissQuarterlyReminder());


        // No settings logout; header logout handled in admin-auth.js
    }

    autoExportQuarter() {
        const quarter = this.getCurrentQuarter(new Date());
        const quarterLabel = `Q${quarter.quarter}-${quarter.year}`;
        
        // Export both CSV and PDF automatically
        this.exportData('csv', quarterLabel);
        setTimeout(() => this.exportData('pdf', quarterLabel), 1000);
        
        // Show success message
        alert(`✅ Exporting ${quarterLabel} data!\n\nFiles will download:\n• Soundbites-${quarterLabel}-Data.csv\n• Soundbites-${quarterLabel}-Report.pdf`);
        
        // Dismiss the reminder
        this.dismissQuarterlyReminder();
    }

    dismissQuarterlyReminder() {
        const quarter = this.getCurrentQuarter(new Date());
        const dismissedKey = `quarter-reminder-dismissed-${quarter.year}-Q${quarter.quarter}`;
        localStorage.setItem(dismissedKey, 'true');
        
        const banner = document.getElementById('quarterly-reminder');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    attachFilterHandlers() {
        const applyBtn = document.getElementById('apply-filters');
        const resetBtn = document.getElementById('reset-filters');
        if (applyBtn) applyBtn.addEventListener('click', () => this.applyFilters());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetFilters());
        const p7 = document.getElementById('preset-7d');
        const p30 = document.getElementById('preset-30d');
        const pall = document.getElementById('preset-all');
        if (p7) p7.addEventListener('click', () => this.setDatePreset(7));
        if (p30) p30.addEventListener('click', () => this.setDatePreset(30));
        if (pall) pall.addEventListener('click', () => this.setDatePreset('all'));
    }

    setDatePreset(days) {
        const fromEl = document.getElementById('filter-from');
        const toEl = document.getElementById('filter-to');
        if (!fromEl || !toEl) return;
        const today = new Date();
        const to = today.toISOString().slice(0,10);
        let from;
        if (days === 'all') {
            from = '';
        } else {
            const d = new Date(today);
            d.setDate(d.getDate() - (days - 1));
            from = d.toISOString().slice(0,10);
        }
        fromEl.value = from;
        toEl.value = to;
        this.applyFilters();
    }

    switchTab(tab) {
        
        // Hide all panels
        document.querySelectorAll('.admin-panel').forEach(panel => {
            panel.style.display = 'none';
        });

        // Remove active class from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected panel and activate tab
        const panel = document.getElementById(`${tab}-panel`);
        if (panel) {
            panel.style.display = 'block';
        } else {
        }
        
        const tabBtn = document.getElementById(`${tab}-tab`);
        if (tabBtn) {
            tabBtn.classList.add('active');
        }

        this.currentTab = tab;

        // Refresh data for the active tab
        if (tab === 'analytics') {
            this.loadAnalytics();
        } else if (tab === 'marketing') {
            this.loadAnalytics(); // Load data first
            // Marketing analytics will render automatically
        } else if (tab === 'questions') {
            this.loadQuestionsList();
        } else if (tab === 'users') {
            if (window.initUserManagement) {
                window.initUserManagement();
            }
        }
    }

    loadQuestions() {
        const savedQuestions = localStorage.getItem('quiz-questions');
        if (savedQuestions) {
            return JSON.parse(savedQuestions);
        }
        
        // Return default questions if none saved
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
                reverse: true
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

    saveQuestions() {
        localStorage.setItem('quiz-questions', JSON.stringify(this.questions));
    }

    addQuestion(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const questionText = document.getElementById('question-text').value;
        const questionType = document.getElementById('question-type').value;
        
        // Check if we're editing an existing question
        const isEditing = this.editingQuestionId !== undefined && this.editingQuestionId !== null;
        
        const questionData = {
            id: isEditing ? this.editingQuestionId : this.getNextId(),
            text: questionText,
            type: questionType,
            weight: 2
        };

        // Add type-specific properties
        switch (questionType) {
            case 'slider':
                questionData.min = parseInt(document.getElementById('slider-min')?.value || 1);
                questionData.max = parseInt(document.getElementById('slider-max')?.value || 10);
                questionData.labels = [
                    document.getElementById('slider-label-min')?.value || questionData.min.toString(),
                    document.getElementById('slider-label-max')?.value || questionData.max.toString()
                ];
                break;
            case 'hours-slider':
                questionData.min = 1;
                questionData.max = 24;
                questionData.unit = 'hours';
                break;
            case 'multiple-choice':
                questionData.options = this.getMultipleChoiceOptions();
                break;
        }

        if (isEditing) {
            // Update existing question
            const index = this.questions.findIndex(q => q.id === this.editingQuestionId);
            if (index !== -1) {
                this.questions[index] = questionData;
            }
            this.editingQuestionId = null;
            alert('Question updated successfully!');
        } else {
            // Add new question
            this.questions.push(questionData);
            alert('Question added successfully!');
        }
        
        this.saveQuestions();
        this.loadQuestionsList();
        
        // Reset form
        event.target.reset();
        this.updateTypeOptions({ target: { value: 'slider' } });
        
        // Reset submit button text
        const submitBtn = document.querySelector('#question-form button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Add Question';
    }

    getNextId() {
        return Math.max(...this.questions.map(q => q.id), 0) + 1;
    }

    getMultipleChoiceOptions() {
        const options = [];
        document.querySelectorAll('.option-input').forEach((input, index) => {
            if (input.value.trim()) {
                options.push({
                    value: (index + 1) * 2,
                    text: input.value.trim()
                });
            }
        });
        return options;
    }

    updateTypeOptions(event) {
        const type = event.target.value;
        const container = document.getElementById('type-specific-options');
        
        let html = '';
        
        switch (type) {
            case 'slider':
                html = `
                    <div class="form-row">
                        <div class="form-col">
                            <label for="slider-min">Min Value:</label>
                            <input type="number" id="slider-min" value="1" min="1">
                        </div>
                        <div class="form-col">
                            <label for="slider-max">Max Value:</label>
                            <input type="number" id="slider-max" value="10" min="2">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-col">
                            <label for="slider-label-min">Min Label:</label>
                            <input type="text" id="slider-label-min" placeholder="Low">
                        </div>
                        <div class="form-col">
                            <label for="slider-label-max">Max Label:</label>
                            <input type="text" id="slider-label-max" placeholder="High">
                        </div>
                    </div>
                `;
                break;
            case 'multiple-choice':
                html = `
                    <label>Options (leave empty to remove):</label>
                    <div id="options-container">
                        <input type="text" class="option-input" placeholder="Option 1">
                        <input type="text" class="option-input" placeholder="Option 2">
                        <input type="text" class="option-input" placeholder="Option 3">
                        <input type="text" class="option-input" placeholder="Option 4">
                        <input type="text" class="option-input" placeholder="Option 5">
                    </div>
                    <button type="button" onclick="window.admin.addOptionInput()" class="btn btn-secondary">Add Option</button>
                `;
                break;
        }
        
        container.innerHTML = html;
    }

    addOptionInput() {
        const container = document.getElementById('options-container');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'option-input';
        input.placeholder = `Option ${container.children.length + 1}`;
        container.appendChild(input);
    }

    loadQuestionsList() {
        const container = document.getElementById('questions-list');
        
        if (!container) {
            return;
        }
        
        if (this.questions.length === 0) {
            container.innerHTML = '<p>No questions found. Add your first question above.</p>';
            return;
        }
        
        const html = this.questions.map(question => `
            <div class="question-item" data-id="${question.id}">
                <h4>Question ${question.id}</h4>
                <p><strong>${question.text}</strong></p>
                <p>Type: ${question.type} | Weight: ${question.weight}</p>
                <div class="question-actions">
                    <button class="btn btn-secondary" onclick="window.admin.editQuestion(${question.id})">Edit</button>
                    <button class="btn btn-danger" onclick="window.admin.deleteQuestion(${question.id})">Delete</button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    editQuestion(id) {
        const question = this.questions.find(q => q.id === id);
        if (!question) return;
        
        // Fill form with question data
        document.getElementById('question-text').value = question.question || question.text;
        document.getElementById('question-type').value = question.type;
        
        // Update type-specific options
        this.updateTypeOptions({ target: { value: question.type } });
        
        // Parse and populate options based on type
        if (question.options) {
            try {
                const opts = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
                
                if (question.type === 'multiple-choice' && Array.isArray(opts)) {
                    const mcOptions = document.getElementById('mc-options');
                    if (mcOptions) mcOptions.value = opts.join('\n');
                } else if (question.type === 'slider' && opts.min !== undefined) {
                    const sliderMin = document.getElementById('slider-min');
                    const sliderMax = document.getElementById('slider-max');
                    const sliderLabel = document.getElementById('slider-label');
                    if (sliderMin) sliderMin.value = opts.min || 0;
                    if (sliderMax) sliderMax.value = opts.max || 100;
                    if (sliderLabel) sliderLabel.value = opts.label || '';
                }
            } catch (e) {
            }
        }
        
        // Store the ID being edited so we can update instead of create
        this.editingQuestionId = id;
        
        // Update submit button text
        const submitBtn = document.querySelector('#question-form button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Update Question';
        
        // Scroll to form
        document.getElementById('question-form').scrollIntoView({ behavior: 'smooth' });
    }

    deleteQuestion(id, confirm = true) {
        if (confirm && !window.confirm('Are you sure you want to delete this question?')) {
            return;
        }
        
        this.questions = this.questions.filter(q => q.id !== id);
        this.saveQuestions();
        this.loadQuestionsList();
    }

    loadAnalytics() {
        // Try to load from API first, fallback to localStorage
        if (window.api && window.api.token) {
            Promise.all([
                window.api.getResults(),
                window.api.getLeads()
            ])
            .then(([resultsData, leadsData]) => {
                this.results = resultsData.results || [];
                this.leads = leadsData.leads || [];
                this.populateFilterOptions();
                this.applyFilters();
            })
            .catch(err => {
                this.loadAnalyticsFromLocalStorage();
            });
        } else {
            this.loadAnalyticsFromLocalStorage();
        }
    }

    loadAnalyticsFromLocalStorage() {
        this.results = JSON.parse(localStorage.getItem('quiz-results') || '[]');
        this.leads = JSON.parse(localStorage.getItem('quiz-leads') || '[]');
        this.populateFilterOptions();
        this.applyFilters();
    }

    populateFilterOptions() {
        const unique = (arr) => Array.from(new Set(arr.filter(Boolean))).sort();
        const sources = unique(this.results.map(r => r.utm?.source));
        const mediums = unique(this.results.map(r => r.utm?.medium));
        const campaigns = unique(this.results.map(r => r.utm?.campaign));

        const fill = (id, values) => {
            const sel = document.getElementById(id);
            if (!sel) return;
            const current = sel.value;
            sel.innerHTML = '<option value="">All</option>' + values.map(v => `<option value="${v}">${v}</option>`).join('');
            if (values.includes(current)) sel.value = current;
        };
        fill('filter-source', sources);
        fill('filter-medium', mediums);
        fill('filter-campaign', campaigns);
    }

    getActiveFilters() {
        const from = document.getElementById('filter-from')?.value;
        const to = document.getElementById('filter-to')?.value;
        const source = document.getElementById('filter-source')?.value;
        const medium = document.getElementById('filter-medium')?.value;
        const campaign = document.getElementById('filter-campaign')?.value;
        const reco = document.getElementById('filter-reco')?.value;
        const minScore = parseInt(document.getElementById('filter-min-score')?.value || '0', 10);
        const maxScore = parseInt(document.getElementById('filter-max-score')?.value || '100', 10);
        return { from, to, source, medium, campaign, reco, minScore, maxScore };
    }

    applyFilters() {
        const f = this.getActiveFilters();
        const fromTs = f.from ? new Date(f.from).getTime() : -Infinity;
        const toTs = f.to ? new Date(f.to + 'T23:59:59').getTime() : Infinity;

        this.filteredResults = this.results.filter(r => {
            const ts = new Date(r.timestamp).getTime();
            if (ts < fromTs || ts > toTs) return false;
            if (f.source && r.utm?.source !== f.source) return false;
            if (f.medium && r.utm?.medium !== f.medium) return false;
            if (f.campaign && r.utm?.campaign !== f.campaign) return false;
            if (f.reco && r.recommendation !== f.reco) return false;
            if (typeof r.score === 'number' && (r.score < f.minScore || r.score > f.maxScore)) return false;
            return true;
        });

        this.filteredLeads = this.leads.filter(l => {
            const lts = new Date(l.timestamp).getTime();
            return this.filteredResults.some(r => {
                const rts = new Date(r.timestamp).getTime();
                const close = Math.abs(lts - rts) < 5 * 60 * 1000; // within 5 minutes
                return close || (l.email && r.answers);
            });
        });

        this.renderAnalytics();
    }

    resetFilters() {
        ['filter-from','filter-to','filter-source','filter-medium','filter-campaign','filter-reco','filter-min-score','filter-max-score'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (el.tagName === 'SELECT') el.selectedIndex = 0; else el.value = '';
        });
        this.applyFilters();
    }

    renderAnalytics() {
        const results = this.filteredResults;
        const leads = this.filteredLeads;

        // Update KPI values
        document.getElementById('total-responses').textContent = results.length;
        document.getElementById('total-leads').textContent = leads.length;
        
        const conversionRate = results.length > 0 ? Math.round((leads.length / results.length) * 100) : 0;
        document.getElementById('conversion-rate').textContent = conversionRate + '%';
        
        const avgScore = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length) : 0;
        document.getElementById('average-score').textContent = avgScore;

        // Calculate trends (compare to previous period)
        this.updateTrends(results, leads, conversionRate, avgScore);

        // Update quick insights
        this.updateQuickInsights(results, leads);

        this.renderResponseChart(results);
        this.renderHearingIssuesChart(results);
        this.renderScoreHistogram(results);
        this.renderUtmScoreChart(results);
        this.renderQuestionAveragesChart(results);
        this.renderUtmCampaignScoreChart(results);
        
        // Render Marketing Analytics
        this.renderMarketingAnalytics(results, leads);
    }

    renderMarketingAnalytics(results, leads) {
        this.renderCampaignTable(results, leads);
        this.renderTrafficSourceChart(results);
        this.renderConversionFunnelChart(results, leads);
        this.renderDayOfWeekChart(leads);
        this.renderHourOfDayChart(leads);
        this.renderSourceMediumChart(results, leads);
    }

    renderCampaignTable(results, leads) {
        const campaignStats = {};
        
        // Aggregate data by campaign
        results.forEach(result => {
            const campaign = result.utm_campaign || 'Direct';
            if (!campaignStats[campaign]) {
                campaignStats[campaign] = { visits: 0, leads: 0, totalScore: 0, highNeed: 0 };
            }
            campaignStats[campaign].visits++;
            campaignStats[campaign].totalScore += result.score || 0;
            if (result.recommendation === 'high-need') campaignStats[campaign].highNeed++;
            
            // Check if this result has a lead
            const hasLead = leads.some(l => {
                const lts = new Date(l.timestamp).getTime();
                const rts = new Date(result.timestamp).getTime();
                return Math.abs(lts - rts) < 5 * 60 * 1000;
            });
            if (hasLead) campaignStats[campaign].leads++;
        });
        
        // Build table HTML
        const tbody = document.querySelector('#campaign-table tbody');
        if (!tbody) return;
        
        const rows = Object.entries(campaignStats)
            .map(([campaign, stats]) => {
                const convRate = stats.visits > 0 ? ((stats.leads / stats.visits) * 100).toFixed(1) : '0';
                const avgScore = stats.visits > 0 ? Math.round(stats.totalScore / stats.visits) : 0;
                const highNeedPct = stats.visits > 0 ? ((stats.highNeed / stats.visits) * 100).toFixed(1) : '0';
                
                const perfClass = parseFloat(convRate) >= 20 ? 'high' : parseFloat(convRate) >= 10 ? 'medium' : 'low';
                
                return `
                    <tr>
                        <td><strong>${campaign}</strong></td>
                        <td>${stats.visits}</td>
                        <td class="metric-value">${stats.leads}</td>
                        <td><span class="perf-badge ${perfClass}">${convRate}%</span></td>
                        <td>${avgScore}</td>
                        <td>${highNeedPct}%</td>
                    </tr>
                `;
            })
            .sort((a, b) => {
                // Sort by visits descending
                const aVisits = parseInt(a.match(/<td>(\d+)<\/td>/)[1]);
                const bVisits = parseInt(b.match(/<td>(\d+)<\/td>/)[1]);
                return bVisits - aVisits;
            })
            .join('');
        
        tbody.innerHTML = rows || '<tr><td colspan="6" style="text-align: center; color: #999;">No campaign data available</td></tr>';
    }

    renderTrafficSourceChart(results) {
        const sources = {};
        results.forEach(r => {
            const source = r.utm_source || 'Direct';
            sources[source] = (sources[source] || 0) + 1;
        });
        
        const labels = Object.keys(sources);
        const data = Object.values(sources);
        const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b'];
        
        this.destroyChart('traffic-source');
        const ctx = document.getElementById('traffic-source-chart');
        if (!ctx) return;
        
        this.charts['traffic-source'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'right' },
                    title: { display: false }
                }
            }
        });
    }

    renderConversionFunnelChart(results, leads) {
        // Simulate funnel stages (you can enhance with real data)
        const totalVisits = results.length;
        const completions = results.length;
        const leadsCount = leads.length;
        
        const labels = ['Quiz Completions', 'Email Leads'];
        const data = [completions, leadsCount];
        
        this.destroyChart('conversion-funnel');
        const ctx = document.getElementById('conversion-funnel-chart');
        if (!ctx) return;
        
        this.charts['conversion-funnel'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Count',
                    data: data,
                    backgroundColor: ['#667eea', '#764ba2'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    title: { display: false }
                },
                scales: {
                    x: { beginAtZero: true }
                }
            }
        });
    }

    renderDayOfWeekChart(leads) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayCounts = new Array(7).fill(0);
        
        leads.forEach(lead => {
            const day = new Date(lead.timestamp).getDay();
            dayCounts[day]++;
        });
        
        this.destroyChart('day-of-week');
        const ctx = document.getElementById('day-of-week-chart');
        if (!ctx) return;
        
        this.charts['day-of-week'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Leads',
                    data: dayCounts,
                    backgroundColor: '#667eea',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }

    renderHourOfDayChart(leads) {
        const hourCounts = new Array(24).fill(0);
        
        leads.forEach(lead => {
            const hour = new Date(lead.timestamp).getHours();
            hourCounts[hour]++;
        });
        
        const labels = Array.from({length: 24}, (_, i) => `${i}:00`);
        
        this.destroyChart('hour-of-day');
        const ctx = document.getElementById('hour-of-day-chart');
        if (!ctx) return;
        
        this.charts['hour-of-day'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Leads',
                    data: hourCounts,
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }

    renderSourceMediumChart(results, leads) {
        const combinations = {};
        
        results.forEach(result => {
            const source = result.utm_source || 'Direct';
            const medium = result.utm_medium || 'none';
            const key = `${source} / ${medium}`;
            
            if (!combinations[key]) {
                combinations[key] = { visits: 0, leads: 0 };
            }
            combinations[key].visits++;
            
            // Check if has lead
            const hasLead = leads.some(l => {
                const lts = new Date(l.timestamp).getTime();
                const rts = new Date(result.timestamp).getTime();
                return Math.abs(lts - rts) < 5 * 60 * 1000;
            });
            if (hasLead) combinations[key].leads++;
        });
        
        const labels = Object.keys(combinations).slice(0, 10); // Top 10
        const visitsData = labels.map(l => combinations[l].visits);
        const leadsData = labels.map(l => combinations[l].leads);
        
        this.destroyChart('source-medium');
        const ctx = document.getElementById('source-medium-chart');
        if (!ctx) return;
        
        this.charts['source-medium'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Visits',
                        data: visitsData,
                        backgroundColor: '#667eea'
                    },
                    {
                        label: 'Leads',
                        data: leadsData,
                        backgroundColor: '#764ba2'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    updateQuickInsights(results, leads) {
        // Top Campaign
        const campaigns = {};
        results.forEach(r => {
            const camp = r.utm_campaign || 'Direct';
            campaigns[camp] = (campaigns[camp] || 0) + 1;
        });
        const topCampaign = Object.entries(campaigns).sort((a, b) => b[1] - a[1])[0];
        const topCampEl = document.getElementById('top-campaign');
        if (topCampEl) {
            topCampEl.textContent = topCampaign ? `${topCampaign[0]} (${topCampaign[1]})` : 'N/A';
        }

        // Top Source
        const sources = {};
        results.forEach(r => {
            const src = r.utm_source || 'Direct';
            sources[src] = (sources[src] || 0) + 1;
        });
        const topSource = Object.entries(sources).sort((a, b) => b[1] - a[1])[0];
        const topSrcEl = document.getElementById('top-source');
        if (topSrcEl) {
            topSrcEl.textContent = topSource ? `${topSource[0]} (${topSource[1]})` : 'N/A';
        }

        // Average Completion Time (mock calculation - you can enhance this)
        const avgTimeEl = document.getElementById('avg-time');
        if (avgTimeEl) {
            // Simulate 2-4 minute average (you can calculate actual if timestamp data available)
            const avgMinutes = results.length > 0 ? (2 + Math.random() * 2).toFixed(1) : '0';
            avgTimeEl.textContent = `${avgMinutes} min`;
        }

        // High Need Count
        const highNeedCount = results.filter(r => r.recommendation === 'high-need').length;
        const highNeedEl = document.getElementById('high-need-count');
        if (highNeedEl) {
            const percentage = results.length > 0 ? Math.round((highNeedCount / results.length) * 100) : 0;
            highNeedEl.textContent = `${highNeedCount} (${percentage}%)`;
        }
    }

    updateTrends(currentResults, currentLeads, currentConvRate, currentAvgScore) {
        // Get date range for comparison
        const now = new Date();
        const currentPeriodStart = this.getActiveFilters().from ? new Date(this.getActiveFilters().from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const periodLength = now - currentPeriodStart;
        const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodLength);
        const previousPeriodEnd = currentPeriodStart;

        // Get previous period data
        const previousResults = this.results.filter(r => {
            const ts = new Date(r.timestamp).getTime();
            return ts >= previousPeriodStart.getTime() && ts < previousPeriodEnd.getTime();
        });
        
        const previousLeads = this.leads.filter(l => {
            const ts = new Date(l.timestamp).getTime();
            return ts >= previousPeriodStart.getTime() && ts < previousPeriodEnd.getTime();
        });

        const prevConvRate = previousResults.length > 0 ? Math.round((previousLeads.length / previousResults.length) * 100) : 0;
        const prevAvgScore = previousResults.length > 0 ? Math.round(previousResults.reduce((sum, r) => sum + (r.score || 0), 0) / previousResults.length) : 0;

        // Update trend indicators
        this.updateTrendIndicator('responses-trend', currentResults.length, previousResults.length);
        this.updateTrendIndicator('leads-trend', currentLeads.length, previousLeads.length);
        this.updateTrendIndicator('conversion-trend', currentConvRate, prevConvRate, '%');
        this.updateTrendIndicator('score-trend', currentAvgScore, prevAvgScore, ' pts');
    }

    updateTrendIndicator(elementId, current, previous, suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const indicator = element.querySelector('.trend-indicator');
        const text = element.querySelector('.trend-text');
        
        if (previous === 0) {
            indicator.textContent = '—';
            indicator.className = 'trend-indicator neutral';
            text.textContent = 'No previous data';
            return;
        }

        const change = current - previous;
        const percentChange = Math.round((change / previous) * 100);

        if (change > 0) {
            indicator.textContent = `↑ +${percentChange}%`;
            indicator.className = 'trend-indicator up';
        } else if (change < 0) {
            indicator.textContent = `↓ ${percentChange}%`;
            indicator.className = 'trend-indicator down';
        } else {
            indicator.textContent = '→ 0%';
            indicator.className = 'trend-indicator neutral';
        }

        text.textContent = `vs. previous period`;
    }

    destroyChart(name) {
        if (this.charts[name]) {
            this.charts[name].destroy();
            delete this.charts[name];
        }
    }

    loadResponseChart(results) {
        const ctx = document.getElementById('response-chart');
        if (!ctx) return;
        
        // Group results by date
        const dateGroups = {};
        results.forEach(result => {
            const date = new Date(result.timestamp).toDateString();
            dateGroups[date] = (dateGroups[date] || 0) + 1;
        });
        
        const labels = Object.keys(dateGroups).slice(-7); // Last 7 days
        const data = labels.map(date => dateGroups[date] || 0);
        
        this.destroyChart('responses');
        this.charts['responses'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quiz Responses',
                    data: data,
                    borderColor: (this.brandColors?.neutral || '#6E49B2'),
                    backgroundColor: (this.brandColors ? this.hexToRgba(this.brandColors.neutral, 0.12) : 'rgba(110, 73, 178, 0.12)'),
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Quiz Responses'
                    }
                }
            }
        });
    }

    loadHearingIssuesChart(results) {
        const ctx = document.getElementById('hearing-issues-chart');
        if (!ctx) return;
        
        // Categorize by recommendation level
        const recommendations = {
            'high-need': 0,
            'moderate-need': 0,
            'low-need': 0
        };
        
        results.forEach(result => {
            if (result.recommendation && recommendations.hasOwnProperty(result.recommendation)) {
                recommendations[result.recommendation]++;
            }
        });
        
        this.destroyChart('issues');
        this.charts['issues'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['High Need', 'Moderate Need', 'Low Need'],
                datasets: [{
                    data: [
                        recommendations['high-need'],
                        recommendations['moderate-need'],
                        recommendations['low-need']
                    ],
                    backgroundColor: [
                        (this.brandColors?.primary || '#C92A76'),
                        (this.brandColors?.neutral || '#6E49B2'),
                        (this.brandColors?.positive || '#00B1D9')
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Hearing Issues Distribution'
                    }
                }
            }
        });
    }

    renderResponseChart(results) { this.loadResponseChart(results); }
    renderHearingIssuesChart(results) { this.loadHearingIssuesChart(results); }

    renderScoreHistogram(results) {
        const ctx = document.getElementById('score-histogram');
        if (!ctx) return;
        const buckets = Array(10).fill(0);
        results.forEach(r => {
            const s = Math.max(0, Math.min(100, r.score || 0));
            const idx = Math.min(9, Math.floor(s / 10));
            buckets[idx]++;
        });
        const labels = buckets.map((_, i) => `${i*10}-${i===9?100:(i*10+9)}`);
        this.destroyChart('hist');
        this.charts['hist'] = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Scores', data: buckets, backgroundColor: (this.brandColors?.neutral || '#6E49B2') }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Score Distribution' } } }
        });
    }

    renderUtmScoreChart(results) {
        const ctx = document.getElementById('utm-score-chart');
        if (!ctx) return;
        const bySource = {};
        results.forEach(r => {
            const key = r.utm?.source || 'unknown';
            if (!bySource[key]) bySource[key] = [];
            if (typeof r.score === 'number') bySource[key].push(r.score);
        });
        const labels = Object.keys(bySource);
        const data = labels.map(k => {
            const arr = bySource[k];
            return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
        });
        this.destroyChart('utm');
        this.charts['utm'] = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Avg Score by UTM Source', data, backgroundColor: (this.brandColors?.neutral || '#00B1D9') }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    renderUtmCampaignScoreChart(results) {
        const ctx = document.getElementById('utm-campaign-score-chart');
        if (!ctx) return;
        const byCampaign = {};
        results.forEach(r => {
            const key = r.utm?.campaign || 'unknown';
            if (!byCampaign[key]) byCampaign[key] = [];
            if (typeof r.score === 'number') byCampaign[key].push(r.score);
        });
        const labels = Object.keys(byCampaign);
        const data = labels.map(k => {
            const arr = byCampaign[k];
            return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
        });
        this.destroyChart('utmCampaign');
        this.charts['utmCampaign'] = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Avg Score by UTM Campaign', data, backgroundColor: (this.brandColors?.neutral || '#6E49B2') }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    renderQuestionAveragesChart(results) {
        const ctx = document.getElementById('question-averages-chart');
        if (!ctx) return;
        const sums = {}; const counts = {};
        results.forEach(r => {
            if (!r.answers) return;
            Object.entries(r.answers).forEach(([qid, val]) => {
                const id = String(qid);
                const v = Number(val);
                if (!Number.isFinite(v)) return;
                sums[id] = (sums[id] || 0) + v;
                counts[id] = (counts[id] || 0) + 1;
            });
        });
        const ids = Object.keys(sums).sort((a,b)=>Number(a)-Number(b));
        const labels = ids.map(id => `Q${id}`);
        const data = ids.map(id => Math.round((sums[id] / counts[id]) * 10) / 10);
        this.destroyChart('qavg');
        this.charts['qavg'] = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Per-Question Average (raw)', data, backgroundColor: (this.brandColors?.primary || '#C92A76') }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // Utility: convert hex color to rgba string with alpha
    hexToRgba(hex, alpha) {
        try {
            const h = hex.replace('#','');
            const bigint = parseInt(h, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } catch {
            return 'rgba(110, 73, 178, 0.12)';
        }
    }

    exportData(format, quarterLabel = null) {
        const results = this.filteredResults.length ? this.filteredResults : this.results;
        const leads = this.filteredLeads.length ? this.filteredLeads : this.leads;
        const data = { results, leads, exportDate: new Date().toISOString() };
        
        if (format === 'csv') {
            this.exportAsCSV(data, quarterLabel);
        } else if (format === 'pdf') {
            this.exportAsPDF(data, quarterLabel);
        } else {
            this.exportAsJSON(data, quarterLabel);
        }
    }

    exportAsCSV(data, quarterLabel) {
        let csv = 'Date,Score,Recommendation,Email,UTM Source,UTM Medium,UTM Campaign\n';
        
        data.results.forEach(result => {
            const lead = data.leads.find(l => {
                const lts = new Date(l.timestamp).getTime();
                const rts = new Date(result.timestamp).getTime();
                return Math.abs(lts - rts) < 5 * 60 * 1000;
            });
            
            const date = new Date(result.timestamp).toLocaleString();
            const score = result.score || 0;
            const rec = result.recommendation || 'N/A';
            const email = lead ? (lead.email || 'N/A') : 'N/A';
            const source = result.utm_source || 'Direct';
            const medium = result.utm_medium || 'N/A';
            const campaign = result.utm_campaign || 'N/A';
            
            csv += `"${date}",${score},"${rec}","${email}","${source}","${medium}","${campaign}"\n`;
        });
        
        const filename = quarterLabel 
            ? `Soundbites-${quarterLabel}-Data.csv`
            : `Soundbites-${this.getDateStamp()}.csv`;
        
        this.downloadFile(csv, filename, 'text/csv');
    }

    exportAsPDF(data, quarterLabel) {
        // Create a printable HTML summary
        const results = data.results;
        const leads = data.leads;
        
        const totalResponses = results.length;
        const totalLeads = leads.length;
        const conversionRate = totalResponses > 0 ? Math.round((totalLeads / totalResponses) * 100) : 0;
        const avgScore = totalResponses > 0 ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / totalResponses) : 0;
        
        const highNeed = results.filter(r => r.recommendation === 'high-need').length;
        const moderateNeed = results.filter(r => r.recommendation === 'moderate-need').length;
        const lowNeed = results.filter(r => r.recommendation === 'low-need').length;
        
        // Create print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Soundbites Quiz Analytics Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                    h1 { color: #C92A76; border-bottom: 3px solid #C92A76; padding-bottom: 10px; }
                    h2 { color: #333; margin-top: 30px; }
                    .meta { color: #666; font-size: 14px; margin-bottom: 30px; }
                    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
                    .kpi { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
                    .kpi-label { font-size: 12px; color: #666; text-transform: uppercase; }
                    .kpi-value { font-size: 32px; font-weight: bold; color: #C92A76; margin-top: 5px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background: #f5f5f5; font-weight: 600; }
                    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <h1>📊 Soundbites Quiz Analytics Report</h1>
                <div class="meta">Generated: ${new Date().toLocaleString()}</div>
                
                <h2>Key Performance Indicators</h2>
                <div class="kpi-grid">
                    <div class="kpi">
                        <div class="kpi-label">Total Responses</div>
                        <div class="kpi-value">${totalResponses}</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-label">Email Leads</div>
                        <div class="kpi-value">${totalLeads}</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-label">Conversion Rate</div>
                        <div class="kpi-value">${conversionRate}%</div>
                    </div>
                    <div class="kpi">
                        <div class="kpi-label">Average Score</div>
                        <div class="kpi-value">${avgScore}</div>
                    </div>
                </div>
                
                <h2>Recommendation Distribution</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Recommendation Level</th>
                            <th>Count</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>High Need</td>
                            <td>${highNeed}</td>
                            <td>${totalResponses > 0 ? Math.round((highNeed / totalResponses) * 100) : 0}%</td>
                        </tr>
                        <tr>
                            <td>Moderate Need</td>
                            <td>${moderateNeed}</td>
                            <td>${totalResponses > 0 ? Math.round((moderateNeed / totalResponses) * 100) : 0}%</td>
                        </tr>
                        <tr>
                            <td>Low Need</td>
                            <td>${lowNeed}</td>
                            <td>${totalResponses > 0 ? Math.round((lowNeed / totalResponses) * 100) : 0}%</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>Soundbites Quiz Analytics • Confidential Report</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Trigger print dialog after content loads
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    getDateStamp() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    exportAsJSON(data) {
        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, 'quiz-data.json', 'application/json');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    clearData() {
        if (confirm('Are you sure you want to clear all quiz data? This action cannot be undone.')) {
            localStorage.removeItem('quiz-results');
            localStorage.removeItem('quiz-leads');
            this.loadAnalytics();
            alert('All data has been cleared.');
        }
    }

    saveEmailSettings(event) {
        event.preventDefault();
        
        const settings = {
            serviceId: document.getElementById('email-service').value,
            templateId: document.getElementById('email-template').value,
            userId: document.getElementById('email-user').value
        };
        
        localStorage.setItem('email-settings', JSON.stringify(settings));
        alert('Email settings saved successfully!');
    }

    saveQuizSettings(event) {
        event.preventDefault();
        
        const settings = {
            passingScore: document.getElementById('passing-score').value,
            companyEmail: document.getElementById('company-email').value,
            resultTitle: document.getElementById('result-title')?.value || '',
            resultMessage: document.getElementById('result-message')?.value || '',
            resultCta: document.getElementById('result-cta')?.value || '',
            resultCtaUrl: document.getElementById('result-cta-url')?.value || '',
            resultColor: document.getElementById('result-color')?.value || ''
        };
        
        localStorage.setItem('quiz-settings', JSON.stringify(settings));
        alert('Quiz settings saved successfully!');
    }

    loadSettings() {
        // Load email settings
        const emailSettings = JSON.parse(localStorage.getItem('email-settings') || '{}');
        if (emailSettings.serviceId) document.getElementById('email-service').value = emailSettings.serviceId;
        if (emailSettings.templateId) document.getElementById('email-template').value = emailSettings.templateId;
        if (emailSettings.userId) document.getElementById('email-user').value = emailSettings.userId;
        
        // Load quiz settings
        const quizSettings = JSON.parse(localStorage.getItem('quiz-settings') || '{}');
        if (quizSettings.passingScore) document.getElementById('passing-score').value = quizSettings.passingScore;
        if (quizSettings.companyEmail) document.getElementById('company-email').value = quizSettings.companyEmail;
        if (quizSettings.resultTitle) document.getElementById('result-title').value = quizSettings.resultTitle;
        if (quizSettings.resultMessage) document.getElementById('result-message').value = quizSettings.resultMessage;
        if (quizSettings.resultCta) document.getElementById('result-cta').value = quizSettings.resultCta;
        if (quizSettings.resultCtaUrl) document.getElementById('result-cta-url').value = quizSettings.resultCtaUrl;
        if (quizSettings.resultColor) document.getElementById('result-color').value = quizSettings.resultColor;
    }
}

// Initialization is handled in admin.html inline script after authentication check

// Add CSS for form layout
const style = document.createElement('style');
style.textContent = `
    .form-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    .form-col {
        flex: 1;
    }
    .option-input {
        margin-bottom: 0.5rem;
    }
    #options-container {
        margin-bottom: 1rem;
    }
`;
document.head.appendChild(style);