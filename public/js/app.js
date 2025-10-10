// AI Resume Reviewer - Frontend JavaScript

class ResumeAnalyzer {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadRecentAnalyses();
        this.loadStats();
    }

    bindEvents() {
        const form = document.getElementById('resumeForm');
        const fileInput = document.getElementById('resumeFile');

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.analyzeResume();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.validateFile(e.target);
        });

        // Error alert close
        const errorAlert = document.getElementById('errorAlert');
        errorAlert.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-close')) {
                this.hideError();
            }
        });

        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    validateFile(input) {
        const file = input.files[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['application/pdf', 'text/plain'];

        if (file.size > maxSize) {
            this.showError('File size exceeds 5MB limit. Please choose a smaller file.');
            input.value = '';
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            this.showError('Please select a PDF or TXT file.');
            input.value = '';
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

        if (!this.validateFile(fileInput)) {
            return;
        }

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

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            this.hideLoading();
            this.showResults(data.data);
            this.loadRecentAnalyses(); // Refresh recent analyses

        } catch (error) {
            this.hideLoading();
            this.showError(error.message || 'An error occurred during analysis.');
        }
    }

    showLoading() {
        document.getElementById('loadingSection').style.display = 'block';
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing...';
    }

    hideLoading() {
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-magic me-2"></i>Analyze Resume';
    }

    showResults(data) {
        const analysis = data.analysis;
        
        // Update scores
        document.getElementById('overallScore').textContent = `${analysis.overallScore}/10`;
        document.getElementById('toneScore').textContent = `${analysis.toneScore}/10`;
        document.getElementById('formattingScore').textContent = `${analysis.formattingScore}/10`;
        document.getElementById('clarityScore').textContent = `${analysis.clarityScore}/10`;

        // Update score card colors based on scores
        this.updateScoreCardColors(analysis);

        // Update strengths
        const strengthsList = document.getElementById('strengthsList');
        strengthsList.innerHTML = '';
        analysis.strengths.forEach(strength => {
            const li = document.createElement('li');
            li.textContent = strength;
            strengthsList.appendChild(li);
        });

        // Update weaknesses
        const weaknessesList = document.getElementById('weaknessesList');
        weaknessesList.innerHTML = '';
        analysis.weaknesses.forEach(weakness => {
            const li = document.createElement('li');
            li.textContent = weakness;
            li.style.setProperty('--list-icon', '\\f071'); // Warning icon
            li.style.color = '#dc3545';
            weaknessesList.appendChild(li);
        });

        // Update suggestions
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = '';
        analysis.suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.textContent = suggestion;
            li.style.setProperty('--list-icon', '\\f0eb'); // Lightbulb icon
            li.style.color = '#007bff';
            suggestionsList.appendChild(li);
        });

        // Update detailed feedback
        document.getElementById('detailedFeedback').textContent = analysis.detailedFeedback;

        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.style.display = 'block';
        resultsSection.classList.add('fade-in');

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        // Reset form
        document.getElementById('resumeForm').reset();
    }

    updateScoreCardColors(analysis) {
        const scores = [
            { id: 'overallScore', value: analysis.overallScore },
            { id: 'toneScore', value: analysis.toneScore },
            { id: 'formattingScore', value: analysis.formattingScore },
            { id: 'clarityScore', value: analysis.clarityScore }
        ];

        scores.forEach(score => {
            const card = document.getElementById(score.id).closest('.card');
            // Remove existing score classes
            card.classList.remove('score-excellent', 'score-good', 'score-average', 'score-poor');
            
            // Add appropriate class based on score
            if (score.value >= 8) {
                card.classList.add('score-excellent');
            } else if (score.value >= 6) {
                card.classList.add('score-good');
            } else if (score.value >= 4) {
                card.classList.add('score-average');
            } else {
                card.classList.add('score-poor');
            }
        });
    }

    hideResults() {
        document.getElementById('resultsSection').style.display = 'none';
    }

    showError(message) {
        const errorAlert = document.getElementById('errorAlert');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorAlert.style.display = 'block';
        errorAlert.classList.add('show');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        const errorAlert = document.getElementById('errorAlert');
        errorAlert.classList.remove('show');
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 150);
    }

    async loadRecentAnalyses() {
        try {
            const response = await fetch(`${this.apiBase}/resume/recent?limit=5`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

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

        const html = analyses.map(analysis => {
            const scoreClass = this.getScoreClass(analysis.overallScore);
            const date = new Date(analysis.uploadedAt).toLocaleDateString();
            const time = new Date(analysis.uploadedAt).toLocaleTimeString();

            return `
                <div class="d-flex justify-content-between align-items-center p-3 mb-2 bg-light rounded">
                    <div>
                        <h6 class="mb-1">${analysis.fileName}</h6>
                        <small class="text-muted">${date} at ${time}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge ${scoreClass} fs-6">${analysis.overallScore}/10</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiBase}/resume/stats`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            this.displayStats(data.data);
        } catch (error) {
            console.error('Failed to load stats:', error);
            document.getElementById('statsContent').innerHTML = 
                '<div class="col-12 text-center"><p class="text-muted">Failed to load statistics.</p></div>';
        }
    }

    displayStats(stats) {
        const html = `
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

        document.getElementById('statsContent').innerHTML = html;
    }

    getScoreClass(score) {
        if (score >= 8) return 'bg-success';
        if (score >= 6) return 'bg-info';
        if (score >= 4) return 'bg-warning';
        return 'bg-danger';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ResumeAnalyzer();
});

// Add some utility functions for enhanced UX
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show a temporary success message
        console.log('Copied to clipboard');
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + U to focus file input
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        document.getElementById('resumeFile').click();
    }
});