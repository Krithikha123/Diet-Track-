// Profile Management
const API_BASE_URL = 'http://localhost:3000';

// User profile state
let userProfile = {
    height: '',
    weight: '',
    age: '',
    gender: '',
    activityLevel: '',
    goal: '',
    dailyMeals: [],
    dietTypes: []
};

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Profile page loaded');

    // Check authentication
    checkAuthentication();

    // Initialize form
    initializeForm();

    // Setup event listeners
    setupEventListeners();

    // Load existing profile
    loadProfile();

    // Check for first-time refresh
    checkFirstTimeRefresh();
});

// Check if page needs to be refreshed (first time visit)
function checkFirstTimeRefresh() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.username) return;

    const refreshKey = `profile_refreshed_${user.username}`;
    const hasRefreshed = localStorage.getItem(refreshKey);

    if (!hasRefreshed) {
        console.log('🔄 First time profile visit: Refreshing page...');
        localStorage.setItem(refreshKey, 'true');
        window.location.reload();
    }
}

// Check if user is logged in
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        showMessage('Please login to access profile', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return false;
    }

    try {
        const userData = JSON.parse(user);
        console.log('Logged in as:', userData.username);
        return true;
    } catch (error) {
        console.error('Error parsing user data:', error);
        window.location.href = 'login.html';
        return false;
    }
}

// Initialize form with default values
function initializeForm() {
    // Set default radio button if none selected
    setTimeout(() => {
        const genderRadios = document.querySelectorAll('input[name="gender"]');
        const goalRadios = document.querySelectorAll('input[name="goal"]');
        const activityRadios = document.querySelectorAll('input[name="activityLevel"]');

        if (genderRadios.length > 0 && !document.querySelector('input[name="gender"]:checked')) {
            genderRadios[0].checked = true;
        }

        if (goalRadios.length > 0 && !document.querySelector('input[name="goal"]:checked')) {
            goalRadios[0].checked = true;
        }

        if (activityRadios.length > 0 && !document.querySelector('input[name="activityLevel"]:checked')) {
            activityRadios[0].checked = true;
        }
    }, 100);
}

// Setup all event listeners
function setupEventListeners() {
    // Handle form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }

    // Add click handlers for diet type cards
    document.querySelectorAll('.diet-type-card').forEach(card => {
        card.addEventListener('click', function (e) {
            if (!e.target.matches('input[type="checkbox"]')) {
                const checkbox = this.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                updateDietTypeUI(checkbox);
            }
        });
    });

    // Add validation for number inputs
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', validateNumberInput);
    });
}

// Handle profile form submission
async function handleProfileSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    const formData = collectFormData();

    if (!formData) {
        showMessage('Please fill all required fields correctly', 'error');
        return;
    }

    await saveProfile(formData);
}

// Validate form data
function validateForm() {
    const height = document.getElementById('height').value.trim();
    const weight = document.getElementById('weight').value.trim();
    const age = document.getElementById('age').value.trim();
    const gender = document.querySelector('input[name="gender"]:checked');
    const activityLevel = document.querySelector('input[name="activityLevel"]:checked');
    const goal = document.querySelector('input[name="goal"]:checked');
    const dailyMeals = document.querySelectorAll('input[name="dailyMeals"]:checked');
    const dietTypes = document.querySelectorAll('input[name="dietTypes"]:checked');

    // Check required fields
    if (!height || !weight || !age) {
        showMessage('Please fill in all personal information fields', 'error');
        return false;
    }

    if (!gender) {
        showMessage('Please select your gender', 'error');
        return false;
    }

    if (!activityLevel) {
        showMessage('Please select your activity level', 'error');
        return false;
    }

    if (!goal) {
        showMessage('Please select your goal', 'error');
        return false;
    }

    if (dailyMeals.length === 0) {
        showMessage('Please select at least one daily meal', 'error');
        return false;
    }

    if (dietTypes.length === 0) {
        showMessage('Please select at least one diet type', 'error');
        return false;
    }

    // Validate number ranges
    if (parseFloat(height) < 100 || parseFloat(height) > 250) {
        showMessage('Height must be between 100cm and 250cm', 'error');
        return false;
    }

    if (parseFloat(weight) < 30 || parseFloat(weight) > 300) {
        showMessage('Weight must be between 30kg and 300kg', 'error');
        return false;
    }

    if (parseInt(age) < 13 || parseInt(age) > 100) {
        showMessage('Age must be between 13 and 100', 'error');
        return false;
    }

    return true;
}

// Collect form data
function collectFormData() {
    try {
        const formData = {
            height: parseFloat(document.getElementById('height').value),
            weight: parseFloat(document.getElementById('weight').value),
            age: parseInt(document.getElementById('age').value),
            gender: document.querySelector('input[name="gender"]:checked').value,
            activityLevel: document.querySelector('input[name="activityLevel"]:checked').value,
            goal: document.querySelector('input[name="goal"]:checked').value,
            dailyMeals: Array.from(document.querySelectorAll('input[name="dailyMeals"]:checked'))
                .map(cb => cb.value),
            dietTypes: Array.from(document.querySelectorAll('input[name="dietTypes"]:checked'))
                .map(cb => cb.value)
        };

        // Store in global state
        userProfile = { ...formData };

        return formData;
    } catch (error) {
        console.error('Error collecting form data:', error);
        return null;
    }
}

// Save profile to backend
async function saveProfile(formData) {
    try {
        showMessage('Saving your profile...', 'info');

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/profile/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            // Save to localStorage for quick access
            localStorage.setItem('userProfile', JSON.stringify(formData));

            // Calculate BMI
            const bmi = calculateBMI(formData.height, formData.weight);
            localStorage.setItem('userBMI', bmi.toFixed(1));

            showMessage('✅ Profile saved successfully!', 'success');

            // Redirect to diet plan after delay
            setTimeout(() => {
                window.location.href = 'diet-plan.html';
            }, 1500);

        } else {
            const errorMsg = result.message || 'Failed to save profile';
            showMessage(`❌ ${errorMsg}`, 'error');
        }

    } catch (error) {
        console.error('Error saving profile:', error);
        showMessage('❌ Network error. Please check your connection.', 'error');
    }
}

// Load profile from backend
// Load profile from backend
async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        showMessage('Loading profile data...', 'info');

        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const profile = data.profile;

            if (profile) {
                // Populate form fields
                populateForm(profile);

                // Store in global state
                userProfile = { ...profile };

                // Save to localStorage
                localStorage.setItem('userProfile', JSON.stringify(profile));

                showMessage('✅ Profile loaded successfully', 'success', 2000);
            } else {
                console.log('No existing profile found');
            }
        } else if (response.status === 404) {
            console.log('No profile exists yet');
        } else {
            console.error('Error loading profile:', response.status);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Populate form with profile data
function populateForm(profile) {
    // Basic info
    if (profile.height) document.getElementById('height').value = profile.height;
    if (profile.weight) document.getElementById('weight').value = profile.weight;
    if (profile.age) document.getElementById('age').value = profile.age;

    // Gender radio
    if (profile.gender) {
        const genderRadio = document.querySelector(`input[name="gender"][value="${profile.gender}"]`);
        if (genderRadio) genderRadio.checked = true;
    }

    // Activity Level radio
    if (profile.activityLevel) {
        const activityRadio = document.querySelector(`input[name="activityLevel"][value="${profile.activityLevel}"]`);
        if (activityRadio) activityRadio.checked = true;
    }

    // Goal radio
    if (profile.goal) {
        const goalRadio = document.querySelector(`input[name="goal"][value="${profile.goal}"]`);
        if (goalRadio) goalRadio.checked = true;
    }

    // Daily meals checkboxes
    if (profile.dailyMeals && Array.isArray(profile.dailyMeals)) {
        profile.dailyMeals.forEach(meal => {
            const checkbox = document.querySelector(`input[name="dailyMeals"][value="${meal}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }

    // Diet types checkboxes and update UI
    if (profile.dietTypes && Array.isArray(profile.dietTypes)) {
        profile.dietTypes.forEach(diet => {
            const checkbox = document.querySelector(`input[name="dietTypes"][value="${diet}"]`);
            if (checkbox) {
                checkbox.checked = true;
                updateDietTypeUI(checkbox);
            }
        });
    }
}

// Update diet type card UI when checkbox changes
function updateDietTypeUI(checkbox) {
    const card = checkbox.closest('.diet-type-card');
    const icon = card.querySelector('.diet-icon');

    if (checkbox.checked) {
        card.style.borderColor = '#4CAF50';
        card.style.backgroundColor = '#E8F5E9';
        icon.style.backgroundColor = '#4CAF50';
        icon.style.color = 'white';
    } else {
        card.style.borderColor = '#e0e0e0';
        card.style.backgroundColor = '';
        icon.style.backgroundColor = '#f5f5f5';
        icon.style.color = '#2E7D32';
    }
}

// Validate number inputs
function validateNumberInput(e) {
    const input = e.target;
    const value = parseFloat(input.value);
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || Infinity;

    if (isNaN(value) || value < min || value > max) {
        input.style.borderColor = '#f44336';
        input.style.boxShadow = '0 0 0 2px rgba(244, 67, 54, 0.2)';
    } else {
        input.style.borderColor = '#4CAF50';
        input.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.2)';
    }
}

// Calculate BMI
function calculateBMI(height, weight) {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
}

// Show message to user
function showMessage(message, type, duration = 5000) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.user-message');
    existingMessages.forEach(msg => msg.remove());

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `user-message message-${type}`;
    messageDiv.textContent = message;

    // Add styles
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.padding = '15px 20px';
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

    // Add CSS animations
    if (!document.getElementById('message-styles')) {
        const style = document.createElement('style');
        style.id = 'message-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkAuthentication,
        validateForm,
        collectFormData,
        calculateBMI,
        showMessage
    };
}
