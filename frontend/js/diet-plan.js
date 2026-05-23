// Diet Plan Management with Food Selection
const API_BASE_URL = 'http://localhost:3000';

// Global state
let selectedFoods = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
};

let foodDatabase = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
};

// User profile data
let userProfile = {};

// Diet plan data
let currentDietPlan = null;
let mealLogs = {
    breakfast: {},
    lunch: {},
    dinner: {},
    snacks: {}
};

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Diet Plan page loaded');

    // Check authentication
    checkAuthentication();

    // Initialize page
    initializePage();

    // Load user profile and then food data
    loadUserProfileAndFoods();

    // Load saved selections if any (Disabled to prevent confusion)
    // loadSavedSelections();

    // Setup event listeners
    setupEventListeners();

    // Load any existing meal logs
    loadMealLogs();
});

// Check if user is logged in
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        showMessage('Please login to access diet plan', 'error', 3000);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return false;
    }

    return true;
}

// Load user profile and initialize page
function initializePage() {
    // Load user data
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

    // Update welcome message
    const welcomeElement = document.getElementById('welcomeMessage');
    if (welcomeElement && user.name) {
        welcomeElement.textContent = `Welcome, ${user.name}`;
    }

    // Update plan details
    const planGoalElement = document.getElementById('planGoal');
    if (planGoalElement && userProfile.goal) {
        planGoalElement.textContent = userProfile.goal;
    }

    const planDateElement = document.getElementById('planDate');
    if (planDateElement) {
        planDateElement.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Display user preferences
    displayUserPreferences();

    // Check if profile is complete
    if (!userProfile.height || !userProfile.weight) {
        showMessage('Please complete your profile first', 'warning', 3000);
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 2000);
    }
}

// Display user preferences on page
function displayUserPreferences() {
    const preferencesDiv = document.getElementById('userPreferences');
    if (!preferencesDiv) return;

    let preferencesHTML = '<div class="preferences-summary">';
    preferencesHTML += '<h4><i class="fas fa-user-cog"></i> Your Preferences:</h4>';

    if (userProfile.dailyMeals && userProfile.dailyMeals.length > 0) {
        preferencesHTML += `<p><strong>Selected Meals:</strong> ${userProfile.dailyMeals.join(', ')}</p>`;
    }

    if (userProfile.dietTypes && userProfile.dietTypes.length > 0) {
        preferencesHTML += `<p><strong>Diet Types:</strong> ${userProfile.dietTypes.join(', ')}</p>`;
    }

    if (userProfile.goal) {
        preferencesHTML += `<p><strong>Goal:</strong> ${userProfile.goal}</p>`;
    }

    preferencesHTML += '</div>';
    preferencesDiv.innerHTML = preferencesHTML;
}

// Load user profile and then filtered foods
function loadUserProfileAndFoods() {
    console.log('Loading user profile...');

    // Get user profile from localStorage
    userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

    if (!userProfile.dailyMeals || userProfile.dailyMeals.length === 0) {
        console.warn('No daily meals selected in profile. Using default meals.');
        userProfile.dailyMeals = ['breakfast', 'lunch', 'dinner'];
    }

    if (!userProfile.dietTypes || userProfile.dietTypes.length === 0) {
        console.warn('No diet types selected in profile. Showing all foods.');
        userProfile.dietTypes = [];
    }

    console.log('User preferences:', {
        dailyMeals: userProfile.dailyMeals,
        dietTypes: userProfile.dietTypes,
        goal: userProfile.goal
    });

    // Hide meal sections not selected by user
    hideUnselectedMealSections();

    // Load filtered food data
    loadFilteredFoodData();
}

// Hide meal sections not selected by user
function hideUnselectedMealSections() {
    const allMealSections = ['breakfast', 'lunch', 'dinner', 'snacks'];
    const selectedMeals = userProfile.dailyMeals || ['breakfast', 'lunch', 'dinner'];

    allMealSections.forEach(meal => {
        const section = document.getElementById(`${meal}Section`);
        if (section) {
            if (selectedMeals.includes(meal)) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        }
    });

    console.log('Visible sections:', selectedMeals);
}

// Load food data filtered by user preferences
async function loadFilteredFoodData() {
    console.log('🍽️ Loading food data based on user preferences...');

    try {
        // First, test API connection
        console.log('Testing API connection...');
        const testResponse = await fetch(`${API_BASE_URL}/api/food`);
        console.log('API test status:', testResponse.status);

        if (!testResponse.ok) {
            console.error('API not reachable');
            showMessage('Cannot connect to server. Make sure backend is running.', 'error', 5000);
            loadSampleFoodData(); // Fallback
            return;
        }

        const selectedMeals = userProfile.dailyMeals || ['breakfast', 'lunch', 'dinner'];
        const dietTypes = userProfile.dietTypes || [];

        console.log('Loading foods for:', {
            meals: selectedMeals,
            dietTypes: dietTypes
        });

        // Load foods for each selected meal category
        for (const category of selectedMeals) {
            await loadCategoryFoods(category, dietTypes);
        }

        showMessage('✅ Food options loaded based on your preferences!', 'success', 3000);

    } catch (error) {
        console.error('Error loading food data:', error);
        showMessage('⚠️ Error loading food options. Please try again.', 'warning', 5000);

        // Fallback to sample data
        loadSampleFoodData();
    }
}

// Load foods for a specific category with diet type filters
async function loadCategoryFoods(category, dietTypes = []) {
    console.log(`Loading ${category} foods...`);

    try {
        // Build query parameters
        const params = new URLSearchParams({
            category: category,
            limit: 50  // Get more items for better filtering
        });

        // Add diet type filters if user has selected any
        if (dietTypes.length > 0) {
            params.append('dietTypes', dietTypes.join(','));
            console.log(`Filtering ${category} by diet types:`, dietTypes);
        }

        const response = await fetch(`${API_BASE_URL}/api/food?${params}`);
        console.log(`${category} response status:`, response.status);

        if (response.ok) {
            const result = await response.json();

            let foods = [];

            // Handle different response formats
            if (result.success && result.data) {
                foods = result.data;
            } else if (Array.isArray(result)) {
                foods = result;
            } else if (result.data && Array.isArray(result.data)) {
                foods = result.data;
            }

            // If diet types were specified but API didn't filter, filter client-side
            if (dietTypes.length > 0) {
                foods = foods.filter(food => {
                    // Check if food has at least one of the selected diet types
                    return food.dietTypes && food.dietTypes.some(diet => dietTypes.includes(diet));
                });
                console.log(`After client-side filtering: ${foods.length} ${category} items`);
            }

            foodDatabase[category] = foods;
            console.log(`Loaded ${category}: ${foods.length} items`);

            if (foods.length > 0) {
                renderFoodOptions(category, foods);
            } else {
                renderNoFoodsMessage(category, dietTypes);
            }

        } else {
            console.warn(`Failed to load ${category}:`, response.status);
            renderNoFoodsMessage(category, dietTypes);
        }

    } catch (error) {
        console.error(`Error loading ${category}:`, error);
        renderNoFoodsMessage(category, dietTypes);
    }
}

// Render "no foods" message with context
function renderNoFoodsMessage(category, dietTypes = []) {
    const optionsDiv = document.getElementById(`${category}Options`);
    if (optionsDiv) {
        let message = `No ${category} options available`;

        if (dietTypes.length > 0) {
            message += ` for ${dietTypes.join(', ')} diet`;
        }

        optionsDiv.innerHTML = `
            <div class="no-foods">
                <i class="fas fa-utensils"></i>
                <p>${message}</p>
                <small>Try different diet preferences or add more foods to database</small>
            </div>
        `;
    }
}

// Render food options for a category
function renderFoodOptions(category, foods) {
    console.log(`Rendering ${category} options:`, foods.length, 'items');

    const optionsDiv = document.getElementById(`${category}Options`);
    if (!optionsDiv) {
        console.error(`Element not found: ${category}Options`);
        return;
    }

    if (!foods || foods.length === 0) {
        renderNoFoodsMessage(category, userProfile.dietTypes || []);
        return;
    }

    // Show category section (in case it was hidden)
    const section = document.getElementById(`${category}Section`);
    if (section) {
        section.style.display = 'block';
    }

    // Create food cards
    optionsDiv.innerHTML = foods.map(food => createFoodCard(food, category)).join('');

    // Add click handlers to food cards
    optionsDiv.querySelectorAll('.food-select-card').forEach(card => {
        card.addEventListener('click', function (e) {
            if (!e.target.closest('.btn-remove-item')) {
                const foodId = this.dataset.foodId;
                console.log(`Clicked ${category} food: ${foodId}`);
                toggleFoodSelection(category, foodId);
            }
        });
    });
}

// Create food card HTML
function createFoodCard(food, category) {
    const isSelected = selectedFoods[category].some(f => f._id === food._id);

    return `
        <div class="food-select-card ${isSelected ? 'selected' : ''}" 
             data-food-id="${food._id}"
             data-category="${category}">
            <div class="select-checkbox"></div>
            
            <div class="food-select-header">
                <h4 class="food-select-name">${food.name}</h4>
                <span class="food-select-calories">${food.calories} kcal</span>
            </div>
            
            <p class="food-select-description">${food.description || 'Healthy food option'}</p>
            
            <div class="food-select-nutrition">
                <span class="nutrition-chip chip-protein">
                    <i class="fas fa-dumbbell"></i> ${food.protein || 0}g Protein
                </span>
                <span class="nutrition-chip chip-carbs">
                    <i class="fas fa-bread-slice"></i> ${food.carbs || 0}g Carbs
                </span>
                <span class="nutrition-chip chip-fats">
                    <i class="fas fa-oil-can"></i> ${food.fats || 0}g Fats
                </span>
            </div>
            
            <div class="food-select-diet-tags">
                ${(food.dietTypes || []).map(type =>
        `<span class="diet-tag-small">${type}</span>`
    ).join('')}
            </div>
            
            <div class="food-select-serving">
                <small>Serving: ${food.servingSize || '1 serving'}</small>
            </div>
        </div>
    `;
}

// Log the currently selected foods for a specific meal type
async function logSelectedMeal(mealType) {
    const foods = selectedFoods[mealType];
    if (!foods || foods.length === 0) {
        showMessage(`No items selected for ${mealType}`, 'warning', 3000);
        return;
    }

    // Calculate totals for the meal
    const totals = foods.reduce((acc, f) => {
        acc.calories += f.calories || 0;
        acc.protein += f.protein || 0;
        acc.carbs += f.carbs || 0;
        acc.fats += f.fats || 0;
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const mealLog = {
        mealType: mealType,
        foodItems: foods.map(f => ({
            foodId: f._id,
            name: f.name,
            quantity: 1, // you can make this adjustable if needed
            calories: f.calories,
            protein: f.protein,
            carbs: f.carbs,
            fats: f.fats
        })),
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFats: totals.fats,
        date: new Date()
    };

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/api/logs/meal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(mealLog)
        });

        const result = await response.json();
        if (result.success) {
            showMessage(`✅ ${mealType} logged successfully!`, 'success', 3000);
            // Optional: clear the selection after logging
            clearSelection(mealType);
        } else {
            showMessage('❌ Failed to log meal', 'error', 3000);
        }
    } catch (error) {
        console.error('Error logging meal:', error);
        showMessage('❌ Network error', 'error', 3000);
    }
}

// Make it globally available for onclick handlers
window.logSelectedMeal = logSelectedMeal;

// Setup event listeners
function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadFilteredFoodData);
    }

    // Plan action buttons
    const generatePlanBtn = document.querySelector('.btn-generate-plan');
    if (generatePlanBtn) {
        generatePlanBtn.addEventListener('click', generatePlanFromSelection);
    }

    const clearAllBtn = document.querySelector('.btn-clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllSelections);
    }

    const savePlanBtn = document.querySelector('.btn-save-custom-plan');
    if (savePlanBtn) {
        savePlanBtn.addEventListener('click', saveCustomPlan);
    }

    // View plan buttons
    const viewWeekBtn = document.querySelector('.btn-view-week');
    const viewMonthBtn = document.querySelector('.btn-view-month');
    const viewYearBtn = document.querySelector('.btn-view-year');

    if (viewWeekBtn) {
        viewWeekBtn.addEventListener('click', () => showDietPlanTable('week'));
    }
    if (viewMonthBtn) {
        viewMonthBtn.addEventListener('click', () => showDietPlanTable('month'));
    }
    if (viewYearBtn) {
        viewYearBtn.addEventListener('click', () => showDietPlanTable('year'));
    }

    // Log food button
    const logFoodBtn = document.querySelector('.btn-log-food');
    if (logFoodBtn) {
        logFoodBtn.addEventListener('click', showLogFoodModal);
    }
}

// ========== SELECTION FUNCTIONS ==========

function toggleFoodSelection(category, foodId) {
    console.log(`Toggling selection: ${category} - ${foodId}`);

    const food = foodDatabase[category].find(f => f._id === foodId);
    if (!food) {
        console.error('Food not found:', foodId);
        return;
    }

    const existingIndex = selectedFoods[category].findIndex(f => f._id === foodId);

    if (existingIndex > -1) {
        selectedFoods[category].splice(existingIndex, 1);
    } else {
        selectedFoods[category].push(food);
    }

    updateFoodCardUI(category, foodId);
    updateSelectedList(category);
    updateSelectionCount(category);
    updateNutritionSummary();
    saveSelections();
}

function updateFoodCardUI(category, foodId) {
    const card = document.querySelector(`.food-select-card[data-food-id="${foodId}"][data-category="${category}"]`);
    if (card) {
        const isSelected = selectedFoods[category].some(f => f._id === foodId);
        card.classList.toggle('selected', isSelected);
    }
}

function updateSelectedList(category) {
    const selectedList = document.getElementById(`${category}SelectedList`);
    if (!selectedList) return;

    const selectedItems = selectedFoods[category];

    if (selectedItems.length === 0) {
        selectedList.innerHTML = '<p class="empty-selection">No items selected yet</p>';
        return;
    }

    selectedList.innerHTML = selectedItems.map(food => `
        <div class="selected-item" data-food-id="${food._id}">
            <div class="selected-item-info">
                <h5>${food.name}</h5>
                <span class="selected-item-calories">
                    ${food.calories} kcal | P: ${food.protein || 0}g | C: ${food.carbs || 0}g | F: ${food.fats || 0}g
                </span>
            </div>
            <div class="selected-item-actions">
                <button class="btn-remove-item" onclick="removeSelectedItem('${category}', '${food._id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function removeSelectedItem(category, foodId) {
    selectedFoods[category] = selectedFoods[category].filter(f => f._id !== foodId);

    updateFoodCardUI(category, foodId);
    updateSelectedList(category);
    updateSelectionCount(category);
    updateNutritionSummary();
    saveSelections();

    showMessage('Item removed', 'info', 2000);
}

function clearSelection(category) {
    if (selectedFoods[category].length === 0) {
        showMessage(`No items selected for ${category}`, 'info', 2000);
        return;
    }

    if (confirm(`Clear all ${category} selections?`)) {
        selectedFoods[category] = [];

        // Update UI for food cards in this category
        const cards = document.querySelectorAll(`.food-select-card[data-category="${category}"]`);
        cards.forEach(card => card.classList.remove('selected'));

        updateSelectedList(category);
        updateSelectionCount(category);
        updateNutritionSummary();
        saveSelections();
        showMessage(`Cleared ${category} selections`, 'success', 2000);
    }
}

function clearAllSelections() {
    const totalSelections = Object.values(selectedFoods).reduce((sum, arr) => sum + arr.length, 0);

    if (totalSelections === 0) {
        showMessage('No items selected to clear', 'info', 2000);
        return;
    }

    if (confirm(`Clear all ${totalSelections} selected items?`)) {
        Object.keys(selectedFoods).forEach(category => {
            selectedFoods[category] = [];

            // Update UI for food cards in this category
            const cards = document.querySelectorAll(`.food-select-card[data-category="${category}"]`);
            cards.forEach(card => card.classList.remove('selected'));

            updateSelectedList(category);
            updateSelectionCount(category);
        });
        updateNutritionSummary();
        saveSelections();
        showMessage('All selections cleared', 'success', 2000);
    }
}

function updateSelectionCount(category) {
    const countElement = document.getElementById(`${category}Count`);
    if (countElement) {
        const count = selectedFoods[category].length;
        countElement.textContent = `Selected: ${count}`;
        countElement.style.backgroundColor = count > 0 ? '#4CAF50' : '#2196F3';
    }
}

function updateNutritionSummary() {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    Object.values(selectedFoods).forEach(categoryFoods => {
        categoryFoods.forEach(food => {
            totalCalories += food.calories || 0;
            totalProtein += food.protein || 0;
            totalCarbs += food.carbs || 0;
            totalFats += food.fats || 0;
        });
    });

    document.getElementById('totalCalories').textContent = totalCalories;
    document.getElementById('totalProtein').textContent = totalProtein.toFixed(1);
    document.getElementById('totalCarbs').textContent = totalCarbs.toFixed(1);
    document.getElementById('totalFats').textContent = totalFats.toFixed(1);
}

// ========== DIET PLAN TABLE GENERATION ==========

// Add this to your existing diet-plan.js file
// Modify the generatePlanFromSelection function:

function generatePlanFromSelection() {
    const totalSelections = Object.values(selectedFoods).reduce((sum, arr) => sum + arr.length, 0);

    if (totalSelections === 0) {
        showMessage('Please select some food items first', 'warning', 3000);
        return;
    }

    const totals = calculateTotals();
    const plan = {
        generatedAt: new Date().toISOString(),
        type: 'custom',
        selectedFoods: selectedFoods,
        totals: totals,
        profile: userProfile,
        date: new Date().toLocaleDateString()
    };

    currentDietPlan = plan;
    localStorage.setItem('currentDietPlan', JSON.stringify(plan));

    showMessage(`✅ Diet plan created with ${totalSelections} items! Redirecting to view...`, 'success', 3000);

    // Redirect to display page after 2 seconds
    setTimeout(() => {
        window.location.href = 'diet-plan-display.html';
    }, 2000);
}

// Also add this function to show the generated plan
function viewGeneratedPlan() {
    if (!currentDietPlan) {
        showMessage('No plan generated yet', 'warning', 3000);
        return;
    }

    window.location.href = 'diet-plan-display.html';
}

// Make it available globally
window.viewGeneratedPlan = viewGeneratedPlan;

function createDietPlanTable(viewType = 'week') {
    const planDisplay = document.getElementById('dietPlanDisplay');
    if (!planDisplay) return;

    const plan = currentDietPlan || JSON.parse(localStorage.getItem('currentDietPlan') || '{}');
    if (!plan.selectedFoods) {
        showMessage('No diet plan found. Generate one first.', 'warning', 3000);
        return;
    }

    let days = 7; // Default week
    let periodText = 'Week';

    switch (viewType) {
        case 'month':
            days = 30;
            periodText = 'Month';
            break;
        case 'year':
            days = 365;
            periodText = 'Year';
            break;
        default:
            days = 7;
            periodText = 'Week';
    }

    const today = new Date();
    const tableHTML = `
        <div class="diet-plan-table-container">
            <div class="plan-table-header">
                <h3><i class="fas fa-calendar-alt"></i> Your ${periodText}ly Diet Plan</h3>
                <div class="plan-period-buttons">
                    <button class="btn-period ${viewType === 'week' ? 'active' : ''}" onclick="createDietPlanTable('week')">
                        <i class="fas fa-calendar-week"></i> Week
                    </button>
                    <button class="btn-period ${viewType === 'month' ? 'active' : ''}" onclick="createDietPlanTable('month')">
                        <i class="fas fa-calendar"></i> Month
                    </button>
                    <button class="btn-period ${viewType === 'year' ? 'active' : ''}" onclick="createDietPlanTable('year')">
                        <i class="fas fa-calendar-check"></i> Year
                    </button>
                </div>
            </div>
            
            <div class="table-responsive">
                <table class="diet-plan-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Day</th>
                            ${userProfile.dailyMeals.includes('breakfast') ? '<th>Breakfast</th>' : ''}
                            ${userProfile.dailyMeals.includes('lunch') ? '<th>Lunch</th>' : ''}
                            ${userProfile.dailyMeals.includes('dinner') ? '<th>Dinner</th>' : ''}
                            ${userProfile.dailyMeals.includes('snacks') ? '<th>Snacks</th>' : ''}
                            <th>Log Food</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateTableRows(days, plan.selectedFoods, userProfile.dailyMeals)}
                    </tbody>
                </table>
            </div>
            
            <div class="plan-summary-footer">
                <div class="summary-stats">
                    <h4><i class="fas fa-chart-bar"></i> Plan Summary</h4>
                    <div class="stat-cards">
                        <div class="stat-card">
                            <span class="stat-label">Total Days</span>
                            <span class="stat-value">${days}</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Avg Calories/Day</span>
                            <span class="stat-value">${calculateAverageCalories(plan.selectedFoods).toFixed(0)}</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Total Foods</span>
                            <span class="stat-value">${Object.values(plan.selectedFoods).reduce((sum, arr) => sum + arr.length, 0)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="plan-actions">
                    <button class="btn btn-primary" onclick="printDietPlan()">
                        <i class="fas fa-print"></i> Print Plan
                    </button>
                    <button class="btn btn-success" onclick="exportDietPlan()">
                        <i class="fas fa-download"></i> Export PDF
                    </button>
                    <button class="btn btn-info" onclick="shareDietPlan()">
                        <i class="fas fa-share-alt"></i> Share Plan
                    </button>
                </div>
            </div>
        </div>
    `;

    planDisplay.innerHTML = tableHTML;
    planDisplay.style.display = 'block';

    // Scroll to plan display
    planDisplay.scrollIntoView({ behavior: 'smooth' });
}

function generateTableRows(days, selectedFoods, dailyMeals) {
    let rowsHTML = '';
    const today = new Date();

    // Create cyclers for each meal category to cycle through foods
    const breakfastCycler = createCycler(selectedFoods.breakfast || []);
    const lunchCycler = createCycler(selectedFoods.lunch || []);
    const dinnerCycler = createCycler(selectedFoods.dinner || []);
    const snacksCycler = createCycler(selectedFoods.snacks || []);

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        // Check if food is logged for this day
        const loggedBreakfast = mealLogs.breakfast[date.toDateString()];
        const loggedLunch = mealLogs.lunch[date.toDateString()];
        const loggedDinner = mealLogs.dinner[date.toDateString()];
        const loggedSnacks = mealLogs.snacks[date.toDateString()];

        rowsHTML += `
            <tr>
                <td class="date-cell">
                    <strong>${dateStr}</strong>
                    <small>${date.getFullYear()}</small>
                </td>
                <td class="day-cell ${dayName.toLowerCase()}">
                    ${dayName}
                    ${i === 0 ? '<span class="today-badge">Today</span>' : ''}
                </td>
                ${dailyMeals.includes('breakfast') ? `
                    <td class="meal-cell breakfast">
                        ${loggedBreakfast ?
                    `<div class="logged-food">
                                <span class="food-name">${loggedBreakfast.name}</span>
                                <small class="food-calories">${loggedBreakfast.calories} kcal</small>
                                <button class="btn-edit-log" onclick="editMealLog('breakfast', '${date.toDateString()}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>` :
                    `<div class="suggested-food">
                                <span class="food-name">${breakfastCycler().name || 'No food selected'}</span>
                                <button class="btn-log-meal" onclick="openLogMealModal('breakfast', '${date.toDateString()}')">
                                    <i class="fas fa-plus-circle"></i> Log
                                </button>
                            </div>`
                }
                    </td>
                ` : ''}
                
                ${dailyMeals.includes('lunch') ? `
                    <td class="meal-cell lunch">
                        ${loggedLunch ?
                    `<div class="logged-food">
                                <span class="food-name">${loggedLunch.name}</span>
                                <small class="food-calories">${loggedLunch.calories} kcal</small>
                                <button class="btn-edit-log" onclick="editMealLog('lunch', '${date.toDateString()}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>` :
                    `<div class="suggested-food">
                                <span class="food-name">${lunchCycler().name || 'No food selected'}</span>
                                <button class="btn-log-meal" onclick="openLogMealModal('lunch', '${date.toDateString()}')">
                                    <i class="fas fa-plus-circle"></i> Log
                                </button>
                            </div>`
                }
                    </td>
                ` : ''}
                
                ${dailyMeals.includes('dinner') ? `
                    <td class="meal-cell dinner">
                        ${loggedDinner ?
                    `<div class="logged-food">
                                <span class="food-name">${loggedDinner.name}</span>
                                <small class="food-calories">${loggedDinner.calories} kcal</small>
                                <button class="btn-edit-log" onclick="editMealLog('dinner', '${date.toDateString()}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>` :
                    `<div class="suggested-food">
                                <span class="food-name">${dinnerCycler().name || 'No food selected'}</span>
                                <button class="btn-log-meal" onclick="openLogMealModal('dinner', '${date.toDateString()}')">
                                    <i class="fas fa-plus-circle"></i> Log
                                </button>
                            </div>`
                }
                    </td>
                ` : ''}
                
                ${dailyMeals.includes('snacks') ? `
                    <td class="meal-cell snacks">
                        ${loggedSnacks ?
                    `<div class="logged-food">
                                <span class="food-name">${loggedSnacks.name}</span>
                                <small class="food-calories">${loggedSnacks.calories} kcal</small>
                                <button class="btn-edit-log" onclick="editMealLog('snacks', '${date.toDateString()}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>` :
                    `<div class="suggested-food">
                                <span class="food-name">${snacksCycler().name || 'No food selected'}</span>
                                <button class="btn-log-meal" onclick="openLogMealModal('snacks', '${date.toDateString()}')">
                                    <i class="fas fa-plus-circle"></i> Log
                                </button>
                            </div>`
                }
                    </td>
                ` : ''}
                
                <td class="log-cell">
                    <button class="btn-log-day" onclick="logDayMeals('${date.toDateString()}')">
                        <i class="fas fa-utensils"></i> Log All
                    </button>
                </td>
            </tr>
        `;
    }

    return rowsHTML;
}

// Helper function to create a cycler for food items
function createCycler(array) {
    let index = 0;
    return function () {
        if (!array || array.length === 0) {
            return { name: 'No food selected', calories: 0 };
        }
        const item = array[index];
        index = (index + 1) % array.length;
        return item;
    };
}

function calculateTotals() {
    let totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0
    };

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

function calculateAverageCalories(selectedFoods) {
    let totalCalories = 0;
    let totalMeals = 0;

    Object.values(selectedFoods).forEach(categoryFoods => {
        categoryFoods.forEach(food => {
            totalCalories += food.calories || 0;
        });
        totalMeals += categoryFoods.length;
    });

    return totalMeals > 0 ? totalCalories / totalMeals : 0;
}

// ========== MEAL LOGGING FUNCTIONS ==========

function showLogFoodModal() {
    const modalHTML = `
        <div class="modal-overlay" id="logFoodModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-utensils"></i> Log Your Food</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="log-food-form">
                        <div class="form-group">
                            <label for="logDate">Date</label>
                            <input type="date" id="logDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        
                        <div class="form-group">
                            <label for="logMealType">Meal Type</label>
                            <select id="logMealType" class="form-control">
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="snacks">Snacks</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="logFoodSearch">Search Food</label>
                            <input type="text" id="logFoodSearch" class="form-control" placeholder="Search for food...">
                            <div id="foodSearchResults" class="search-results"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="logCustomFood">Food Name</label>
                            <input type="text" id="logCustomFood" class="form-control" placeholder="Food name">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="logCustomCalories">Calories (kcal)</label>
                                <input type="number" id="logCustomCalories" class="form-control" placeholder="Calories">
                            </div>
                            <div class="form-group">
                                <label for="logProtein">Protein (g)</label>
                                <input type="number" id="logProtein" class="form-control" placeholder="Protein">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="logCarbs">Carbs (g)</label>
                                <input type="number" id="logCarbs" class="form-control" placeholder="Carbs">
                            </div>
                            <div class="form-group">
                                <label for="logFats">Fats (g)</label>
                                <input type="number" id="logFats" class="form-control" placeholder="Fats">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="logQuantity">Quantity</label>
                            <input type="number" id="logQuantity" class="form-control" value="1" min="0.5" max="10" step="0.5">
                        </div>
                        
                        <div class="form-group">
                            <label for="logNotes">Notes</label>
                            <textarea id="logNotes" class="form-control" rows="3" placeholder="Any additional notes..."></textarea>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="saveMealLog()">Save Log</button>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('logFoodModal');
    if (existingModal) existingModal.remove();

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Setup search functionality
    document.getElementById('logFoodSearch').addEventListener('input', function (e) {
        searchFoodsForLog(e.target.value);
    });
}

function searchFoodsForLog(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
        document.getElementById('foodSearchResults').innerHTML = '';
        return;
    }

    const searchLower = searchTerm.toLowerCase();
    let allFoods = [];

    // Combine all foods from database
    Object.values(foodDatabase).forEach(categoryFoods => {
        allFoods = allFoods.concat(categoryFoods);
    });

    // Search in food names
    const results = allFoods.filter(food =>
        food.name.toLowerCase().includes(searchLower)
    ).slice(0, 10); // Limit to 10 results

    const resultsDiv = document.getElementById('foodSearchResults');
    resultsDiv.innerHTML = results.map(food => `
        <div class="search-result-item" onclick="selectFoodForLog('${food._id}', '${food.name}', ${food.calories}, ${food.protein || 0}, ${food.carbs || 0}, ${food.fats || 0})">
            <strong>${food.name}</strong>
            <small>${food.calories} kcal • P: ${food.protein || 0}g • C: ${food.carbs || 0}g • F: ${food.fats || 0}g</small>
        </div>
    `).join('');
}

function selectFoodForLog(foodId, foodName, foodCalories, foodProtein, foodCarbs, foodFats) {
    document.getElementById('logCustomFood').value = foodName;
    document.getElementById('logCustomCalories').value = foodCalories;
    document.getElementById('logProtein').value = foodProtein;
    document.getElementById('logCarbs').value = foodCarbs;
    document.getElementById('logFats').value = foodFats;
    document.getElementById('foodSearchResults').innerHTML = '';
    document.getElementById('logFoodSearch').value = '';
}

function openLogMealModal(mealType, dateString) {
    showLogFoodModal();

    // Set the modal values
    setTimeout(() => {
        const date = new Date(dateString);
        document.getElementById('logDate').value = date.toISOString().split('T')[0];
        document.getElementById('logMealType').value = mealType;
    }, 100);
}

function logDayMeals(dateString) {
    showLogFoodModal();

    // Set the modal values
    setTimeout(() => {
        const date = new Date(dateString);
        document.getElementById('logDate').value = date.toISOString().split('T')[0];
    }, 100);
}

function editMealLog(mealType, dateString) {
    showLogFoodModal();

    // Set the modal values with existing data
    setTimeout(() => {
        const date = new Date(dateString);
        document.getElementById('logDate').value = date.toISOString().split('T')[0];
        document.getElementById('logMealType').value = mealType;

        const loggedFood = mealLogs[mealType][dateString];
        if (loggedFood) {
            document.getElementById('logCustomFood').value = loggedFood.name;
            document.getElementById('logCustomCalories').value = loggedFood.calories;
            document.getElementById('logProtein').value = loggedFood.protein || 0;
            document.getElementById('logCarbs').value = loggedFood.carbs || 0;
            document.getElementById('logFats').value = loggedFood.fats || 0;
            if (loggedFood.notes) {
                document.getElementById('logNotes').value = loggedFood.notes;
            }
            if (loggedFood.quantity) {
                document.getElementById('logQuantity').value = loggedFood.quantity;
            }
        }
    }, 100);
}

async function saveMealLog() {
    const date = document.getElementById('logDate').value;
    const mealType = document.getElementById('logMealType').value;
    const foodName = document.getElementById('logCustomFood').value;
    const calories = parseFloat(document.getElementById('logCustomCalories').value) || 0;
    const protein = parseFloat(document.getElementById('logProtein').value) || 0;
    const carbs = parseFloat(document.getElementById('logCarbs').value) || 0;
    const fats = parseFloat(document.getElementById('logFats').value) || 0;
    const quantity = parseFloat(document.getElementById('logQuantity').value) || 1;
    const notes = document.getElementById('logNotes').value;

    if (!foodName.trim()) {
        showMessage('Please enter a food name', 'error', 3000);
        return;
    }

    const dateObj = new Date(date);
    const dateKey = dateObj.toDateString();

    const mealLogData = {
        mealType: mealType,
        foodItems: [{
            name: foodName,
            quantity: quantity,
            calories: calories * quantity,
            protein: protein * quantity,
            carbs: carbs * quantity,
            fats: fats * quantity
        }],
        totalCalories: calories * quantity,
        totalProtein: protein * quantity,
        totalCarbs: carbs * quantity,
        totalFats: fats * quantity,
        date: dateObj
    };

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/api/logs/meal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(mealLogData)
        });

        const result = await response.json();
        if (result.success) {
            // Save to local storage cache/fallback
            if (!mealLogs[mealType]) mealLogs[mealType] = {};
            mealLogs[mealType][dateKey] = {
                name: foodName,
                calories: calories * quantity,
                protein: protein * quantity,
                carbs: carbs * quantity,
                fats: fats * quantity,
                quantity: quantity,
                notes: notes,
                loggedAt: new Date().toISOString()
            };
            saveMealLogsToStorage();

            closeModal();
            if (currentDietPlan) {
                createDietPlanTable('week');
            }
            showMessage(`✅ ${mealType} logged successfully!`, 'success', 3000);
        } else {
            showMessage('❌ Failed to save to database', 'error', 3000);
        }
    } catch (error) {
        console.error('Error saving meal log:', error);
        showMessage('❌ Network error', 'error', 3000);
    }
}

function loadMealLogs() {
    const savedLogs = localStorage.getItem('mealLogs');
    if (savedLogs) {
        try {
            mealLogs = JSON.parse(savedLogs);
        } catch (error) {
            console.error('Error loading meal logs:', error);
        }
    }
}

function saveMealLogsToStorage() {
    localStorage.setItem('mealLogs', JSON.stringify(mealLogs));
}

function closeModal() {
    const modal = document.getElementById('logFoodModal');
    if (modal) modal.remove();
}

// ========== OTHER FUNCTIONS ==========

function saveSelections() {
    localStorage.setItem('dietPlanSelections', JSON.stringify(selectedFoods));
}

// function loadSavedSelections() {
//     const saved = localStorage.getItem('dietPlanSelections');
//     if (saved) {
//         try {
//             selectedFoods = JSON.parse(saved);
//             Object.keys(selectedFoods).forEach(category => {
//                 updateSelectedList(category);
//                 updateSelectionCount(category);
//             });
//             updateNutritionSummary();
//         } catch (error) {
//             console.error('Error loading saved selections:', error);
//         }
//     }
// }

// Save custom plan to server
async function saveCustomPlan() {
    const totalSelections = Object.values(selectedFoods).reduce((sum, arr) => sum + arr.length, 0);

    if (totalSelections === 0) {
        showMessage('Please select some food items first', 'warning', 3000);
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Please login to save plan', 'error', 3000);
        return;
    }

    const planData = {
        name: `Custom Plan - ${new Date().toLocaleDateString()}`,
        type: 'custom',
        selectedFoods: selectedFoods,
        totals: calculateTotals(),
        profile: userProfile,
        date: new Date().toISOString()
    };

    try {
        showMessage('Saving your custom plan...', 'info', 2000);

        const response = await fetch(`${API_BASE_URL}/api/diet-plans/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(planData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showMessage('✅ Custom plan saved successfully! Redirecting...', 'success', 2000);

            // Store in localStorage as current plan for immediate UI update
            localStorage.setItem('currentDietPlan', JSON.stringify(result.data || planData));
            currentDietPlan = result.data || planData;

            // Redirect to My Diet Plan page after a short delay
            setTimeout(() => {
                window.location.href = 'diet-plan-display.html';
            }, 1000);
        } else {
            showMessage(`Failed to save plan: ${result.message || 'Unknown error'}`, 'error', 4000);
        }
    } catch (error) {
        console.error('Error saving custom plan:', error);
        showMessage('Failed to save plan. Please try again.', 'error', 4000);
    }
}

// Utility functions
function printDietPlan() {
    window.print();
}

function exportDietPlan() {
    showMessage('Export feature coming soon!', 'info', 3000);
}

function shareDietPlan() {
    if (navigator.share) {
        navigator.share({
            title: 'My Diet Plan',
            text: 'Check out my diet plan!',
            url: window.location.href
        });
    } else {
        showMessage('Share feature not available in this browser', 'info', 3000);
    }
}

// Fallback sample food data (in case API is not available)
function loadSampleFoodData() {
    console.log('Loading sample food data...');

    const sampleData = {
        breakfast: [
            {
                _id: 'sample1',
                name: 'Oatmeal with Berries',
                category: 'breakfast',
                calories: 250,
                protein: 8,
                carbs: 45,
                fats: 5,
                description: 'Whole grain oatmeal with fresh berries',
                dietTypes: ['vegetarian', 'balanced'],
                servingSize: '1 bowl'
            },
            {
                _id: 'sample2',
                name: 'Greek Yogurt with Honey',
                category: 'breakfast',
                calories: 180,
                protein: 15,
                carbs: 20,
                fats: 4,
                description: 'Protein-rich Greek yogurt with natural honey',
                dietTypes: ['vegetarian', 'high-protein'],
                servingSize: '1 cup'
            }
        ],
        lunch: [
            {
                _id: 'sample3',
                name: 'Grilled Chicken Salad',
                category: 'lunch',
                calories: 350,
                protein: 30,
                carbs: 15,
                fats: 12,
                description: 'Fresh salad with grilled chicken breast',
                dietTypes: ['high-protein', 'balanced'],
                servingSize: '1 plate'
            }
        ],
        dinner: [
            {
                _id: 'sample4',
                name: 'Salmon with Vegetables',
                category: 'dinner',
                calories: 400,
                protein: 35,
                carbs: 20,
                fats: 18,
                description: 'Grilled salmon with steamed vegetables',
                dietTypes: ['high-protein', 'balanced'],
                servingSize: '1 plate'
            }
        ],
        snacks: [
            {
                _id: 'sample5',
                name: 'Mixed Nuts',
                category: 'snacks',
                calories: 200,
                protein: 6,
                carbs: 8,
                fats: 16,
                description: 'Healthy mix of almonds, walnuts, and cashews',
                dietTypes: ['vegetarian', 'high-protein', 'balanced'],
                servingSize: '1 handful'
            }
        ]
    };

    // Filter based on user preferences
    const selectedMeals = userProfile.dailyMeals || ['breakfast', 'lunch', 'dinner'];
    const dietTypes = userProfile.dietTypes || [];

    selectedMeals.forEach(category => {
        let foods = sampleData[category] || [];

        // Filter by diet types if specified
        if (dietTypes.length > 0) {
            foods = foods.filter(food =>
                food.dietTypes && food.dietTypes.some(diet => dietTypes.includes(diet))
            );
        }

        foodDatabase[category] = foods;

        if (foods.length > 0) {
            renderFoodOptions(category, foods);
        } else {
            renderNoFoodsMessage(category, dietTypes);
        }
    });

    showMessage('⚠️ Using sample data. Connect to server for full options.', 'warning', 4000);
}

// Message display function
function showMessage(message, type, duration = 3000) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.diet-message');
    existingMessages.forEach(msg => msg.remove());

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `diet-message message-${type}`;
    messageDiv.textContent = message;

    // Add styles
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.padding = '12px 20px';
    messageDiv.style.borderRadius = '8px';
    messageDiv.style.zIndex = '10000';
    messageDiv.style.minWidth = '300px';
    messageDiv.style.maxWidth = '400px';
    messageDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    messageDiv.style.fontSize = '14px';
    messageDiv.style.fontWeight = '500';
    messageDiv.style.animation = 'slideIn 0.3s ease';

    // Style based on type
    switch (type) {
        case 'success':
            messageDiv.style.backgroundColor = '#4CAF50';
            messageDiv.style.color = 'white';
            messageDiv.style.borderLeft = '4px solid #2E7D32';
            break;
        case 'error':
            messageDiv.style.backgroundColor = '#f44336';
            messageDiv.style.color = 'white';
            messageDiv.style.borderLeft = '4px solid #c62828';
            break;
        case 'info':
            messageDiv.style.backgroundColor = '#2196F3';
            messageDiv.style.color = 'white';
            messageDiv.style.borderLeft = '4px solid #0d47a1';
            break;
        case 'warning':
            messageDiv.style.backgroundColor = '#FF9800';
            messageDiv.style.color = 'white';
            messageDiv.style.borderLeft = '4px solid #EF6C00';
            break;
    }

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'white';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '5px';
    closeBtn.style.right = '10px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.opacity = '0.8';
    closeBtn.addEventListener('click', () => messageDiv.remove());

    messageDiv.appendChild(closeBtn);
    document.body.appendChild(messageDiv);

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, duration);
    }
}

// Make functions globally available
window.removeSelectedItem = removeSelectedItem;
window.clearSelection = clearSelection;
window.clearAllSelections = clearAllSelections;
window.generatePlanFromSelection = generatePlanFromSelection;
window.saveCustomPlan = saveCustomPlan;
window.createDietPlanTable = createDietPlanTable;
window.showDietPlanTable = showDietPlanTable;
window.openLogMealModal = openLogMealModal;
window.logSelectedMeal = logSelectedMeal;
window.logDayMeals = logDayMeals;
window.editMealLog = editMealLog;
window.closeModal = closeModal;
window.selectFoodForLog = selectFoodForLog;
window.saveMealLog = saveMealLog;
window.printDietPlan = printDietPlan;
window.exportDietPlan = exportDietPlan;
window.shareDietPlan = shareDietPlan;