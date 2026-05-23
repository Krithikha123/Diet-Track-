// Diet Plan Display and Management
const API_BASE_URL = 'http://localhost:3000';

// Global variables
let currentPlan = null;
let currentView = 'week';
let mealLogs = {};
let userProfile = {};
let allFoods = [];
let currentStartDate = new Date();
currentStartDate.setHours(0, 0, 0, 0);

// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Diet Plan Display page loaded');

    // Check authentication
    if (!checkAuth()) return;

    // Load user profile
    loadUserProfile();

    // Load meal logs
    loadMealLogs();

    // Load the diet plan
    loadDietPlan(currentView);

    // Setup event listeners
    setupEventListeners();

    // Initial navigation set
    updateNavButtons();

    // Show welcome message
    showWelcomeMessage();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        showNotification('Please login to view your diet plan', 'error', 3000);
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
            console.log('✅ User profile loaded:', userProfile);
        } catch (error) {
            console.error('❌ Error loading user profile:', error);
            userProfile = {
                dailyMeals: ['breakfast', 'lunch', 'dinner'],
                goal: 'Weight Management',
                dietTypes: []
            };
        }
    } else {
        userProfile = {
            dailyMeals: ['breakfast', 'lunch', 'dinner'],
            goal: 'Weight Management',
            dietTypes: []
        };
    }
}

// Load meal logs from localStorage
function loadMealLogs() {
    const savedLogs = localStorage.getItem('mealLogs');
    if (savedLogs) {
        try {
            mealLogs = JSON.parse(savedLogs);
            console.log('✅ Meal logs loaded:', Object.keys(mealLogs).length + ' categories');
        } catch (error) {
            console.error('❌ Error loading meal logs:', error);
            mealLogs = {
                breakfast: {},
                lunch: {},
                dinner: {},
                snacks: {}
            };
        }
    } else {
        mealLogs = {
            breakfast: {},
            lunch: {},
            dinner: {},
            snacks: {}
        };
    }
}

// Save meal logs to localStorage
function saveMealLogs() {
    localStorage.setItem('mealLogs', JSON.stringify(mealLogs));
    console.log('✅ Meal logs saved');
}

// Load diet plan
function loadDietPlan(view = 'week') {
    currentView = view;

    // Show loading state, hide other states
    showLoadingState(true);
    hideEmptyState();
    document.getElementById('tableContainer').style.display = 'none';

    // Update active button
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Set active button based on current view
    const activeBtn = document.querySelector(`.period-btn:nth-child(${view === 'week' ? 1 : 2})`);
    if (activeBtn) activeBtn.classList.add('active');

    // Load plan from localStorage
    const savedPlan = localStorage.getItem('currentDietPlan');

    if (savedPlan) {
        try {
            currentPlan = JSON.parse(savedPlan);
            console.log('✅ Diet plan loaded from localStorage:', currentPlan);

            // Merge persistent logs from the cached plan
            // Anchor to weekStart if available
            if (currentPlan.weekStart) {
                currentStartDate = new Date(currentPlan.weekStart);
                currentStartDate.setHours(0, 0, 0, 0);
            }

            // check for plan transition
            checkPlanTransition();

            renderDietPlan(view);

        } catch (error) {
            console.error('❌ Error parsing saved plan:', error);
            showEmptyState();
        }
    } else {
        // Try to load from server
        setTimeout(() => {
            loadPlanFromServer();
        }, 800);
    }
}

// Load plan from server
async function loadPlanFromServer() {
    const token = localStorage.getItem('token');

    if (!token) {
        showEmptyState();
        return;
    }

    try {
        // showNotification('Loading your latest diet plan...', 'info', 2000);

        const response = await fetch(`${API_BASE_URL}/api/diet-plans/current`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                currentPlan = result.data;
                localStorage.setItem('currentDietPlan', JSON.stringify(currentPlan));

                // Load persistent logs from the plan into the UI state
                // Anchor to weekStart if available
                if (currentPlan.weekStart) {
                    currentStartDate = new Date(currentPlan.weekStart);
                    currentStartDate.setHours(0, 0, 0, 0);
                }

                // check for plan transition
                checkPlanTransition();

                renderDietPlan(currentView);
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

// Render diet plan table
function renderDietPlan(view) {
    if (!currentPlan || !currentPlan.selectedFoods) {
        showEmptyState();
        return;
    }

    // Hide loading state
    showLoadingState(false);

    // Update title and subtitle
    document.getElementById('planTitle').textContent =
        `${view.charAt(0).toUpperCase() + view.slice(1)}ly Diet Plan`;

    const generatedDate = currentPlan.generatedAt ? new Date(currentPlan.generatedAt) : new Date();
    document.getElementById('planSubtitle').textContent =
        `Generated on ${generatedDate.toLocaleDateString()} | ${currentPlan.type || 'Custom'} Plan`;

    // Update table title
    document.getElementById('tableTitle').textContent =
        `${view.charAt(0).toUpperCase() + view.slice(1)}ly Diet Plan`;

    // Generate table rows based on view
    const days = getDaysForView(view);
    const tableHTML = generateTableHTML(days);

    // Update table
    document.getElementById('dietPlanTable').innerHTML = tableHTML;

    // Update date range
    updateDateRange(days);

    // Update statistics
    updateStatistics();

    // Show the table container
    document.getElementById('tableContainer').style.display = 'block';

    // Setup search functionality
    setupSearch();

    // Update navigation orientation
    updateNavButtons();

    // Show success message
    const totalItems = countSelectedFoods();
    // showNotification(`✅ ${view.charAt(0).toUpperCase() + view.slice(1)}ly plan loaded with ${totalItems} food items`, 'success', 3000);
}

// Count total selected foods
function countSelectedFoods() {
    if (!currentPlan || !currentPlan.selectedFoods) return 0;

    return Object.values(currentPlan.selectedFoods).reduce((total, foods) => total + foods.length, 0);
}

// Get number of days for view
function getDaysForView(view) {
    switch (view) {
        case 'month':
            return 30;

        default:
            return 7;
    }
}

// Generate table HTML
function generateTableHTML(days) {
    if (!currentPlan || !currentPlan.selectedFoods) return '';

    const selectedFoods = currentPlan.selectedFoods;
    const dailyMeals = userProfile.dailyMeals || ['breakfast', 'lunch', 'dinner'];

    // Create cyclers for each meal
    const breakfastCycler = createFoodCycler(selectedFoods.breakfast || []);
    const lunchCycler = createFoodCycler(selectedFoods.lunch || []);
    const dinnerCycler = createFoodCycler(selectedFoods.dinner || []);
    const snacksCycler = createFoodCycler(selectedFoods.snacks || []);

    // Generate header
    let tableHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Day</th>
                ${dailyMeals.includes('breakfast') ? '<th>Breakfast</th>' : ''}
                ${dailyMeals.includes('lunch') ? '<th>Lunch</th>' : ''}
                ${dailyMeals.includes('dinner') ? '<th>Dinner</th>' : ''}
                ${dailyMeals.includes('snacks') ? '<th>Snacks</th>' : ''}
                <th>Log Day</th>
            </tr>
        </thead>
        <tbody>
    `;

    // Generate rows
    const startDate = new Date(currentStartDate);

    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        const dateKey = date.toDateString();
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const shortDay = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const year = date.getFullYear();

        const isToday = date.toDateString() === new Date().toDateString();
        const dayClass = dayName.toLowerCase();

        tableHTML += `
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

        // Breakfast cell
        if (dailyMeals.includes('breakfast')) {
            const loggedFood = mealLogs.breakfast && mealLogs.breakfast[dateKey];
            const suggestedFood = breakfastCycler();

            tableHTML += `
                <td class="meal-cell">
                    ${renderMealCell('breakfast', dateKey, loggedFood, suggestedFood)}
                </td>
            `;
        }

        // Lunch cell
        if (dailyMeals.includes('lunch')) {
            const loggedFood = mealLogs.lunch && mealLogs.lunch[dateKey];
            const suggestedFood = lunchCycler();

            tableHTML += `
                <td class="meal-cell">
                    ${renderMealCell('lunch', dateKey, loggedFood, suggestedFood)}
                </td>
            `;
        }

        // Dinner cell
        if (dailyMeals.includes('dinner')) {
            const loggedFood = mealLogs.dinner && mealLogs.dinner[dateKey];
            const suggestedFood = dinnerCycler();

            tableHTML += `
                <td class="meal-cell">
                    ${renderMealCell('dinner', dateKey, loggedFood, suggestedFood)}
                </td>
            `;
        }

        // Snacks cell
        if (dailyMeals.includes('snacks')) {
            const loggedFood = mealLogs.snacks && mealLogs.snacks[dateKey];
            const suggestedFood = snacksCycler();

            tableHTML += `
                <td class="meal-cell">
                    ${renderMealCell('snacks', dateKey, loggedFood, suggestedFood)}
                </td>
            `;
        }

        tableHTML += `
            <td class="action-cell">
                <button class="btn-log-day" onclick="logDayMeals('${dateKey}')" title="Log all suggested meals for this day">
                    <i class="fas fa-check-double"></i> Log Day
                </button>
            </td>
        `;

        tableHTML += `</tr>`;
    }

    tableHTML += '</tbody>';
    return tableHTML;
}

// Create food cycler
function createFoodCycler(foods) {
    let index = 0;
    return function () {
        if (!foods || foods.length === 0) {
            return {
                name: 'No food selected',
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0,
                servingSize: 'N/A'
            };
        }
        const food = foods[index];
        index = (index + 1) % foods.length;
        return food;
    };
}

// Render meal cell
function renderMealCell(mealType, dateKey, loggedFood, suggestedFood) {
    if (loggedFood) {
        return `
            <div class="meal-logged">
                <span class="food-name">✅ ${loggedFood.name}</span>
                <span class="food-details">
                    ${loggedFood.calories} kcal
                    ${loggedFood.protein ? ` | P: ${loggedFood.protein}g` : ''}
                    ${loggedFood.carbs ? ` | C: ${loggedFood.carbs}g` : ''}
                    ${loggedFood.fats ? ` | F: ${loggedFood.fats}g` : ''}
                </span>
                <div class="meal-actions">
                    <button class="btn-meal-action" style="background: #4CAF50; color: white;" onclick="editFoodLog('${mealType}', '${dateKey}')">
                        <i class="fas fa-check"></i> Logged
                    </button>
                </div>
            </div>
        `;
    } else {
        const foodJson = JSON.stringify({
            name: suggestedFood.name,
            calories: suggestedFood.calories,
            protein: suggestedFood.protein,
            carbs: suggestedFood.carbs,
            fats: suggestedFood.fats,
            servingSize: suggestedFood.servingSize || suggestedFood.serving || '1 serving'
        }).replace(/"/g, '&quot;');

        return `
            <div class="meal-suggestion">
                <span class="food-name">${suggestedFood.name}</span>
                <span class="food-details">
                    ${suggestedFood.calories} kcal
                    ${suggestedFood.protein ? ` | P: ${suggestedFood.protein}g` : ''}
                    ${suggestedFood.carbs ? ` | C: ${suggestedFood.carbs}g` : ''}
                    ${suggestedFood.fats ? ` | F: ${suggestedFood.fats}g` : ''}
                </span>
                <div class="meal-actions">
                    <button class="btn-meal-action btn-log" onclick="logMeal('${mealType}', '${dateKey}', '${foodJson}')">
                        <i class="fas fa-check"></i> Log as Eaten
                    </button>
                    <button class="btn-meal-action btn-view" onclick="viewFoodDetails('${suggestedFood._id || ''}', '${suggestedFood.name}')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        `;
    }
}

// Update date range display
function updateDateRange(days) {
    const startDate = new Date(currentStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days - 1);

    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    document.getElementById('dateRange').textContent = `${startStr} - ${endStr}`;
}

// Update statistics panel
function updateStatistics() {
    if (!currentPlan) return;

    // Calculate totals from plan
    const planTotals = currentPlan.totals || calculatePlanTotals();

    // Calculate logged totals
    const loggedTotals = calculateLoggedTotals();

    // Calculate compliance
    const totalDays = getDaysForView(currentView);
    const loggedMeals = Object.values(mealLogs).reduce((total, category) => {
        return total + Object.keys(category).length;
    }, 0);
    const totalPossibleMeals = totalDays * (userProfile.dailyMeals?.length || 3);
    const complianceRate = totalPossibleMeals > 0 ? (loggedMeals / totalPossibleMeals) * 100 : 0;

    // Calculate daily averages
    const daysWithData = Math.max(1, totalDays);
    const avgPlanCalories = Math.round(planTotals.calories / daysWithData);
    const avgPlanProtein = (planTotals.protein / daysWithData).toFixed(1);
    const avgPlanCarbs = (planTotals.carbs / daysWithData).toFixed(1);
    const avgPlanFats = (planTotals.fats / daysWithData).toFixed(1);

    // Calculate logged percentages
    const caloriesPercent = planTotals.calories > 0 ? Math.min((loggedTotals.calories / planTotals.calories) * 100, 100) : 0;
    const proteinPercent = planTotals.protein > 0 ? Math.min((loggedTotals.protein / planTotals.protein) * 100, 100) : 0;

    // Generate stats HTML
    const statsHTML = `
        <div class="stats-header">
            <h2><i class="fas fa-chart-bar"></i> Plan Statistics</h2>
            <span style="color: #666; font-size: 14px;">Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Daily Calories Target</div>
                    <div class="stat-value">${avgPlanCalories}</div>
                    <div class="stat-unit">kcal/day</div>
                    <div class="progress-container">
                        <div class="progress-label">
                            <span>Logged: ${loggedTotals.calories}</span>
                            <span>${caloriesPercent.toFixed(1)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${caloriesPercent}%"></div>
                        </div>
                    </div>
                </div>

                <div class="stat-card protein">
                    <div class="stat-label">Daily Protein Target</div>
                    <div class="stat-value">${avgPlanProtein}</div>
                    <div class="stat-unit">grams/day</div>
                    <div class="progress-container">
                        <div class="progress-label">
                            <span>Logged: ${loggedTotals.protein.toFixed(1)}</span>
                            <span>${proteinPercent.toFixed(1)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill protein" style="width: ${proteinPercent}%"></div>
                        </div>
                    </div>
                </div>

                <div class="stat-card carbs">
                    <div class="stat-label">Daily Carbs Target</div>
                    <div class="stat-value">${avgPlanCarbs}</div>
                    <div class="stat-unit">grams/day</div>
                    <div class="progress-container">
                        <div class="progress-label">
                            <span>Logged: ${loggedTotals.carbs.toFixed(1)}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill carbs" style="width: ${planTotals.carbs > 0 ? Math.min((loggedTotals.carbs / planTotals.carbs) * 100, 100) : 0}%"></div>
                        </div>
                    </div>
                </div>

                <div class="stat-card fats">
                    <div class="stat-label">Daily Fats Target</div>
                    <div class="stat-value">${avgPlanFats}</div>
                    <div class="stat-unit">grams/day</div>
                </div>

                <div class="stat-card compliance">
                    <div class="stat-label">Meal Compliance Rate</div>
                    <div class="stat-value">${complianceRate.toFixed(1)}%</div>
                    <div class="stat-unit">of meals logged</div>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill compliance" style="width: ${complianceRate}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.getElementById('statsPanel').innerHTML = statsHTML;
}

// Calculate plan totals
function calculatePlanTotals() {
    if (!currentPlan || !currentPlan.selectedFoods) {
        return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    }

    let totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    const selectedFoods = currentPlan.selectedFoods;

    Object.values(selectedFoods).forEach(categoryFoods => {
        categoryFoods.forEach(food => {
            totals.calories += food.calories || 0;
            totals.protein += food.protein || 0;
            totals.carbs += food.carbs || 0;
            totals.fats += food.fats || 0;
        });
    });

    return totals;
}

// Calculate logged totals
function calculateLoggedTotals() {
    let totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };

    Object.values(mealLogs).forEach(category => {
        Object.values(category).forEach(log => {
            totals.calories += log.calories || 0;
            totals.protein += log.protein || 0;
            totals.carbs += log.carbs || 0;
            totals.fats += log.fats || 0;
        });
    });

    return totals;
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('foodSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            filterTable(e.target.value);
        });
    }

    // Close modal on ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Click outside modal to close
    document.addEventListener('click', function (e) {
        const modal = document.getElementById('logFoodModal');
        if (modal && modal.style.display === 'flex' && e.target === modal) {
            closeModal();
        }
    });
}

function navigateDate(direction) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const createdAt = user.createdAt ? new Date(user.createdAt) : null;

    // Normalize to start of week (Monday)
    function getStartOfWeek(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    }

    if (direction === -1 && createdAt) {
        const nextStartDate = new Date(currentStartDate);
        const offset = currentView === 'month' ? 30 : 7;
        nextStartDate.setDate(nextStartDate.getDate() - offset);

        const createdWeekStart = getStartOfWeek(createdAt);
        const nextWeekStart = getStartOfWeek(nextStartDate);

        if (nextWeekStart < createdWeekStart) {
            showNotification('You cannot go back before your account was created', 'info', 3000);
            return;
        }
    }

    const offset = currentView === 'month' ? 30 : 7;
    currentStartDate.setDate(currentStartDate.getDate() + (direction * offset));
    renderDietPlan(currentView);

    // Update navigation button states
    updateNavButtons();
}

function updateNavButtons() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const createdAt = user.createdAt ? new Date(user.createdAt) : null;

    if (!createdAt) return;

    const prevBtn = document.querySelector('.nav-btn.prev');
    if (prevBtn) {
        function getStartOfWeek(d) {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(date.setDate(diff));
        }

        const currentWeekStart = getStartOfWeek(currentStartDate);
        const createdWeekStart = getStartOfWeek(createdAt);

        const offset = currentView === 'month' ? 30 : 7;
        const potentialPrevStart = new Date(currentStartDate);
        potentialPrevStart.setDate(potentialPrevStart.getDate() - offset);
        const potentialPrevWeekStart = getStartOfWeek(potentialPrevStart);

        if (potentialPrevWeekStart < createdWeekStart) {
            prevBtn.classList.add('disabled');
            prevBtn.style.opacity = '0.5';
            prevBtn.style.cursor = 'not-allowed';
            prevBtn.title = 'Reached account creation week';
        } else {
            prevBtn.classList.remove('disabled');
            prevBtn.style.opacity = '1';
            prevBtn.style.cursor = 'pointer';
            prevBtn.title = 'Previous';
        }
    }
}

async function logDayMeals(dateKey) {
    if (!currentPlan || !currentPlan.selectedFoods) return;

    const dailyMeals = userProfile.dailyMeals || ['breakfast', 'lunch', 'dinner', 'snacks'];
    const selectedFoods = currentPlan.selectedFoods;

    // We need to re-find the suggested foods for this specific date
    // This is a bit tricky because the cycler is stateful in generateTableHTML
    // Let's implement a deterministic food selector based on date

    function getSuggestedFoodForDate(category, date) {
        const foods = selectedFoods[category] || [];
        if (foods.length === 0) return null;

        // Use date-based indexing (e.g. days since a reference epoch)
        const referenceDate = new Date(2024, 0, 1); // fixed reference
        const diffTime = Math.abs(date - referenceDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return foods[diffDays % foods.length];
    }

    const date = new Date(dateKey);
    const logsToSave = [];

    dailyMeals.forEach(mealType => {
        // Only log if not already logged
        if (!mealLogs[mealType] || !mealLogs[mealType][dateKey]) {
            const food = getSuggestedFoodForDate(mealType, date);
            if (food && food.name !== 'No food selected') {
                logsToSave.push({
                    mealType,
                    foodData: {
                        name: food.name,
                        calories: food.calories,
                        protein: food.protein || 0,
                        carbs: food.carbs || 0,
                        fats: food.fats || 0,
                        quantity: 1,
                        date: date.toISOString().split('T')[0]
                    }
                });
            }
        }
    });

    if (logsToSave.length === 0) {
        showNotification('All meals for this day are already logged or no suggestions available', 'info');
        return;
    }

    showNotification(`Logging ${logsToSave.length} meals...`, 'info', 2000);

    const token = localStorage.getItem('token');
    let successCount = 0;

    for (const log of logsToSave) {
        try {
            // Aggregate totals for the single food item being logged via "Log Day"
            const payload = {
                mealType: log.mealType,
                foodItems: [log.foodData],
                totalCalories: log.foodData.calories,
                totalProtein: log.foodData.protein,
                totalCarbs: log.foodData.carbs,
                totalFats: log.foodData.fats,
                date: log.foodData.date // YYYY-MM-DD
            };

            const response = await fetch(`${API_BASE_URL}/api/logs/meal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Update local mealLogs
                if (!mealLogs[log.mealType]) mealLogs[log.mealType] = {};
                mealLogs[log.mealType][dateKey] = {
                    name: log.foodData.name,
                    calories: log.foodData.calories,
                    protein: log.foodData.protein,
                    carbs: log.foodData.carbs,
                    fats: log.foodData.fats,
                    loggedAt: new Date().toISOString()
                };
                successCount++;
            }
        } catch (error) {
            console.error('Error logging meal bulk:', error);
        }
    }

    if (successCount > 0) {
        localStorage.setItem('mealLogs', JSON.stringify(mealLogs));
        renderDietPlan(currentView);
        showNotification(`✅ Successfully logged ${successCount} meals for the day!`, 'success', 3000);
    } else {
        showNotification('❌ Failed to log meals', 'error', 3000);
    }
}

window.logDayMeals = logDayMeals;
window.navigateDate = navigateDate;

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('foodSearch');
    if (searchInput) {
        searchInput.value = ''; // Clear previous search
        searchInput.addEventListener('input', function (e) {
            filterTable(e.target.value);
        });
    }
}

// Filter table by search term
function filterTable(searchTerm) {
    const rows = document.querySelectorAll('#dietPlanTable tbody tr');

    if (!searchTerm.trim()) {
        // Show all rows if search is empty
        rows.forEach(row => {
            row.style.display = '';
        });
        return;
    }

    const searchLower = searchTerm.toLowerCase();
    let visibleCount = 0;

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let found = false;

        cells.forEach(cell => {
            if (cell.textContent.toLowerCase().includes(searchLower)) {
                found = true;
            }
        });

        if (found) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // Show message if no results
    if (visibleCount === 0) {
        showNotification(`No results found for "${searchTerm}"`, 'warning', 2000);
    }
}

// Show loading state
function showLoadingState(show) {
    document.getElementById('loadingState').style.display = show ? 'block' : 'none';
}

// Show empty state
function showEmptyState() {
    showLoadingState(false);
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('tableContainer').style.display = 'none';
    document.getElementById('statsPanel').style.display = 'none';

    showNotification('No diet plan found. Create one first!', 'warning', 4000);
}

// Hide empty state
function hideEmptyState() {
    document.getElementById('emptyState').style.display = 'none';
}

// ========== MEAL LOGGING FUNCTIONS ==========

// Open log food modal
function openLogFoodModal(mealType = '', dateKey = '') {
    const modal = document.getElementById('logFoodModal');
    modal.style.display = 'flex';

    // Set default values
    const dateInput = document.getElementById('logDate');
    const mealSelect = document.getElementById('logMealType');

    if (dateKey) {
        const date = new Date(dateKey);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    } else {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    }

    if (mealType) {
        mealSelect.value = mealType;
    } else {
        mealSelect.value = '';
    }

    // Clear other fields
    document.getElementById('logFoodName').value = '';
    document.getElementById('logCalories').value = '';
    document.getElementById('logProtein').value = '';
    document.getElementById('logCarbs').value = '';
    document.getElementById('logFats').value = '';
    document.getElementById('logServing').value = '';

    // Focus on food name input
    setTimeout(() => {
        document.getElementById('logFoodName').focus();
    }, 100);
}

// Close modal
function closeModal() {
    const modal = document.getElementById('logFoodModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Log meal
function logMeal(mealType, dateKey, foodDataStr) {
    openLogFoodModal(mealType, dateKey);

    let suggestedFood = null;
    if (foodDataStr) {
        try {
            suggestedFood = JSON.parse(foodDataStr);
        } catch (e) {
            console.error("Error parsing food data", e);
        }
    }
    
    // Fallback to getSuggestedFood if no data provided
    if (!suggestedFood) {
        suggestedFood = getSuggestedFood(mealType, dateKey);
    }

    if (suggestedFood && suggestedFood.name !== 'No food selected') {
        document.getElementById('logFoodName').value = suggestedFood.name || '';
        document.getElementById('logCalories').value = suggestedFood.calories || '';
        document.getElementById('logProtein').value = suggestedFood.protein || '';
        document.getElementById('logCarbs').value = suggestedFood.carbs || '';
        document.getElementById('logFats').value = suggestedFood.fats || '';
        document.getElementById('logServing').value = suggestedFood.servingSize || '1 serving';
    }
}

// Log all meals for a day
function logAllMeals(dateKey) {
    openLogFoodModal('', dateKey);
    // showNotification(`Logging all meals for ${new Date(dateKey).toLocaleDateString()}`, 'info', 2000);
}

// Edit food log
function editFoodLog(mealType, dateKey) {
    openLogFoodModal(mealType, dateKey);

    // Fill with existing data
    const loggedFood = mealLogs[mealType] && mealLogs[mealType][dateKey];
    if (loggedFood) {
        document.getElementById('logFoodName').value = loggedFood.name || '';
        document.getElementById('logCalories').value = loggedFood.calories || '';
        document.getElementById('logProtein').value = loggedFood.protein || '';
        document.getElementById('logCarbs').value = loggedFood.carbs || '';
        document.getElementById('logFats').value = loggedFood.fats || '';
        document.getElementById('logServing').value = loggedFood.serving || '';
    }
}

// Remove food log
function removeFoodLog(mealType, dateKey) {
    if (confirm('Are you sure you want to remove this food log?')) {
        if (mealLogs[mealType] && mealLogs[mealType][dateKey]) {
            const foodName = mealLogs[mealType][dateKey].name;
            delete mealLogs[mealType][dateKey];
            saveMealLogs();
            renderDietPlan(currentView);
            showNotification(`Removed "${foodName}" from ${mealType} `, 'success', 3000);
        }
    }
}

// Get suggested food for a meal
function getSuggestedFood(mealType, dateKey) {
    if (!currentPlan || !currentPlan.selectedFoods) {
        return { name: 'No food selected', calories: 0 };
    }

    const foods = currentPlan.selectedFoods[mealType] || [];
    if (foods.length === 0) {
        return {
            name: 'No food selected',
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            servingSize: 'N/A'
        };
    }

    // Calculate which food to show based on date
    const date = new Date(dateKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((date - today) / (1000 * 60 * 60 * 24));

    if (daysDiff >= 0 && daysDiff < foods.length) {
        return foods[daysDiff];
    } else {
        return foods[0];
    }
}

// Save food log
function saveFoodLog() {
    const date = document.getElementById('logDate').value;
    const mealType = document.getElementById('logMealType').value;
    const foodName = document.getElementById('logFoodName').value;
    const calories = parseFloat(document.getElementById('logCalories').value) || 0;
    const protein = parseFloat(document.getElementById('logProtein').value) || 0;
    const carbs = parseFloat(document.getElementById('logCarbs').value) || 0;
    const fats = parseFloat(document.getElementById('logFats').value) || 0;
    const serving = document.getElementById('logServing').value;

    // Validation
    if (!mealType) {
        showNotification('Please select a meal type', 'error', 3000);
        document.getElementById('logMealType').focus();
        return;
    }

    if (!foodName.trim()) {
        showNotification('Please enter a food name', 'error', 3000);
        document.getElementById('logFoodName').focus();
        return;
    }

    if (calories <= 0) {
        showNotification('Please enter valid calories', 'error', 3000);
        document.getElementById('logCalories').focus();
        return;
    }

    // Use robust date parsing to avoid timezone issues
    const [yearVal, monthVal, dayVal] = date.split('-').map(Number);
    const dateObj = new Date();
    dateObj.setFullYear(yearVal, monthVal - 1, dayVal);
    dateObj.setHours(0, 0, 0, 0);
    const dateKey = dateObj.toDateString();

    // Save to meal logs
    if (!mealLogs[mealType]) {
        mealLogs[mealType] = {};
    }

    mealLogs[mealType][dateKey] = {
        name: foodName,
        calories: calories,
        protein: protein,
        carbs: carbs,
        fats: fats,
        serving: serving,
        loggedAt: new Date().toISOString(),
        loggedBy: JSON.parse(localStorage.getItem('user') || '{}').name || 'User'
    };

    // Save to localStorage
    saveMealLogs();

    // Save to server if available
    saveLogToServer(mealLogs[mealType][dateKey], mealType, dateKey);

    // Close modal
    closeModal();

    // Refresh the display
    renderDietPlan(currentView);

    // showNotification(`✅ ${mealType} logged for ${dateObj.toLocaleDateString()}!`, 'success', 3000);
}

// Save log to server
async function saveLogToServer(logData, mealType, dateKey) {
    const token = localStorage.getItem('token');

    if (!token) return;

    try {
        // Construct payload to match Backend DietPlan log-meal route
        const payload = {
            mealType: mealType,
            dateKey: dateKey,
            logData: logData
        };

        const response = await fetch(`${API_BASE_URL}/api/diet-plans/log-meal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('✅ Meal log synced with DietPlan model');

            // Also save to separate MealLog for analytics (backward compatibility)
            const backupPayload = {
                mealType: mealType,
                foodItems: [{
                    name: logData.name,
                    quantity: 1,
                    calories: logData.calories,
                    protein: logData.protein || 0,
                    carbs: logData.carbs || 0,
                    fats: logData.fats || 0
                }],
                totalCalories: logData.calories,
                totalProtein: logData.protein || 0,
                totalCarbs: logData.carbs || 0,
                totalFats: logData.fats || 0,
                date: new Date(dateKey).toISOString()
            };

            fetch(`${API_BASE_URL}/api/logs/meal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(backupPayload)
            });

        } else {
            const errorData = await response.json();
            console.error('❌ Failed to sync meal log with DietPlan:', errorData.message);
        }
    } catch (error) {
        console.error('❌ Error saving meal log to server:', error);
    }
}

// View food details
function viewFoodDetails(foodId, foodName) {
    if (!foodId || foodId === '') {
        showNotification(`Viewing details for "${foodName}"`, 'info', 2000);
        return;
    }

    // For now, just show a message
    showNotification(`Details for "${foodName}" coming soon!`, 'info', 3000);

    // In a real app, you would:
    // 1. Fetch food details from server
    // 2. Show a modal with detailed nutrition info
    // 3. Show preparation instructions, etc.
}

// ========== ACTION FUNCTIONS ==========

// Print plan


// Export plan
function exportPlan() {
    if (!currentPlan) {
        showNotification('No plan to export', 'warning', 3000);
        return;
    }

    // Create export data
    const exportData = {
        plan: currentPlan,
        mealLogs: mealLogs,
        userProfile: userProfile,
        exportedAt: new Date().toISOString()
    };

    // Convert to JSON string
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    // Create download link
    const exportFileDefaultName = `diet-plan-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);

    // Trigger download
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);

    showNotification('✅ Plan exported successfully!', 'success', 3000);
}

// Share plan
function sharePlan() {
    if (!currentPlan) {
        showNotification('No plan to share', 'warning', 3000);
        return;
    }

    if (navigator.share) {
        const totalItems = countSelectedFoods();
        navigator.share({
            title: 'My Diet Plan',
            text: `Check out my diet plan with ${totalItems} food items! Generated with DietTrack.`,
            url: window.location.href,
        }).then(() => {
            showNotification('✅ Plan shared successfully!', 'success', 3000);
        }).catch((error) => {
            console.error('❌ Error sharing:', error);
            showNotification('Failed to share plan', 'error', 3000);
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        const shareText = `My Diet Plan - ${countSelectedFoods()} food items`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                showNotification('✅ Plan link copied to clipboard!', 'success', 3000);
            });
        } else {
            showNotification('Share feature not supported in this browser', 'info', 3000);
        }
    }
}

// Refresh plan
function refreshPlan() {
    showNotification('Refreshing plan...', 'info', 1500);
    loadDietPlan(currentView);
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showNotification('Logged out successfully', 'success', 2000);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
}

// Show notification
function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });

    // Create notification element
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification notification - ${type} `;

    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';

    notificationDiv.innerHTML = `
            < i class="fas fa-${icon}" ></i >
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:white; cursor:pointer; margin-left:auto;">
            <i class="fas fa-times"></i>
        </button>
        `;

    // Add to body
    document.body.appendChild(notificationDiv);

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notificationDiv.parentNode) {
                notificationDiv.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notificationDiv.parentNode) {
                        notificationDiv.remove();
                    }
                }, 300);
            }
        }, duration);
    }
}

// ========== UTILITY FUNCTIONS ==========

// Calculate daily nutrition goals based on user profile
function calculateDailyGoals() {
    const weight = parseFloat(userProfile.weight) || 70; // Default 70kg
    const height = parseFloat(userProfile.height) || 170; // Default 170cm
    const age = parseInt(userProfile.age) || 30; // Default 30
    const goal = userProfile.goal || 'weight_maintenance';

    // BMR Calculation (Mifflin-St Jeor Equation)
    let bmr = 10 * weight + 6.25 * height - 5 * age + 5; // Male
    if (userProfile.gender === 'female') {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multiplier (default sedentary)
    let activityMultiplier = 1.2;
    if (userProfile.activityLevel === 'lightly_active') activityMultiplier = 1.375;
    if (userProfile.activityLevel === 'moderately_active') activityMultiplier = 1.55;
    if (userProfile.activityLevel === 'very_active') activityMultiplier = 1.725;
    if (userProfile.activityLevel === 'extra_active') activityMultiplier = 1.9;

    // TDEE (Total Daily Energy Expenditure)
    let tdee = bmr * activityMultiplier;

    // Adjust based on goal
    if (goal === 'weight_loss') tdee *= 0.8; // 20% deficit
    if (goal === 'weight_gain') tdee *= 1.2; // 20% surplus

    // Macronutrient distribution (40% carbs, 30% protein, 30% fat for balanced diet)
    const proteinGrams = Math.round((tdee * 0.3) / 4); // 4 cal/g protein
    const carbGrams = Math.round((tdee * 0.4) / 4); // 4 cal/g carbs
    const fatGrams = Math.round((tdee * 0.3) / 9); // 9 cal/g fat

    return {
        calories: Math.round(tdee),
        protein: proteinGrams,
        carbs: carbGrams,
        fats: fatGrams
    };
}

// Get meal suggestions based on time of day
function getMealSuggestions() {
    const hour = new Date().getHours();
    let mealType = '';

    if (hour >= 6 && hour < 11) mealType = 'breakfast';
    else if (hour >= 11 && hour < 16) mealType = 'lunch';
    else if (hour >= 16 && hour < 21) mealType = 'dinner';
    else mealType = 'snacks';

    return {
        currentMeal: mealType,
        suggestion: `It's ${mealType} time! Consider logging your meal.`
    };
}

// Load sample data for demonstration
function loadSampleData() {
    if (!currentPlan) {
        const samplePlan = {
            generatedAt: new Date().toISOString(),
            type: 'custom',
            selectedFoods: {
                breakfast: [
                    {
                        _id: '1',
                        name: 'Oatmeal with Berries',
                        calories: 250,
                        protein: 8,
                        carbs: 45,
                        fats: 5,
                        servingSize: '1 bowl'
                    },
                    {
                        _id: '2',
                        name: 'Greek Yogurt with Honey',
                        calories: 180,
                        protein: 15,
                        carbs: 20,
                        fats: 4,
                        servingSize: '1 cup'
                    }
                ],
                lunch: [
                    {
                        _id: '3',
                        name: 'Grilled Chicken Salad',
                        calories: 350,
                        protein: 30,
                        carbs: 15,
                        fats: 12,
                        servingSize: '1 plate'
                    }
                ],
                dinner: [
                    {
                        _id: '4',
                        name: 'Salmon with Vegetables',
                        calories: 400,
                        protein: 35,
                        carbs: 20,
                        fats: 18,
                        servingSize: '1 plate'
                    }
                ],
                snacks: [
                    {
                        _id: '5',
                        name: 'Mixed Nuts',
                        calories: 200,
                        protein: 6,
                        carbs: 8,
                        fats: 16,
                        servingSize: '1 handful'
                    }
                ]
            },
            totals: {
                calories: 1380,
                protein: 94,
                carbs: 108,
                fats: 55
            },
            profile: userProfile
        };

        currentPlan = samplePlan;
        localStorage.setItem('currentDietPlan', JSON.stringify(samplePlan));
        showNotification('✅ Sample diet plan loaded for demonstration', 'success', 4000);
        renderDietPlan(currentView);
    }
}

// Check if enough time has passed since the plan started based on view
function checkPlanTransition() {
    if (!currentPlan || !currentPlan.weekStart) return;

    const weekStart = new Date(currentPlan.weekStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today - weekStart;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Threshold based on view
    const threshold = currentView === 'month' ? 30 : 7;

    if (diffDays >= threshold) {
        showTransitionModal();
    }
}

// Show modal asking to create a new plan or reuse the previous one
function showTransitionModal() {
    // Remove existing modal if any
    const existing = document.getElementById('transitionModal');
    if (existing) existing.remove();

    const isMonth = currentView === 'month';
    const periodName = isMonth ? 'Month' : 'Week';

    const modalHTML = `
        <div id="transitionModal" class="modal-overlay" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; justify-content: center; align-items: center;">
            <div class="modal-content" style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                <h2 style="margin-bottom: 1rem; color: #2c3e50;">📅 New ${periodName} is Here!</h2>
                <p style="margin-bottom: 1.5rem; color: #666; line-height: 1.6;">
                    A ${periodName.toLowerCase()} has passed since your last diet plan was set. Would you like to create a new plan for the upcoming ${periodName.toLowerCase()} or continue using your previous plan?
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button id="btnNewPlan" style="padding: 0.8rem 1.5rem; border: none; border-radius: 6px; background: #2196F3; color: white; cursor: pointer; font-weight: bold;">
                        <i class="fas fa-plus"></i> Create New Plan
                    </button>
                    <button id="btnReusePlan" style="padding: 0.8rem 1.5rem; border: 2px solid #2196F3; border-radius: 6px; background: transparent; color: #2196F3; cursor: pointer; font-weight: bold;">
                        <i class="fas fa-redo"></i> Use Previous Plan
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Event listeners
    document.getElementById('btnNewPlan').addEventListener('click', () => {
        window.location.href = 'diet-plan.html';
    });

    document.getElementById('btnReusePlan').addEventListener('click', async () => {
        await updatePlanWeek();
    });
}

// Call API to update the plan's weekStart to today
async function updatePlanWeek() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/api/diet-plans/update-week`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                showNotification('✅ Plan updated for the new week!', 'success', 3000);
                document.getElementById('transitionModal').remove();

                // Refresh local state and render
                currentPlan.weekStart = result.data.weekStart;
                localStorage.setItem('currentDietPlan', JSON.stringify(currentPlan));
                currentStartDate = new Date(currentPlan.weekStart);
                renderDietPlan(currentView);
            }
        } else {
            showNotification('❌ Failed to update plan week', 'error', 3000);
        }
    } catch (error) {
        console.error('Error updating week:', error);
        showNotification('❌ Network error', 'error', 3000);
    }
}

// Toggle sample data (for testing)
function toggleSampleData() {
    if (!currentPlan) {
        loadSampleData();
    } else {
        currentPlan = null;
        localStorage.removeItem('currentDietPlan');
        showEmptyState();
        showNotification('✅ Sample data removed', 'success', 3000);
    }
}

// Make functions globally available
window.loadDietPlan = loadDietPlan;
window.openLogFoodModal = openLogFoodModal;
window.closeModal = closeModal;
window.logMeal = logMeal;
window.logAllMeals = logAllMeals;
window.editFoodLog = editFoodLog;
window.removeFoodLog = removeFoodLog;
window.saveFoodLog = saveFoodLog;
window.viewFoodDetails = viewFoodDetails;

window.exportPlan = exportPlan;
window.sharePlan = sharePlan;
window.refreshPlan = refreshPlan;
window.logout = logout;
window.toggleSampleData = toggleSampleData;
window.filterTable = filterTable;