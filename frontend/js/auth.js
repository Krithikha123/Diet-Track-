// Toggle between login and registration forms
document.addEventListener('DOMContentLoaded', function () {
    const showLoginBtn = document.getElementById('show-login');
    const showRegisterBtn = document.getElementById('show-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('registration-form');

    if (showLoginBtn && showRegisterBtn) {
        showLoginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        });

        showRegisterBtn.addEventListener('click', function (e) {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        });
    }

    // Handle registration form submission
    const registerFormElement = document.getElementById('registerForm');
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', async function (e) {
            e.preventDefault();

            const userData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            };

            // Password validation
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
            const passwordInput = document.getElementById('password');
            if (!passwordRegex.test(userData.password)) {
                passwordInput.setCustomValidity('Password must contain at least 6 characters, including both letters and numbers');
                passwordInput.reportValidity();

                // Add listener to clear error on input
                passwordInput.addEventListener('input', function () {
                    this.setCustomValidity('');
                }, { once: true });
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                const result = await response.json();

                if (response.ok) {
                    showMessage('Account created successfully! Please sign in.', 'success');
                    // Switch to login form
                    loginForm.style.display = 'block';
                    registerForm.style.display = 'none';
                } else {
                    showMessage(result.message || 'Registration failed', 'error');
                }
            } catch (error) {
                showMessage('Network error. Please try again.', 'error');
            }
        });
    }

    // Handle login form submission
    const loginFormElement = document.getElementById('loginForm');
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', async function (e) {
            e.preventDefault();

            const loginData = {
                username: document.getElementById('login-username').value,
                password: document.getElementById('login-password').value
            };

            try {
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });

                const result = await response.json();

                if (response.ok) {
                    // Save token to localStorage
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    showMessage(result.message || 'Login failed', 'error');
                }
            } catch (error) {
                showMessage('Network error. Please try again.', 'error');
            }
        });
    }

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token && !window.location.href.includes('login.html')) {
        // User is logged in, redirect to dashboard if on login page
        if (window.location.href.includes('login.html')) {
            window.location.href = 'dashboard.html';
        }
    }

    // Handle logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            // Clear ALL user data
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    // Global logout function
    window.logout = function () {
        localStorage.clear();
        window.location.href = 'index.html';
    };
});

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.style.color = type === 'success' ? '#2E7D32' : '#D32F2F';
        messageDiv.style.padding = '10px';
        messageDiv.style.borderRadius = '4px';
        messageDiv.style.backgroundColor = type === 'success' ? '#E8F5E9' : '#FFEBEE';

        // Clear message after 5 seconds
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.style.backgroundColor = '';
        }, 5000);
    }
}