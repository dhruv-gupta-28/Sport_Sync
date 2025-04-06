document.addEventListener('DOMContentLoaded', function() {
    // Handle dashboard link click
    const dashboardLink = document.getElementById('dashboard-link');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', function(e) {
            e.preventDefault();
            const userType = localStorage.getItem('userType');
            const token = localStorage.getItem('token');

            if (!token) {
                showNotification('Please login first', 'error');
                return;
            }

            switch(userType) {
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
                    showNotification('Invalid user type', 'error');
            }
        });
    }

    // Tab switching functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => content.classList.add('hidden'));
            
            // Show the selected tab content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.remove('hidden');
        });
    });
    
    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Validate form using validation module
            if (window.validation) {
                const rules = {
                    email: [{ type: 'email' }, { type: 'required' }],
                    password: [{ type: 'password' }, { type: 'required' }]
                };
                
                const formData = { email, password };
                const { isValid, errors } = window.validation.validateForm(formData, rules);
                
                if (!isValid) {
                    const errorMessage = Object.values(errors)[0];
                    showNotification(errorMessage, 'error');
                    return;
                }
            } else {
                // Fallback validation if module not available
                if (!email || !password) {
                    showNotification('Please fill in all fields', 'error');
                    return;
                }
            }
            
            try {
                showNotification('Logging in...', 'info');
                
                // Use API module if available
                let result;
                if (window.api && window.api.login) {
                    result = await window.api.login(email, password);
                } else {
                    // Fallback to direct fetch if API module not available
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, password }),
                        credentials: 'include' // Include cookies in the request
                    });
                    
                    const data = await response.json();
                    result = {
                        success: response.ok,
                        data: data,
                        message: data.msg || (response.ok ? 'Login successful' : 'Login failed')
                    };
                    
                    if (response.ok) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('userType', data.userType);
                    }
                }

                if (result.success) {
                    const userType = localStorage.getItem('userType');
                    showNotification(`Login successful! Redirecting to dashboard...`, 'success');

                    // Redirect based on user type
                    setTimeout(() => {
                        switch(userType) {
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
                                showNotification('Invalid user type', 'error');
                                return;
                        }
                    }, 1500);
                } else {
                    showNotification(result.message || result.data?.msg || 'Login failed', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showNotification('An error occurred during login', 'error');
            }
        });
    }
    
    // Register form submission
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const userTypeElement = document.querySelector('input[name="user-type"]:checked');
            const userType = userTypeElement ? userTypeElement.value : '';
            const termsAccepted = document.getElementById('terms').checked;
            
            // Validate form using validation module
            if (window.validation) {
                const rules = {
                    name: [{ type: 'name' }, { type: 'required' }],
                    email: [{ type: 'email' }, { type: 'required' }],
                    password: [{ type: 'password' }, { type: 'required' }],
                    userType: [{ type: 'userType' }, { type: 'required' }],
                    termsAccepted: [{ 
                        type: 'required', 
                        options: 'Terms and conditions'
                    }]
                };
                
                const formData = { name, email, password, userType, termsAccepted };
                const { isValid, errors } = window.validation.validateForm(formData, rules);
                
                if (!isValid) {
                    const errorMessage = Object.values(errors)[0];
                    showNotification(errorMessage, 'error');
                    return;
                }
            } else {
                // Fallback validation if module not available
                if (!name || !email || !password) {
                    showNotification('Please fill in all fields', 'error');
                    return;
                }
                
                if (!userType) {
                    showNotification('Please select a user type', 'error');
                    return;
                }
                
                if (!termsAccepted) {
                    showNotification('Please accept the terms and conditions', 'error');
                    return;
                }
            }
            
            try {
                showNotification('Creating your account...', 'info');
                
                // Use API module if available
                let result;
                if (window.api && window.api.register) {
                    result = await window.api.register({ name, email, password, userType });
                } else {
                    // Fallback to direct fetch if API module not available
                    const response = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ name, email, password, userType })
                    });
                    
                    const data = await response.json();
                    result = {
                        success: response.ok,
                        data: data,
                        message: data.msg || (response.ok ? 'Registration successful' : 'Registration failed')
                    };
                }

                if (result.success) {
                    showNotification('Registration successful! Please login.', 'success');
                    // Switch to login tab
                    document.querySelector('[data-tab="login"]').click();
                    
                    // Clear form
                    registerForm.reset();
                } else {
                    showNotification(result.message || result.data?.msg || 'Registration failed', 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showNotification('An error occurred during registration', 'error');
            }
        });
    }
    
    // OAuth button clicks
    const oauthButtons = document.querySelectorAll('.oauth-btn');
    oauthButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const provider = this.classList.contains('google') ? 'google' : 
                           this.classList.contains('facebook') ? 'facebook' : 'apple';
            
            // Show notification
            showNotification(`Redirecting to ${provider} for authentication...`, 'info');
            
            // Redirect to OAuth provider
            if (window.api && window.api.oauthLogin) {
                window.api.oauthLogin(provider);
            } else {
                // Fallback if API module not available
                window.location.href = `/api/auth/${provider}`;
            }
        });
    });
    
    // Password toggle functionality
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const type = passwordInput.getAttribute('type');
            
            // Toggle password visibility
            passwordInput.setAttribute('type', type === 'password' ? 'text' : 'password');
            
            // Toggle icon
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    });

    // Helper function to show notifications
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});