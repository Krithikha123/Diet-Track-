const API_BASE_URL = 'http://localhost:3000';

// Global state for selected exercises
let selectedExercises = {
    warmup: [],
    strength: [],
    cardio: [],
    cooldown: []
};

// Exercise categories mapping
const categoryMap = {
    warmup: 'warmup',
    strength: 'strength',
    cardio: 'cardio',
    cooldown: 'cooldown'
};

// DOM elements
const sections = {
    warmup: {
        options: document.getElementById('warmupOptions'),
        selectedList: document.getElementById('warmupSelectedList'),
        count: document.getElementById('warmupCount')
    },
    strength: {
        options: document.getElementById('strengthOptions'),
        selectedList: document.getElementById('strengthSelectedList'),
        count: document.getElementById('strengthCount')
    },
    cardio: {
        options: document.getElementById('cardioOptions'),
        selectedList: document.getElementById('cardioSelectedList'),
        count: document.getElementById('cardioCount')
    },
    cooldown: {
        options: document.getElementById('cooldownOptions'),
        selectedList: document.getElementById('cooldownSelectedList'),
        count: document.getElementById('cooldownCount')
    }
};

// Summary elements
const totalDurationEl = document.getElementById('totalDuration');
const totalCaloriesEl = document.getElementById('totalCalories');
const totalExercisesEl = document.getElementById('totalExercises');
const intensityLevelEl = document.getElementById('intensityLevel');

// Load exercises on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    await loadExercises();
    setupEventListeners();
});

// Fetch exercises from backend
async function loadExercises() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/workouts/exercises`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load exercises');

        const data = await response.json();
        const exercises = data.exercises || [];

        // Clear loading messages
        clearLoadingMessages();

        // Group exercises by category
        const grouped = {
            warmup: exercises.filter(ex => ex.category === 'warmup'),
            strength: exercises.filter(ex => ex.category === 'strength'),
            cardio: exercises.filter(ex => ex.category === 'cardio'),
            cooldown: exercises.filter(ex => ex.category === 'cooldown')
        };

        // Render each section
        renderExerciseOptions('warmup', grouped.warmup);
        renderExerciseOptions('strength', grouped.strength);
        renderExerciseOptions('cardio', grouped.cardio);
        renderExerciseOptions('cooldown', grouped.cooldown);

    } catch (error) {
        console.error('Error loading exercises:', error);
        showErrorMessage('Failed to load exercises. Please refresh.');
    }
}

// Clear "Loading..." placeholders
function clearLoadingMessages() {
    for (let section in sections) {
        const container = sections[section].options;
        if (container) container.innerHTML = '';
    }
}

// Render exercise cards for a given category
function renderExerciseOptions(category, exercises) {
    const container = sections[category].options;
    if (!container) return;

    if (exercises.length === 0) {
        container.innerHTML = '<div class="no-exercises"><i class="fas fa-dumbbell"></i><p>No exercises available for this category.</p></div>';
        return;
    }

    exercises.forEach(exercise => {
        const card = createExerciseCard(exercise, category);
        container.appendChild(card);
    });
}

// Create an exercise card element
function createExerciseCard(exercise, category) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.dataset.id = exercise._id;
    card.dataset.category = category;
    card.dataset.name = exercise.name;
    card.dataset.calories = exercise.caloriesPerMin || 5;
    card.dataset.duration = exercise.estimatedDuration || 10; // default if not provided

    const muscleGroups = exercise.muscleGroups ? exercise.muscleGroups.join(', ') : '';
    const equipment = exercise.equipment ? exercise.equipment.join(', ') : 'none';

    card.innerHTML = `
        <div class="exercise-info">
            <h4>${exercise.name}</h4>
            <div class="exercise-meta">
                <span><i class="fas fa-dumbbell"></i> ${muscleGroups || 'General'}</span>
                <span><i class="fas fa-tools"></i> ${equipment}</span>
                <span><i class="fas fa-fire"></i> ${exercise.caloriesPerMin || 5} cal/min</span>
            </div>
        </div>
        <div class="exercise-add">
            <i class="fas fa-plus-circle"></i>
        </div>
    `;

    // Click to select/deselect
    card.addEventListener('click', () => toggleExerciseSelection(card, category));

    return card;
}

// Toggle selection of an exercise
function toggleExerciseSelection(card, category) {
    const exerciseId = card.dataset.id;
    const exerciseName = card.dataset.name;
    const calories = parseFloat(card.dataset.calories);
    const duration = parseInt(card.dataset.duration);

    const index = selectedExercises[category].findIndex(ex => ex.id === exerciseId);

    if (index === -1) {
        // Select
        card.classList.add('selected');
        selectedExercises[category].push({
            id: exerciseId,
            name: exerciseName,
            calories,
            duration
        });
    } else {
        // Deselect
        card.classList.remove('selected');
        selectedExercises[category].splice(index, 1);
    }

    // Update selected list display
    renderSelectedExercises(category);
    updateCategoryCount(category);
    updateSummary();
}

// Render selected exercises for a category
function renderSelectedExercises(category) {
    const container = sections[category].selectedList;
    if (!container) return;

    const exercises = selectedExercises[category];

    if (exercises.length === 0) {
        container.innerHTML = '<p class="empty-selection">No exercises selected yet</p>';
        return;
    }

    container.innerHTML = exercises.map(ex => `
        <div class="selected-exercise-item" data-id="${ex.id}">
            <div class="selected-exercise-info">
                <h5>${ex.name}</h5>
                <div class="selected-exercise-details">
                    <span><i class="fas fa-fire"></i> ${ex.calories} cal/min</span>
                    <span><i class="fas fa-clock"></i> ${ex.duration} min</span>
                </div>
            </div>
            <div class="selected-exercise-actions">
                <button onclick="removeSelectedExercise('${category}', '${ex.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Remove a selected exercise (called from button)
window.removeSelectedExercise = function (category, exerciseId) {
    const index = selectedExercises[category].findIndex(ex => ex.id === exerciseId);
    if (index !== -1) {
        selectedExercises[category].splice(index, 1);

        // Also deselect the card
        const card = document.querySelector(`.exercise-card[data-id="${exerciseId}"]`);
        if (card) card.classList.remove('selected');

        renderSelectedExercises(category);
        updateCategoryCount(category);
        updateSummary();
    }
};

// Update the "Selected: X" count for a category
function updateCategoryCount(category) {
    const countEl = sections[category].count;
    if (countEl) {
        countEl.textContent = `Selected: ${selectedExercises[category].length}`;
    }
}

// Clear all selections for a category (called from "Clear Selection" button)
window.clearSelection = function (category) {
    // Deselect all cards
    selectedExercises[category].forEach(ex => {
        const card = document.querySelector(`.exercise-card[data-id="${ex.id}"]`);
        if (card) card.classList.remove('selected');
    });

    selectedExercises[category] = [];
    renderSelectedExercises(category);
    updateCategoryCount(category);
    updateSummary();
};

// Clear all selections across all categories (for "Clear All Selections" button)
window.clearAllSelections = function () {
    for (let category in selectedExercises) {
        clearSelection(category);
    }
};

// Calculate and update totals (duration, calories, exercise count)
function updateSummary() {
    let totalDuration = 0;
    let totalCalories = 0;
    let totalExerciseCount = 0;

    for (let category in selectedExercises) {
        selectedExercises[category].forEach(ex => {
            totalDuration += ex.duration || 0;
            totalCalories += (ex.calories || 0) * (ex.duration || 0); // calories per min * minutes
            totalExerciseCount++;
        });
    }

    if (totalDurationEl) totalDurationEl.textContent = totalDuration;
    if (totalCaloriesEl) totalCaloriesEl.textContent = Math.round(totalCalories);
    if (totalExercisesEl) totalExercisesEl.textContent = totalExerciseCount;

    // Simple intensity estimate
    if (totalExerciseCount === 0) {
        if (intensityLevelEl) intensityLevelEl.textContent = 'None';
    } else if (totalCalories < 200) {
        if (intensityLevelEl) intensityLevelEl.textContent = 'Low';
    } else if (totalCalories < 400) {
        if (intensityLevelEl) intensityLevelEl.textContent = 'Moderate';
    } else {
        if (intensityLevelEl) intensityLevelEl.textContent = 'High';
    }
}

// Setup global event listeners
function setupEventListeners() {
    // Generate Workout Plan button
    const generateBtn = document.querySelector('.btn-generate-plan');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateWorkoutPlan);
    }

    // Save Custom Plan button
    const saveBtn = document.querySelector('.btn-save-custom-plan');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCustomWorkout);
    }

    // Refresh Exercises button
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            clearAllSelections();
            loadExercises();
        });
    }
}

// Generate Workout Plan button handler
async function generateWorkoutPlan() {
    // Check if any exercises are selected
    const totalSelected = Object.values(selectedExercises).reduce((sum, arr) => sum + arr.length, 0);
    if (totalSelected === 0) {
        alert('Please select at least one exercise before generating a plan.');
        return;
    }

    // Attempt to save to server for persistence and totals calculation
    await saveToDatabase(selectedExercises, true);
}

// Save custom workout plan
async function saveCustomWorkout() {
    const totalSelected = Object.values(selectedExercises).reduce((sum, arr) => sum + arr.length, 0);
    if (totalSelected === 0) {
        alert('Please select at least one exercise before saving.');
        return;
    }

    await saveToDatabase(selectedExercises, true); // true = show notifications and redirect
}

async function saveToDatabase(planData, shouldRedirect) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        if (shouldRedirect) showStatusBarMessage('Saving your workout plan...');

        const response = await fetch(`${API_BASE_URL}/api/workouts/save-plan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(planData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Save the FULL plan object from server (including totals, weekStart, etc.)
            localStorage.setItem('workoutPlanSelected', JSON.stringify(result.data));

            if (shouldRedirect) {
                showStatusBarMessage('✅ Workout plan saved successfully!', 'success');

                setTimeout(() => {
                    window.location.href = 'workout-plan-display.html';
                }, 1000);
            }
        } else {
            console.error('Failed to save workout plan:', result.message);
            if (shouldRedirect) alert('Failed to save workout plan: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving workout plan:', error);
        if (shouldRedirect) alert('Network error while saving workout plan');
    }
}

function showStatusBarMessage(msg, type = 'info') {
    if (typeof window.showMessage === 'function') {
        window.showMessage(msg, type);
    } else {
        console.log(msg);
    }
}

// Helper to show error messages
function showErrorMessage(msg) {
    if (typeof window.showMessage === 'function') {
        window.showMessage(msg, 'error');
    } else {
        alert(msg);
    }
}