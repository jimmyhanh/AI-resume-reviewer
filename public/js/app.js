// AI Resume Reviewer - Frontend JavaScript

class ResumeAnalyzer {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.bindDropZone();
        this.loadRecentAnalyses();
        this.loadStats();
    }

    bindEvents() {
        const form = document.getElementById('resumeForm');
        const fileInput = document.getElementById('resumeFile');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.analyzeResume();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.showFilePreview(e.target.files[0]);
            }
        });

        document.getElementById('clearFile').addEventListener('click', () => {
            document.getElementById('resumeFile').value = '';
            document.getElementById('filePreview').classList.add('d-none');
        });

        const errorAlert = document.getElementById('errorAlert');
        errorAlert.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-close')) {
                this.hideError();
            }
        });

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    bindDropZone() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('resumeFile');

        // Click or keyboard opens file picker
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });

        // Drag events
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) {
                if (this.validateFile(file)) {
                    // Assign to the hidden file input via DataTransfer
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileInput.files = dt.files;
                    this.showFilePreview(file);
                }
            }
        });
    }

    showFilePreview(file) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent =
            `(${(file.size / 1024).toFixed(1)} KB)`;
        document.getElementById('filePreview').classList.remove('d-none');
    }

    validateFile(file) {
        const maxSize = 5 * 1024 * 1024;
        const allowedTypes = ['application/pdf', 'text/plain'];

        if (file.size > maxSize) {
            this.showError('File size exceeds 5MB limit. Please choose a smaller file.');
            return false;
        }
        if (!allowedTypes.includes(file.type)) {
            this.showError('Please select a PDF or TXT file.');
            return false;
        }
        return true;
    }

    async analyzeResume() {
        const fileInput = document.getElementById('resumeFile');
        const file = fileInput.files[0];

        if (!file) {
            this.showError('Please select a resume file.');
            return;
        }
        if (!this.validateFile(file)) return;

        try {
            this.showLoading();
            this.hideError();
            this.hideResults();

            const formData = new FormData();
            formData.append('resume', file);

            const response = await fetch(`${this.apiBase}/resume/analyze`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Analysis failed');

            this.hideLoading();
            this.showResults(data.data);
            this.loadRecentAnalyses();

        } catch (error) {
            this.hideLoading();
            this.showError(error.message || 'An error occurred during analysis.');
        }
    }

    showLoading() {
        document.getElementById('loadingSection').style.display = 'block';
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('submitBtn').innerHTML =
            '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing...';
    }

    hideLoading() {
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('submitBtn').innerHTML =
            '<i class="fas fa-magic me-2"></i>Analyze Resume';
    }

    showResults(data) {
        const analysis = data.analysis;

        // Update score text
        document.getElementById('overallScore').textContent    = `${analysis.overallScore}/10`;
        document.getElementById('toneScore').textContent       = `${analysis.toneScore}/10`;
        document.getElementById('formattingScore').textContent = `${analysis.formattingScore}/10`;
        document.getElementById('clarityScore').textContent    = `${analysis.clarityScore}/10`;

        // Animate progress bars (0 → value after a brief delay so CSS transition fires)
        requestAnimationFrame(() => {
            setTimeout(() => {
                document.getElementById('overallBar').style.width    = `${analysis.overallScore * 10}%`;
                document.getElementById('toneBar').style.width       = `${analysis.toneScore * 10}%`;
                document.getElementById('formattingBar').style.width = `${analysis.formattingScore * 10}%`;
                document.getElementById('clarityBar').style.width    = `${analysis.clarityScore * 10}%`;
            }, 80);
        });

        // Color-code score cards
        this.updateScoreCardColors(analysis);

        // Populate lists
        const listMap = {
            strengthsList:   analysis.strengths,
            weaknessesList:  analysis.weaknesses,
            suggestionsList: analysis.suggestions
        };
        Object.entries(listMap).forEach(([id, items]) => {
            const el = document.getElementById(id);
            el.innerHTML = '';
            (items || []).forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                el.appendChild(li);
            });
        });

        document.getElementById('detailedFeedback').textContent = analysis.detailedFeedback;

        const resultsSection = document.getElementById('resultsSection');
        resultsSection.style.display = 'block';
        resultsSection.classList.add('fade-in');
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        // Reset form state
        document.getElementById('resumeForm').reset();
        document.getElementById('filePreview').classList.add('d-none');
    }

    updateScoreCardColors(analysis) {
        const cards = [
            { cardId: 'overallCard',    value: analysis.overallScore },
            { cardId: 'toneCard',       value: analysis.toneScore },
            { cardId: 'formattingCard', value: analysis.formattingScore },
            { cardId: 'clarityCard',    value: analysis.clarityScore }
        ];

        cards.forEach(({ cardId, value }) => {
            const card = document.getElementById(cardId);
            card.classList.remove('score-excellent', 'score-good', 'score-average', 'score-poor');
            if (value >= 8)      card.classList.add('score-excellent');
            else if (value >= 6) card.classList.add('score-good');
            else if (value >= 4) card.classList.add('score-average');
            else                 card.classList.add('score-poor');
        });
    }

    hideResults() {
        document.getElementById('resultsSection').style.display = 'none';
    }

    showError(message) {
        const errorAlert = document.getElementById('errorAlert');
        document.getElementById('errorMessage').textContent = message;
        errorAlert.style.display = 'block';
        errorAlert.classList.add('show');
        setTimeout(() => this.hideError(), 5000);
    }

    hideError() {
        const errorAlert = document.getElementById('errorAlert');
        errorAlert.classList.remove('show');
        setTimeout(() => { errorAlert.style.display = 'none'; }, 150);
    }

    async loadRecentAnalyses() {
        try {
            const response = await fetch(`${this.apiBase}/resume/recent?limit=5`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            this.displayRecentAnalyses(data.data);
        } catch (error) {
            console.error('Failed to load recent analyses:', error);
        }
    }

    displayRecentAnalyses(analyses) {
        const container = document.getElementById('recentAnalyses');

        if (!analyses || analyses.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No recent analyses found.</p>';
            return;
        }

        container.innerHTML = analyses.map(analysis => {
            const scoreClass = this.getScoreClass(analysis.overallScore);
            const date = new Date(analysis.uploadedAt).toLocaleDateString();
            const time = new Date(analysis.uploadedAt).toLocaleTimeString();
            return `
                <div class="d-flex justify-content-between align-items-center p-3 mb-2 bg-light rounded">
                    <div>
                        <h6 class="mb-1">${analysis.fileName}</h6>
                        <small class="text-muted">${date} at ${time}</small>
                    </div>
                    <span class="badge ${scoreClass} fs-6">${analysis.overallScore}/10</span>
                </div>
            `;
        }).join('');
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiBase}/resume/stats`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            this.displayStats(data.data);
        } catch (error) {
            console.error('Failed to load stats:', error);
            document.getElementById('statsContent').innerHTML =
                '<div class="col-12 text-center"><p class="text-muted">Failed to load statistics.</p></div>';
        }
    }

    displayStats(stats) {
        document.getElementById('statsContent').innerHTML = `
            <div class="col-md-3 mb-3">
                <div class="text-center">
                    <h3 class="text-primary">${stats.totalAnalyses}</h3>
                    <p class="text-muted mb-0">Total Analyses</p>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="text-center">
                    <h3 class="text-success">${stats.recentAnalyses}</h3>
                    <p class="text-muted mb-0">This Week</p>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="text-center">
                    <h3 class="text-info">${stats.averageScores.overall}</h3>
                    <p class="text-muted mb-0">Avg Overall Score</p>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="text-center">
                    <h3 class="text-warning">${stats.averageScores.tone}</h3>
                    <p class="text-muted mb-0">Avg Tone Score</p>
                </div>
            </div>
        `;
    }

    getScoreClass(score) {
        if (score >= 8) return 'bg-success';
        if (score >= 6) return 'bg-info';
        if (score >= 4) return 'bg-warning';
        return 'bg-danger';
    }
}

document.addEventListener('DOMContentLoaded', () => new ResumeAnalyzer());

// Ctrl/Cmd+U keyboard shortcut to open file picker
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        document.getElementById('resumeFile').click();
    }
});