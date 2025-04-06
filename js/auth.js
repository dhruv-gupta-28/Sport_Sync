// Handle user authentication and session management

const API_URL = '/api';

// Function to handle user login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Form validation
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    try {
        // Use the API utility for better error handling
        const result = await api.login(email, password);
        
        if (result.success) {
            // Redirect based on user type
            switch(result.data.userType) {
                case 'coach':
                    window.location.href = '/pages/coach-dashboard.html';
                    break;
                case 'player':
                    window.location.href = '/pages/player-dashboard.html';
                    break;
                case 'organizer':
                    window.location.href = '/pages/organizer-dashboard.html';
                    break;
                default:
                    window.location.href = '/';
            }
        } else {
            showError(result.data?.error?.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred during login');
    }
}

// Function to handle user registration
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const passwordConfirm = document.getElementById('reg-password-confirm')?.value;
    const userType = document.querySelector('input[name="user-type"]:checked')?.value;
    
    // Form validation
    if (!name || !email || !password || !userType) {
        showError('Please fill in all required fields');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    // Password validation
    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }
    
    // Password confirmation validation (if field exists)
    if (passwordConfirm && password !== passwordConfirm) {
        showError('Passwords do not match');
        return;
    }
    
    try {
        // Use the API utility for better error handling
        const userData = { name, email, password, userType };
        const result = await api.register(userData);
        
        if (result.success) {
            // Show success message and switch to login tab
            showSuccess('Registration successful! Please login.');
            switchTab('login');
        } else {
            showError(result.data?.error?.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('An error occurred during registration');
    }
}

// Function to check authentication status
async function checkAuth() {
    if (!api.isAuthenticated()) {
        return false;
    }
    
    // Check if token is valid and not expired
    try {
        // Try to decode the token to check expiration
        const token = localStorage.getItem('token');
        if (!token) return false;
        
        // Parse the JWT to check expiration
        // JWT format: header.payload.signature
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiration = payload.exp * 1000; // Convert to milliseconds
        
        // If token is expired, remove it and return false
        if (Date.now() >= expiration) {
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            return false;
        }
        
        // If token will expire soon (less than a day), try to refresh it
        const oneDayFromNow = Date.now() + (24 * 60 * 60 * 1000);
        if (expiration < oneDayFromNow) {
            const refreshResult = await api.refreshToken();
            if (!refreshResult.success) {
                // Token refresh failed, user needs to login again
                logout();
                return false;
            }
        }
        
        // Get current user info to verify authentication
        const userResult = await api.getCurrentUser();
        return userResult.success;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}

// Function to refresh the authentication token
async function refreshToken() {
    try {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) {
            console.warn('Token refresh failed: No token found in localStorage');
            return false;
        }
        
        // Use the API utility for better error handling
        return await api.refreshToken();
    } catch (error) {
        console.error('Token refresh error:', error);
        return {
            success: false,
            error: {
                message: 'Failed to refresh authentication token',
                details: error.message
            }
        };
    }
}

// Function to handle logout
async function logout() {
    try {
        // Call the logout API endpoint
        await api.logout();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Always redirect to login page, even if API call fails
        window.location.href = '/pages/login.html';
    }
}

// UI Helper functions
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const form = document.querySelector('.active-form');
    form.insertBefore(errorDiv, form.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    const form = document.querySelector('.active-form');
    form.insertBefore(successDiv, form.firstChild);
    
    setTimeout(() => successDiv.remove(), 5000);
}

function switchTab(tabName) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginBtn = document.querySelector('[data-tab="login"]');
    const registerBtn = document.querySelector('[data-tab="register"]');
    
    if (tabName === 'login') {
        loginTab.classList.remove('hidden');
        registerTab.classList.add('hidden');
        loginBtn.classList.add('active');
        registerBtn.classList.remove('active');
    } else {
        registerTab.classList.remove('hidden');
        loginTab.classList.add('hidden');
        registerBtn.classList.add('active');
        loginBtn.classList.remove('active');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
    
    // Handle password visibility toggle
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const input = e.target.closest('.password-input').querySelector('input');
            const icon = e.target.closest('.password-toggle').querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
});