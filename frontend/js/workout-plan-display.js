// workout-plan-display.js

const API_BASE_URL = 'http://localhost:3000';

// Global variables
let currentWorkoutPlan = null;
let currentView = 'week';
let userProfile = {};
let currentStartDate = new Date();
currentStartDate.setHours(0, 0, 0, 0);

// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Workout Plan Display page loaded');

    // Check authentication
    if (!checkAuth()) return;

    // Load user profile
    loadUserProfile();

    // Load the workout plan
    loadWorkoutPlan(currentView);

    // Setup event listeners
    setupEventListeners();

    // Show welcome message
    showWelcomeMessage();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        showNotification('Please login to view your workout plan', 'error', 3000);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return false;
    }
    return true;
}

// Show welcome message
function showWelcomeMessage() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) {
        // showNotification(`Welcome back, ${user.name}!`, 'success', 3000);
    }
}

// Load user profile
function loadUserProfile() {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        try {
            userProfile = JSON.parse(savedProfile);
        } catch (error) {
            console.error('❌ Error loading user profile:', error);
            userProfile = { goal: 'maintain' };
        }
    } else {
        userProfile = { goal: 'maintain' };
    }
}

// Load workout plan
function loadWorkoutPlan(view = 'week') {
    currentView = view;

    // Show loading state
    showLoadingState(true);
    hideEmptyState();
    document.getElementById('tableContainer').style.display = 'none';

    // Update active button
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.period-btn:nth-child(${view === 'week' ? 1 : 2})`);
    if (activeBtn) activeBtn.classList.add('active');

    // Try localStorage first
    const savedPlan = localStorage.getItem('workoutPlanSelected');
    if (savedPlan) {
        try {
            currentWorkoutPlan = JSON.parse(savedPlan);
            if (currentWorkoutPlan.weekStart) {
                currentStartDate = new Date(currentWorkoutPlan.weekStart);
                currentStartDate.setHours(0, 0, 0, 0);
            }
            renderWorkoutPlan(view);
        } catch (error) {
            console.error('❌ Error parsing saved plan:', error);
        }
    }

    // Fetch from server
    loadPlanFromServer(view);
}

// Load plan from server
async function loadPlanFromServer(view) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/workouts/current-plan`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                currentWorkoutPlan = result.data;
                localStorage.setItem('workoutPlanSelected', JSON.stringify(currentWorkoutPlan));

                if (currentWorkoutPlan.weekStart) {
                    currentStartDate = new Date(currentWorkoutPlan.weekStart);
                    currentStartDate.setHours(0, 0, 0, 0);
                }

                renderWorkoutPlan(view);
            } else {
                showEmptyState();
            }
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('❌ Error loading plan from server:', error);
        showEmptyState();
    }
}

// Render workout plan table
function renderWorkoutPlan(view) {
    if (!currentWorkoutPlan) {
        showEmptyState();
        return;
    }

    showLoadingState(false);

    // Update text
    document.getElementById('planTitle').textContent = `${view.charAt(0).toUpperCase() + view.slice(1)}ly Workout Plan`;
    document.getElementById('tableTitle').textContent = `${view.charAt(0).toUpperCase() + view.slice(1)}ly Workout Plan`;

    const generatedDate = currentWorkoutPlan.updatedAt ? new Date(currentWorkoutPlan.updatedAt) : new Date();
    document.getElementById('planSubtitle').textContent =
        `Last updated on ${generatedDate.toLocaleDateString()} | ${userProfile.goal || 'Custom'} Goal`;

    // Calculate days
    const daysCount = view === 'month' ? 30 : 7;
    const days = [];
    const start = new Date(currentStartDate);
    for (let i = 0; i < daysCount; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
    }

    // Render Table
    const table = document.getElementById('workoutPlanTable');
    table.innerHTML = generateTableHTML(days);

    // Update Date Range display
    const end = new Date(days[days.length - 1]);
    document.getElementById('dateRange').textContent =
        `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // Update Stats
    updateStatistics();

    // Show container
    document.getElementById('tableContainer').style.display = 'block';
    updateNavButtons();
}

// Generate table HTML
function generateTableHTML(days) {
    const categories = ['warmup', 'strength', 'cardio', 'cooldown'];

    let html = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Warmup</th>
                <th>Strength</th>
                <th>Cardio</th>
                <th>Cooldown</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
    `;

    days.forEach(date => {
        const dateKey = date.toDateString();
        const shortDay = date.toLocaleDateString(undefined, { weekday: 'short' });
        const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const year = date.getFullYear();
        const isToday = date.toDateString() === new Date().toDateString();
        const dayClass = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        html += `
            <tr>
                <td class="date-cell">
                    <span class="date-main">${dateStr}</span>
                    <span class="date-sub">${year}</span>
                </td>
                <td class="day-cell ${dayClass}">
                    ${shortDay}
                    ${isToday ? '<span class="today-badge">Today</span>' : ''}
                </td>
        `;

        categories.forEach(cat => {
            const suggested = getSuggestedExercise(cat, date);
            const logged = getLoggedExercise(cat, dateKey);

            html += `
                <td class="exercise-cell">
                    ${renderExerciseCell(cat, dateKey, logged, suggested)}
                </td>
            `;
        });

        html += `
            <td class="action-cell">
                <button class="btn-log-day" onclick="logDayWorkouts('${dateKey}')" title="Log all suggested exercises for this day">
                    <i class="fas fa-check-double"></i> Log Day
                </button>
            </td>
        </tr>
        `;
    });

    html += '</tbody>';
    return html;
}

// Deterministic Exercise Selector (Matches Diet Plan logic)
function getSuggestedExercise(category, date) {
    const exercises = currentWorkoutPlan[category] || [];
    if (exercises.length === 0) return { name: 'Rest', duration: 0, calories: 0 };

    // Reference epoch for consistency
    const referenceDate = new Date(2025, 0, 1);
    const diffDays = Math.floor((date - referenceDate) / (1000 * 60 * 60 * 24));

    return exercises[Math.abs(diffDays) % exercises.length];
}

function getLoggedExercise(category, dateKey) {
    if (!currentWorkoutPlan.loggedExercises) return null;
    const dayLogs = currentWorkoutPlan.loggedExercises[dateKey] || [];
    // For simplicity in the table, we show if ANY exercise of that category was logged
    // (In reality, we cycle them. If we have 1 warmup, we log it.)
    // We'll look for an exercise in the logs that matches the category.
    // However, the backend logData stores simple objects. 
    // Let's assume we store category in the logData when logging from this UI.
    return dayLogs.find(log => log.category === category);
}

function renderExerciseCell(category, dateKey, logged, suggested) {
    const isRest = suggested.name === 'Rest';

    if (logged) {
        return `
            <div class="exercise-logged">
                <span class="ex-category-tag">${category}</span>
                <span class="ex-name">✅ ${logged.name}</span>
                <span class="ex-details">${logged.duration} min | ${logged.calories} cal</span>
                <div class="ex-actions">
                    <button class="btn-ex-action" style="background: #4CAF50; color: white;">
                        <i class="fas fa-check"></i> Done
                    </button>
                </div>
            </div>
        `;
    } else if (isRest) {
        return `<div style="color: #ccc; font-style: italic; padding: 10px;">Rest Day</div>`;
    } else {
        return `
            <div class="exercise-suggestion">
                <span class="ex-category-tag">${category}</span>
                <span class="ex-name">${suggested.name}</span>
                <span class="ex-details">${suggested.duration} min | ${suggested.calories * suggested.duration} cal</span>
                <div class="ex-actions">
                    <button class="btn-ex-action btn-log" onclick="logSingleExercise('${category}', '${dateKey}')">
                        <i class="fas fa-check"></i> Log
                    </button>
                </div>
            </div>
        `;
    }
}

// Stats Update
function updateStatistics() {
    if (!currentWorkoutPlan) return;

    const daysCount = currentView === 'month' ? 30 : 7;
    const totals = currentWorkoutPlan.totals || { calories: 0, duration: 0, exercises: 0 };

    // Calculate Logged Totals from plan.loggedExercises
    let loggedCal = 0;
    let loggedDur = 0;
    let loggedCount = 0;
    let totalPossibleExercises = 0;

    // Loop through the relevant range to count possible vs logged
    const start = new Date(currentStartDate);
    for (let i = 0; i < daysCount; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dKey = d.toDateString();

        // Possible: check each category
        ['warmup', 'strength', 'cardio', 'cooldown'].forEach(cat => {
            const suggested = getSuggestedExercise(cat, d);
            if (suggested.name !== 'Rest') totalPossibleExercises++;
        });

        const dayLogs = (currentWorkoutPlan.loggedExercises && currentWorkoutPlan.loggedExercises[dKey]) || [];
        dayLogs.forEach(log => {
            loggedCal += log.calories || 0;
            loggedDur += log.duration || 0;
            loggedCount++;
        });
    }

    const compliance = totalPossibleExercises > 0 ? (loggedCount / totalPossibleExercises) * 100 : 0;

    // Per Day averages from plan
    const avgCal = Math.round((totals.calories || 0) / 7); // Usually plan is weekly
    const avgDur = Math.round((totals.duration || 0) / 7);

    const statsHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Weekly Calories Goal</div>
                <div class="stat-value">${totals.calories || 0}</div>
                <div class="stat-unit">kcal total</div>
                <div class="progress-container">
                    <div class="progress-label">
                        <span>Logged: ${loggedCal}</span>
                        <span>${totals.calories > 0 ? Math.min((loggedCal / totals.calories) * 100, 100).toFixed(1) : 0}%</span>
                    </div>
                    <div class="progress-bar"><div class="progress-fill" style="width:${totals.calories > 0 ? (loggedCal / totals.calories) * 100 : 0}%"></div></div>
                </div>
            </div>
            <div class="stat-card" style="border-left-color: #2196F3;">
                <div class="stat-label">Weekly Duration Goal</div>
                <div class="stat-value">${totals.duration || 0}</div>
                <div class="stat-unit">minutes total</div>
                <div class="progress-container">
                    <div class="progress-label">
                        <span>Logged: ${loggedDur}</span>
                    </div>
                    <div class="progress-bar"><div class="progress-fill" style="width:${totals.duration > 0 ? (loggedDur / totals.duration) * 100 : 0}%; background:#2196F3;"></div></div>
                </div>
            </div>
            <div class="stat-card" style="border-left-color: #9C27B0;">
                <div class="stat-label">Compliance Rate</div>
                <div class="stat-value">${compliance.toFixed(1)}%</div>
                <div class="stat-unit">Exercises completed</div>
                <div class="progress-container">
                    <div class="progress-bar"><div class="progress-fill" style="width:${compliance}%; background:#9C27B0;"></div></div>
                </div>
            </div>
            <div class="stat-card" style="border-left-color: #F44336;">
                <div class="stat-label">Intensity Level</div>
                <div class="stat-value">${compliance > 80 ? 'Elite' : compliance > 50 ? 'Active' : 'Starting'}</div>
                <div class="stat-unit">Based on logs</div>
            </div>
        </div>
    `;

    document.getElementById('statsPanel').innerHTML = statsHTML;
}

// Navigation
function navigateDate(direction) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const createdAt = user.createdAt ? new Date(user.createdAt) : null;
    const offset = currentView === 'month' ? 30 : 7;

    if (direction === -1 && createdAt) {
        const potentialStart = new Date(currentStartDate);
        potentialStart.setDate(potentialStart.getDate() - offset);

        // Account creation guard (start of week)
        const getStart = (d) => {
            const x = new Date(d);
            const day = x.getDay();
            const diff = x.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(x.setDate(diff)).setHours(0, 0, 0, 0);
        };

        if (getStart(potentialStart) < getStart(createdAt)) {
            showNotification('Cannot go back before account creation', 'info');
            return;
        }
    }

    currentStartDate.setDate(currentStartDate.getDate() + (direction * offset));
    renderWorkoutPlan(currentView);
}

function updateNavButtons() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const createdAt = user.createdAt ? new Date(user.createdAt) : null;
    const prevBtn = document.querySelector('.btn-nav.prev');
    if (!prevBtn || !createdAt) return;

    const offset = currentView === 'month' ? 30 : 7;
    const potentialStart = new Date(currentStartDate);
    potentialStart.setDate(potentialStart.getDate() - offset);

    const getStart = (d) => {
        const x = new Date(d);
        const day = x.getDay();
        const diff = x.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(x.setDate(diff)).setHours(0, 0, 0, 0);
    };

    if (getStart(potentialStart) < getStart(createdAt)) {
        prevBtn.classList.add('disabled');
    } else {
        prevBtn.classList.remove('disabled');
    }
}

// Logging Logic
async function logSingleExercise(category, dateKey) {
    const suggested = getSuggestedExercise(category, new Date(dateKey));
    if (suggested.name === 'Rest') return;

    const logData = {
        category,
        name: suggested.name,
        duration: suggested.duration,
        calories: suggested.calories * suggested.duration,
        date: new Date(dateKey).toISOString().split('T')[0]
    };

    await saveLogToPlan(dateKey, logData);
}

async function logDayWorkouts(dateKey) {
    const date = new Date(dateKey);
    const logs = [];
    ['warmup', 'strength', 'cardio', 'cooldown'].forEach(cat => {
        // Check if already logged
        const existing = getLoggedExercise(cat, dateKey);
        if (existing) return; // Skip if already logged

        const suggested = getSuggestedExercise(cat, date);
        if (suggested.name !== 'Rest') {
            logs.push({
                category: cat,
                name: suggested.name,
                duration: suggested.duration,
                calories: suggested.calories * suggested.duration,
                date: date.toISOString().split('T')[0]
            });
        }
    });

    if (logs.length === 0) {
        showNotification('All exercises for this day are already logged!', 'info');
        return;
    }

    await saveLogToPlan(dateKey, logs);
}

async function saveLogToPlan(dateKey, logData) {
    const token = localStorage.getItem('token');
    showNotification('Saving log...', 'info', 1000);

    try {
        // 1. Save to WorkoutPlan.loggedExercises
        const response = await fetch(`${API_BASE_URL}/api/workouts/log-exercise`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ dateKey, logData })
        });

        if (response.ok) {
            const result = await response.json();
            currentWorkoutPlan = result.data;
            localStorage.setItem('workoutPlanSelected', JSON.stringify(currentWorkoutPlan));

            // 2. Also save to WorkoutLog collection for Analytics (Backwards compatibility & aggregation)
            const logsArray = Array.isArray(logData) ? logData : [logData];
            for (const log of logsArray) {
                // Map category to WorkoutLog enum: ['cardio', 'strength', 'flexibility', 'other']
                let mappedType = 'other';
                if (log.category === 'cardio') mappedType = 'cardio';
                else if (log.category === 'strength') mappedType = 'strength';
                else if (log.category === 'warmup' || log.category === 'cooldown') mappedType = 'flexibility';

                await fetch(`${API_BASE_URL}/api/logs/workout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        workoutType: mappedType,
                        duration: log.duration,
                        caloriesBurned: log.calories,
                        exercises: [{ name: log.name, duration: log.duration, calories: log.calories }],
                        date: log.date
                    })
                });
            }

            showNotification('✅ Workout logged successfully!', 'success');
            renderWorkoutPlan(currentView);
        } else {
            showNotification('❌ Failed to save log', 'error');
        }
    } catch (error) {
        console.error('Error logging:', error);
        showNotification('❌ Network error', 'error');
    }
}

// Modal handling for manual logs
function openLogWorkoutModal() {
    document.getElementById('logWorkoutModal').style.display = 'flex';
    document.getElementById('logDate').value = new Date().toISOString().split('T')[0];
}

function closeModal() {
    document.getElementById('logWorkoutModal').style.display = 'none';
}

async function saveExerciseLog() {
    const date = document.getElementById('logDate').value;
    const name = document.getElementById('logExerciseName').value;
    const duration = parseInt(document.getElementById('logDuration').value);
    const calories = parseInt(document.getElementById('logCalories').value);

    if (!name || isNaN(duration) || isNaN(calories)) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    const logData = {
        category: 'manual',
        name,
        duration,
        calories,
        date
    };

    const dateKey = new Date(date).toDateString();
    await saveLogToPlan(dateKey, logData);
    closeModal();
}

// Event Listeners
function setupEventListeners() {
    const search = document.getElementById('exerciseSearch');
    if (search) {
        search.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#workoutPlanTable tbody tr');
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }

    window.onclick = (e) => {
        if (e.target.classList.contains('modal-overlay')) closeModal();
    };
}

// Helpers
function showNotification(message, type = 'info', duration = 3000) {
    const container = document.body;
    const note = document.createElement('div');
    note.className = `notification notification-${type}`;
    note.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(note);
    setTimeout(() => {
        note.style.opacity = '0';
        setTimeout(() => note.remove(), 500);
    }, duration);
}

function showLoadingState(show) {
    document.getElementById('loadingState').style.display = show ? 'block' : 'none';
}

function showEmptyState() {
    showLoadingState(false);
    document.getElementById('emptyState').style.display = 'block';
}

function hideEmptyState() {
    document.getElementById('emptyState').style.display = 'none';
}

function refreshPlan() {
    loadWorkoutPlan(currentView);
}

function exportPlan() {
    if (!currentWorkoutPlan) return;
    const blob = new Blob([JSON.stringify(currentWorkoutPlan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout-plan-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function sharePlan() {
    showNotification('Sharing not implemented in this demo', 'info');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function logTodayWorkouts() {
    const today = new Date().toDateString();
    logDayWorkouts(today);
}

// Global exposure
window.loadWorkoutPlan = loadWorkoutPlan;
window.navigateDate = navigateDate;
window.logSingleExercise = logSingleExercise;
window.logDayWorkouts = logDayWorkouts;
window.logTodayWorkouts = logTodayWorkouts;
window.openLogWorkoutModal = openLogWorkoutModal;
window.closeModal = closeModal;
window.saveExerciseLog = saveExerciseLog;
window.refreshPlan = refreshPlan;
window.exportPlan = exportPlan;
window.sharePlan = sharePlan;
window.logout = logout;