// Admin Panel JavaScript
class QuizAdmin {
	constructor() {
		this.currentTab = 'analytics';
		this.questions = this.loadQuestions();
		this.results = [];
		this.leads = [];
		this.filteredResults = [];
		this.filteredLeads = [];
		this.charts = {};
		this.editingQuestionId = null;
		this.init();
	}
	init() {
		this.attachEventListeners();
		if (document.getElementById('questions-list')) this.loadQuestionsList();
		const qtSel = document.getElementById('question-type');
		if (qtSel) this.updateTypeOptions({ target: qtSel });
		this.loadAnalytics();
		this.attachFilterHandlers();
	}
	attachEventListeners() {
		const qt = document.getElementById('questions-tab');
		if (qt) qt.addEventListener('click', () => this.switchTab('questions'));
		const at = document.getElementById('analytics-tab');
		if (at) at.addEventListener('click', () => this.switchTab('analytics'));
		const qf = document.getElementById('question-form');
		if (qf) qf.addEventListener('submit', (e) => this.addQuestion(e));
		const qtSel = document.getElementById('question-type');
		if (qtSel) qtSel.addEventListener('change', (e) => this.updateTypeOptions(e));
	}
	attachFilterHandlers() {
		const applyBtn = document.getElementById('apply-filters');
		const resetBtn = document.getElementById('reset-filters');
		if (applyBtn) applyBtn.addEventListener('click', () => this.applyFilters());
		if (resetBtn) resetBtn.addEventListener('click', () => this.resetFilters());
	}
	switchTab(tab) {
		document.querySelectorAll('.admin-panel').forEach(panel => {
			panel.style.display = 'none';
		});
		document.querySelectorAll('.tab-btn').forEach(btn => {
			btn.classList.remove('active');
		});
		const panel = document.getElementById(`${tab}-panel`);
		if (panel) panel.style.display = 'block';
		const tabBtn = document.getElementById(`${tab}-tab`);
		if (tabBtn) tabBtn.classList.add('active');
		this.currentTab = tab;
		if (tab === 'analytics') this.loadAnalytics();
		else if (tab === 'questions') this.loadQuestionsList();
	}
	loadQuestions() {
		const savedQuestions = localStorage.getItem('quiz-questions');
		if (savedQuestions) return JSON.parse(savedQuestions);
		return [];
	}
	saveQuestions() {
		localStorage.setItem('quiz-questions', JSON.stringify(this.questions));
	}
	addQuestion(event) {
		event.preventDefault();
		const questionText = document.getElementById('question-text').value;
		const questionType = document.getElementById('question-type').value;
		const questionData = {
			id: this.getNextId(),
			text: questionText,
			type: questionType,
			weight: 2
		};
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
		this.questions.push(questionData);
		this.saveQuestions();
		this.loadQuestionsList();
		event.target.reset();
		this.updateTypeOptions({ target: { value: 'slider' } });
	}
	getNextId() {
		return Math.max(...this.questions.map(q => q.id), 0) + 1;
	}
	getMultipleChoiceOptions() {
		const options = [];
		document.querySelectorAll('.option-input').forEach((input, index) => {
			if (input.value.trim()) {
				options.push({ value: (index + 1) * 2, text: input.value.trim() });
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
				`;
				break;
		}
		container.innerHTML = html;
	}
	loadQuestionsList() {
		const container = document.getElementById('questions-list');
		if (!container) return;
		if (this.questions.length === 0) {
			container.innerHTML = '<p>No questions found. Add your first question above.</p>';
			return;
		}
		const html = this.questions.map(question => `
			<div class="question-item" data-id="${question.id}">
				<h4>Question ${question.id}</h4>
				<p><strong>${question.text}</strong></p>
				<p>Type: ${question.type} | Weight: ${question.weight}</p>
			</div>
		`).join('');
		container.innerHTML = html;
	}
	loadAnalytics() {
		// Placeholder for analytics loading
	}
	applyFilters() {
		// Placeholder for filter logic
	}
	resetFilters() {
		// Placeholder for reset logic
	}
}
window.admin = new QuizAdmin();
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
