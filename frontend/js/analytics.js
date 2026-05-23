const API_BASE_URL = 'http://localhost:3000';

// Chart instances
let nutritionChart;
let mealDistributionChart;
let workoutDurationChart;
let workoutCaloriesChart;
let workoutTypeChart;
let weeklyWorkoutChart;

// ========== NUTRITION FUNCTIONS ==========

async function loadNutritionData(days = 7) {
    console.log(`📊 Loading nutrition data for last ${days} days...`);
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No authentication token found');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/logs/nutrition/summary?days=${days}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📡 Nutrition API Response:', result);

        if (result.success) {
            renderNutritionChart(result.data);
            updateNutritionStats(result.data);
        } else {
            console.error('❌ Failed to load nutrition data:', result.message);
        }
    } catch (error) {
        console.error('❌ Error loading nutrition data:', error);
    }
}

function renderNutritionChart(data) {
    console.log('📈 Rendering nutrition chart with data:', data);

    if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js library is not loaded!');
        return;
    }

    const canvas = document.getElementById('nutritionChart');
    if (!canvas) {
        console.error('❌ Canvas element "nutritionChart" not found!');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (nutritionChart) nutritionChart.destroy();

    if (!data || data.length === 0) {
        console.warn('⚠️ No nutrition data to display in chart');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('No logged nutrition data found for this period.', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Sort data by date
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    nutritionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => {
                const date = new Date(d.date);
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }),
            datasets: [
                {
                    label: 'Protein (g)',
                    data: data.map(d => d.protein || 0),
                    backgroundColor: 'rgba(76, 175, 80, 0.8)',
                    borderColor: '#4CAF50',
                    borderWidth: 1,
                    borderRadius: 5
                },
                {
                    label: 'Carbs (g)',
                    data: data.map(d => d.carbs || 0),
                    backgroundColor: 'rgba(33, 150, 243, 0.8)',
                    borderColor: '#2196F3',
                    borderWidth: 1,
                    borderRadius: 5
                },
                {
                    label: 'Fats (g)',
                    data: data.map(d => d.fats || 0),
                    backgroundColor: 'rgba(255, 152, 0, 0.8)',
                    borderColor: '#FF9800',
                    borderWidth: 1,
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { family: "'Inter', sans-serif", size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            return ` ${context.dataset.label}: ${context.raw}g`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Grams', font: { weight: 'bold' } },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}

function updateNutritionStats(data) {
    if (!data || data.length === 0) {
        ['avgCalories', 'avgProtein', 'avgCarbs', 'avgFats'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });
        return;
    }

    const totalCalories = data.reduce((sum, d) => sum + (d.calories || 0), 0);
    const totalProtein = data.reduce((sum, d) => sum + (d.protein || 0), 0);
    const totalCarbs = data.reduce((sum, d) => sum + (d.carbs || 0), 0);
    const totalFats = data.reduce((sum, d) => sum + (d.fats || 0), 0);
    const dayCount = data.length;

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('avgCalories', (totalCalories / dayCount).toFixed(0));
    setEl('avgProtein', (totalProtein / dayCount).toFixed(1));
    setEl('avgCarbs', (totalCarbs / dayCount).toFixed(1));
    setEl('avgFats', (totalFats / dayCount).toFixed(1));
}

// ========== MEAL-LEVEL DIET FUNCTIONS ==========

async function loadMealData(days = 7) {
    console.log(`🍽️ Loading meal data for last ${days} days...`);
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (parseInt(days) - 1));
        startDate.setHours(0, 0, 0, 0);

        const url = `${API_BASE_URL}/api/logs/meal?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const result = await response.json();
        console.log('📡 Meal API Response:', result);

        if (result.success) {
            renderMealDistributionChart(result.data);
            renderTopFoods(result.data);
            renderMealSummary(result.data);
        } else {
            showMealLoadError();
        }
    } catch (error) {
        console.error('❌ Error loading meal data:', error);
        showMealLoadError();
    }
}

function renderMealDistributionChart(logs) {
    const canvas = document.getElementById('mealDistributionChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (mealDistributionChart) mealDistributionChart.destroy();

    // Aggregate calories per mealType
    const mealCalories = {};
    (logs || []).forEach(log => {
        const type = (log.mealType || 'other').toLowerCase();
        mealCalories[type] = (mealCalories[type] || 0) + (log.totalCalories || 0);
    });

    const types = Object.keys(mealCalories);

    if (types.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('No meal data for this period.', canvas.width / 2, canvas.height / 2);
        return;
    }

    const colorMap = {
        breakfast: '#FF9800',
        lunch: '#4CAF50',
        dinner: '#2196F3',
        snack: '#9C27B0',
        snacks: '#9C27B0',
        other: '#9E9E9E'
    };
    const colors = types.map(t => colorMap[t] || '#9E9E9E');

    mealDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: types.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
            datasets: [{
                data: types.map(t => mealCalories[t]),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: 'white'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.label}: ${context.raw} kcal`
                    }
                }
            }
        }
    });
}

function renderTopFoods(logs) {
    const container = document.getElementById('topFoodsList');
    if (!container) return;

    // Count food item frequency
    const foodFreq = {};
    (logs || []).forEach(log => {
        (log.foodItems || []).forEach(item => {
            const name = item.name || item.foodName || 'Unknown';
            foodFreq[name] = (foodFreq[name] || 0) + 1;
        });
    });

    const sorted = Object.entries(foodFreq).sort((a, b) => b[1] - a[1]).slice(0, 10);

    if (sorted.length === 0) {
        container.innerHTML = '<p class="no-data">No food data available for this period.</p>';
        return;
    }

    container.innerHTML = sorted.map(([name, count]) => `
        <div class="food-item">
            <span class="food-name">${name}</span>
            <span class="food-count">${count}x</span>
        </div>
    `).join('');
}

function renderMealSummary(logs) {
    const container = document.getElementById('mealSummary');
    if (!container) return;

    if (!logs || logs.length === 0) {
        container.innerHTML = '<p class="no-data">No meal data available for this period.</p>';
        return;
    }

    const totalCalories = logs.reduce((sum, l) => sum + (l.totalCalories || 0), 0);
    const mealTypeCounts = {};
    logs.forEach(log => {
        const type = (log.mealType || 'other').toLowerCase();
        mealTypeCounts[type] = (mealTypeCounts[type] || 0) + 1;
    });

    const typeEntries = Object.entries(mealTypeCounts).sort((a, b) => b[1] - a[1]);
    const badgeClass = { breakfast: 'meal-breakfast', lunch: 'meal-lunch', dinner: 'meal-dinner', snack: 'meal-snacks', snacks: 'meal-snacks' };

    let html = `<p><strong>Total logs:</strong> ${logs.length} &nbsp;|&nbsp; <strong>Total calories:</strong> ${totalCalories} kcal</p>`;
    html += '<div class="meal-distribution">';
    typeEntries.forEach(([type, count]) => {
        const cls = badgeClass[type] || 'meal-snacks';
        html += `<span class="meal-badge ${cls}">${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}</span>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

function showMealLoadError() {
    ['topFoodsList', 'mealSummary'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<p class="no-data">Could not load data.</p>';
    });
    const canvas = document.getElementById('mealDistributionChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('No data available.', canvas.width / 2, canvas.height / 2);
    }
}

// ========== WORKOUT FUNCTIONS ==========

async function loadWorkoutData(days = 14) {
    console.log(`🏋️ Loading workout data for last ${days} days...`);
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No authentication token found');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/logs/workout/stats?days=${days}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📡 Workout API Response:', result);

        if (result.success) {
            renderWorkoutCharts(result.data);
            updateWorkoutStats(result.data);
            renderWorkoutSummary(result.data);
            renderExerciseFrequency(result.data.exerciseFrequency);
        } else {
            console.error('❌ Failed to load workout data:', result.message);
        }
    } catch (error) {
        console.error('❌ Error loading workout data:', error);
    }
}

function renderWorkoutCharts(data) {
    if (!data || !data.daily || data.daily.length === 0) {
        showNoWorkoutData();
        return;
    }

    const dailyData = data.daily.sort((a, b) => new Date(a.date) - new Date(b.date));
    const dates = dailyData.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });

    // Workout Duration Chart
    renderDurationChart(dates, dailyData);

    // Calories Burned Chart
    renderCaloriesChart(dates, dailyData);

    // Workout Type Distribution Chart
    renderTypeDistributionChart(data.workoutTypes);

    // Weekly Average Chart
    renderWeeklyChart(data.weeklyAverages);
}

function renderDurationChart(labels, data) {
    const canvas = document.getElementById('workoutDurationChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (workoutDurationChart) workoutDurationChart.destroy();

    workoutDurationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Duration (minutes)',
                data: data.map(d => d.totalDuration || 0),
                borderColor: '#FF9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#FF9800',
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255, 152, 0, 0.9)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    callbacks: {
                        label: (context) => ` Duration: ${context.raw} min`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Minutes' }
                }
            }
        }
    });
}

function renderCaloriesChart(labels, data) {
    const canvas = document.getElementById('workoutCaloriesChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (workoutCaloriesChart) workoutCaloriesChart.destroy();

    workoutCaloriesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Calories Burned',
                data: data.map(d => d.totalCalories || 0),
                borderColor: '#F44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#F44336',
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(244, 67, 54, 0.9)',
                    callbacks: {
                        label: (context) => ` Calories: ${context.raw} kcal`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Calories' }
                }
            }
        }
    });
}

function renderTypeDistributionChart(workoutTypes) {
    const canvas = document.getElementById('workoutTypeChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (workoutTypeChart) workoutTypeChart.destroy();

    const types = Object.keys(workoutTypes || {});
    const counts = Object.values(workoutTypes || {});

    if (types.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('No workout data', canvas.width / 2, canvas.height / 2);
        return;
    }

    workoutTypeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: types.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
            datasets: [{
                data: counts,
                backgroundColor: [
                    '#FF9800', // cardio
                    '#4CAF50', // strength
                    '#2196F3', // flexibility
                    '#9C27B0'  // other
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.label}: ${context.raw} workouts`
                    }
                }
            }
        }
    });
}

function renderWeeklyChart(weeklyData) {
    const canvas = document.getElementById('weeklyWorkoutChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (weeklyWorkoutChart) weeklyWorkoutChart.destroy();

    if (!weeklyData || weeklyData.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('No weekly data', canvas.width / 2, canvas.height / 2);
        return;
    }

    weeklyWorkoutChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeklyData.map(w => `Week ${w.week}`),
            datasets: [{
                label: 'Avg Duration (min)',
                data: weeklyData.map(w => w.avgDuration || 0),
                backgroundColor: '#2196F3',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Minutes' }
                }
            }
        }
    });
}

function updateWorkoutStats(data) {
    if (!data || !data.daily || data.daily.length === 0) {
        document.getElementById('totalWorkouts').textContent = '0';
        document.getElementById('totalDuration').textContent = '0';
        document.getElementById('totalCaloriesBurned').textContent = '0';
        document.getElementById('avgWeeklyWorkouts').textContent = '0';
        return;
    }

    const totalWorkouts = data.daily.reduce((sum, d) => sum + d.workouts.length, 0);
    const totalDuration = data.daily.reduce((sum, d) => sum + (d.totalDuration || 0), 0);
    const totalCalories = data.daily.reduce((sum, d) => sum + (d.totalCalories || 0), 0);

    // Calculate weekly average
    const daysInPeriod = data.daily.length;
    const weeksInPeriod = daysInPeriod / 7;
    const avgWeekly = weeksInPeriod > 0 ? (totalWorkouts / weeksInPeriod).toFixed(1) : 0;

    document.getElementById('totalWorkouts').textContent = totalWorkouts;
    document.getElementById('totalDuration').textContent = totalDuration;
    document.getElementById('totalCaloriesBurned').textContent = totalCalories;
    document.getElementById('avgWeeklyWorkouts').textContent = avgWeekly;
}

function renderWorkoutSummary(data) {
    const summaryDiv = document.getElementById('workoutSummary');
    if (!summaryDiv) return;

    if (!data || !data.daily || data.daily.length === 0) {
        summaryDiv.innerHTML = '<p class="no-data">No workout data available for this period.</p>';
        return;
    }

    const totalWorkouts = data.daily.reduce((sum, d) => sum + d.workouts.length, 0);
    const workoutTypes = data.workoutTypes || {};
    const typeEntries = Object.entries(workoutTypes).sort((a, b) => b[1] - a[1]);

    const typeColorMap = { cardio: 'meal-breakfast', strength: 'meal-lunch', flexibility: 'meal-dinner', other: 'meal-snacks' };

    let html = `
        <p><strong>Total:</strong> ${totalWorkouts} workouts</p>
        <p><strong>Workout Breakdown:</strong></p>
        <div class="meal-distribution">
    `;

    typeEntries.forEach(([type, count]) => {
        const percentage = ((count / totalWorkouts) * 100).toFixed(1);
        const cls = typeColorMap[type] || 'meal-snacks';
        html += `<span class="meal-badge ${cls}">${type.charAt(0).toUpperCase() + type.slice(1)}: ${count} (${percentage}%)</span>`;
    });

    html += '</div>';
    summaryDiv.innerHTML = html;
}

function renderExerciseFrequency(exerciseData) {
    const exerciseDiv = document.getElementById('exerciseFrequency');
    if (!exerciseDiv) return;

    if (!exerciseData || Object.keys(exerciseData).length === 0) {
        exerciseDiv.innerHTML = '<p class="no-data">No exercise data available.</p>';
        return;
    }

    const sortedExercises = Object.entries(exerciseData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10 exercises

    let html = '';
    sortedExercises.forEach(([exercise, count]) => {
        html += `
            <div class="food-item">
                <span class="food-name">${exercise}</span>
                <span class="food-count">${count} times</span>
            </div>
        `;
    });

    exerciseDiv.innerHTML = html;
}

function showNoWorkoutData() {
    const charts = ['workoutDurationChart', 'workoutCaloriesChart', 'workoutTypeChart', 'weeklyWorkoutChart'];
    charts.forEach(chartId => {
        const canvas = document.getElementById(chartId);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('No workout data found', canvas.width / 2, canvas.height / 2);
        }
    });

    document.getElementById('totalWorkouts').textContent = '0';
    document.getElementById('totalDuration').textContent = '0';
    document.getElementById('totalCaloriesBurned').textContent = '0';
    document.getElementById('avgWeeklyWorkouts').textContent = '0';
    document.getElementById('workoutSummary').innerHTML = '<p class="no-data">No workout data available.</p>';
    document.getElementById('exerciseFrequency').innerHTML = '<p class="no-data">No exercise data available.</p>';
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', () => {
    const daysSelect = document.getElementById('days');
    const refreshBtn = document.getElementById('refreshChart');

    if (!daysSelect || !refreshBtn) {
        console.error('❌ Required elements not found!');
        return;
    }

    // Load initial data
    const initialDays = daysSelect.value;
    loadNutritionData(initialDays);
    loadMealData(initialDays);
    loadWorkoutData(initialDays);

    // Refresh button handler
    refreshBtn.addEventListener('click', () => {
        const days = daysSelect.value;
        loadNutritionData(days);
        loadMealData(days);
        loadWorkoutData(days);
    });

    // Auto-refresh when days selection changes
    daysSelect.addEventListener('change', () => {
        const days = daysSelect.value;
        loadNutritionData(days);
        loadMealData(days);
        loadWorkoutData(days);
    });
});