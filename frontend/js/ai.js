const API_BASE_URL = 'http://localhost:3000';

// Global variables
let currentAnalysis = null;

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ AI Analysis page loaded');

    // Check authentication
    if (!checkAuth()) return;

    // Set default dates
    setDefaultDates();

    // Load latest analysis
    loadLatestAnalysis();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        showMessage('Please login to access AI analysis', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return false;
    }

    return true;
}

// Set default dates (last 7 days)
function setDefaultDates() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
}

// Run nutrient analysis
async function runAnalysis() {
    const token = localStorage.getItem('token');
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        showMessage('Please select both start and end dates', 'warning');
        return;
    }

    // Show loading
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/api/nutrient/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ startDate, endDate })
        });

        const result = await response.json();

        if (result.success) {
            currentAnalysis = result.data;
            displayAnalysis(result.data);
            showMessage('✅ Analysis completed successfully!', 'success');
        } else {
            showLoading(false);
            if (result.data && !result.data.analysis) {
                showNoDataMessage();
            } else {
                showMessage(result.message || 'Analysis failed', 'error');
            }
        }
    } catch (error) {
        console.error('Error running analysis:', error);
        showMessage('❌ Network error. Please try again.', 'error');
        showLoading(false);
    }
}

// Load latest analysis
async function loadLatestAnalysis() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/api/nutrient/latest`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (result.success && result.data) {
            currentAnalysis = result.data;
            displayAnalysis(result.data);
        } else {
            // No analysis found, show empty state
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading latest analysis:', error);
        showEmptyState();
    }
}

// Display analysis results
function displayAnalysis(data) {
    try {
        if (!data || !data.analysis) {
            showNoDataMessage();
            return;
        }

        const analysis = data.analysis;
        const recommendations = data.recommendations || [];

        // Update score card
        const overallScore = data.overallScore !== undefined ? data.overallScore : (analysis.overall_risk ? 75 : 0);
        document.getElementById('overallScore').textContent = overallScore;

        // Count deficiencies
        const deficiencyCount = Object.values(analysis).filter(n => n && typeof n === 'object' && n.deficient).length;
        document.getElementById('deficienciesFound').textContent = deficiencyCount;

        // Days analyzed
        const daysAnalyzed = data.daysAnalyzed || (Object.keys(analysis).length > 0 ? 7 : 0);
        document.getElementById('daysAnalyzed').textContent = daysAnalyzed;

        // Render nutrient grid
        renderNutrientGrid(analysis);

        // Render recommendations
        renderRecommendations(recommendations);
    } catch (err) {
        console.error('Error in displayAnalysis:', err);
    } finally {
        showLoading(false);
    }
}

// Render nutrient grid
function renderNutrientGrid(analysis) {
    const grid = document.getElementById('nutrientGrid');

    if (!analysis || Object.keys(analysis).length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-flask" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
                <p style="color: #666;">No nutrient data available. Please run an analysis.</p>
            </div>
        `;
        return;
    }

    let html = '';

    Object.keys(analysis).forEach(nutrient => {
        const n = analysis[nutrient];
        const statusClass = getStatusClass(n.deficient, n.severity);
        const statusText = getStatusText(n.deficient, n.severity);
        const progressClass = getProgressClass(n.percentage);

        html += `
            <div class="nutrient-card">
                <div class="nutrient-header">
                    <span class="nutrient-name">${formatNutrientName(nutrient)}</span>
                    <span class="nutrient-status ${statusClass}">${statusText}</span>
                </div>
                
                <div class="nutrient-values">
                    <span>Intake: ${n.intake || 0} ${getUnit(nutrient)}</span>
                    <span>Target: ${n.recommended || 0} ${getUnit(nutrient)}</span>
                </div>
                
                <div class="nutrient-progress">
                    <div class="progress-fill ${progressClass}" 
                         style="width: ${Math.min(n.percentage || 0, 100)}%"></div>
                </div>
                
                <div style="font-size: 0.9rem; color: #666; margin-top: 10px;">
                    ${n.percentage ? n.percentage.toFixed(1) : 0}% of daily target
                    ${n.excess ? '<span style="color: #FF9800; margin-left: 8px;">⚠️ Excess</span>' : ''}
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;
}

// Render recommendations
function renderRecommendations(recommendations) {
    const list = document.getElementById('recommendationsList');

    if (!recommendations || recommendations.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-check-circle" style="font-size: 3rem; color: #4CAF50; margin-bottom: 15px;"></i>
                <h3 style="color: #333;">Great job!</h3>
                <p style="color: #666;">No nutrient deficiencies detected. Keep up the good work!</p>
            </div>
        `;
        return;
    }

    let html = '';

    recommendations.forEach(rec => {
        const deficiencyClass = rec.deficiency === 'critical' ? 'status-critical' :
            rec.deficiency === 'moderate' ? 'status-moderate' : 'status-mild';

        html += `
            <div class="recommendation-item">
                <div class="recommendation-header">
                    <span class="recommendation-title">
                        <i class="fas fa-exclamation-circle" style="color: ${getDeficiencyColor(rec.deficiency)}"></i>
                        Low ${formatNutrientName(rec.nutrient)}
                    </span>
                    <span class="deficiency-badge ${deficiencyClass}">
                        ${rec.deficiency.toUpperCase()}
                    </span>
                </div>
                
                <p style="color: #666; margin-bottom: 15px;">
                    Consider adding these foods to your diet:
                </p>
                
                <div class="food-list">
                    ${renderFoods(rec.foods)}
                </div>
                
                <ul class="suggestion-list">
                    ${renderSuggestions(rec.mealSuggestions)}
                </ul>
            </div>
        `;
    });

    list.innerHTML = html;
}

// Render food items
function renderFoods(foods) {
    if (!foods || foods.length === 0) {
        return '<div class="food-item">No specific recommendations available</div>';
    }

    return foods.map(food => `
        <div class="food-item">
            <div class="food-name">${food.name}</div>
            <div class="food-amount">${food.amount}</div>
            <div class="food-nutrient">${food.nutrientContent} per serving</div>
        </div>
    `).join('');
}

// Render meal suggestions
function renderSuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) {
        return '<li>No specific meal suggestions available</li>';
    }

    return suggestions.map(s => `<li>${s}</li>`).join('');
}

// Helper functions
function formatNutrientName(nutrient) {
    const names = {
        protein: 'Protein',
        iron: 'Iron',
        calcium: 'Calcium',
        vitaminB12: 'Vitamin B12',
        fiber: 'Fiber'
    };
    return names[nutrient] || nutrient;
}

function getUnit(nutrient) {
    const units = {
        protein: 'g',
        iron: 'mg',
        calcium: 'mg',
        vitaminB12: 'mcg',
        fiber: 'g'
    };
    return units[nutrient] || '';
}

function getStatusClass(deficient, severity) {
    if (!deficient) return 'status-good';
    if (severity === 'critical') return 'status-critical';
    if (severity === 'moderate') return 'status-moderate';
    return 'status-mild';
}

function getStatusText(deficient, severity) {
    if (!deficient) return 'Good';
    if (severity === 'critical') return 'Critical';
    if (severity === 'moderate') return 'Moderate';
    return 'Mild';
}

function getProgressClass(percentage) {
    if (percentage >= 90) return 'progress-good';
    if (percentage >= 70) return 'progress-medium';
    return 'progress-low';
}

function getDeficiencyColor(severity) {
    if (severity === 'critical') return '#f44336';
    if (severity === 'moderate') return '#FF9800';
    return '#FFC107';
}

// Show loading state
function showLoading(isLoading) {
    const grid = document.getElementById('nutrientGrid');
    const list = document.getElementById('recommendationsList');

    if (isLoading) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center;">
                <div class="loading-spinner"></div>
                <p style="color: #666;">Analyzing your nutrient intake...</p>
            </div>
        `;
        list.innerHTML = `
            <div style="text-align: center;">
                <div class="loading-spinner"></div>
                <p style="color: #666;">Generating recommendations...</p>
            </div>
        `;
    } else {
        // If not loading, the renders will handle the content
        // This is just a safety catch
        const existingSpinner = document.querySelector('.loading-spinner');
        if (existingSpinner && !currentAnalysis) {
            showEmptyState();
        }
    }
}

// Show no data message
function showNoDataMessage() {
    document.getElementById('nutrientGrid').innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
            <i class="fas fa-database" style="font-size: 3rem; color: #ddd; margin-bottom: 15px;"></i>
            <h3 style="color: #333;">No Data Available</h3>
            <p style="color: #666;">No meal logs found for the selected period.</p>
            <p style="color: #666;">Log some meals and try again!</p>
            <button class="btn-analyze" style="margin-top: 20px;" onclick="window.location.href='diet-plan.html'">
                <i class="fas fa-utensils"></i> Go to Diet Plan
            </button>
        </div>
    `;

    document.getElementById('recommendationsList').innerHTML = '';

    document.getElementById('overallScore').textContent = '0';
    document.getElementById('deficienciesFound').textContent = '0';
    document.getElementById('daysAnalyzed').textContent = '0';

    showLoading(false);
}

// Show empty state
function showEmptyState() {
    document.getElementById('nutrientGrid').innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
            <i class="fas fa-robot" style="font-size: 3rem; color: #4CAF50; margin-bottom: 15px;"></i>
            <h3 style="color: #333;">Ready to Analyze Your Nutrition</h3>
            <p style="color: #666;">Select a date range and click "Run Analysis" to get started.</p>
            <p style="color: #666;">Our AI will detect nutrient deficiencies and provide recommendations.</p>
        </div>
    `;

    document.getElementById('recommendationsList').innerHTML = '';

    document.getElementById('overallScore').textContent = '-';
    document.getElementById('deficienciesFound').textContent = '-';
    document.getElementById('daysAnalyzed').textContent = '-';

    showLoading(false);
}

// Refresh analysis
function refreshAnalysis() {
    runAnalysis();
}

// Show message
function showMessage(message, type = 'info') {
    // Use your existing notification system or alert
    alert(`${type.toUpperCase()}: ${message}`);
}

// Make functions globally available
window.runAnalysis = runAnalysis;
window.refreshAnalysis = refreshAnalysis;