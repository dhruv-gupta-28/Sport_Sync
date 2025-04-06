document.addEventListener('DOMContentLoaded', function() {
    // Step navigation functionality
    const steps = document.querySelectorAll('.step');
    const stepContents = document.querySelectorAll('.step-content');
    const nextBtns = document.querySelectorAll('.next-btn');
    const prevBtns = document.querySelectorAll('.prev-btn');
    const userTypeCards = document.querySelectorAll('.user-type-card');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    const signupForm = document.getElementById('signup-form');
    
    // Password strength checker
    function checkPasswordStrength(password) {
        let strength = 0;
        
        // Length check
        if (password.length >= 8) {
            strength += 1;
        }
        
        // Uppercase check
        if (/[A-Z]/.test(password)) {
            strength += 1;
        }
        
        // Lowercase check
        if (/[a-z]/.test(password)) {
            strength += 1;
        }
        
        // Number check
        if (/[0-9]/.test(password)) {
            strength += 1;
        }
        
        // Special character check
        if (/[^A-Za-z0-9]/.test(password)) {
            strength += 1;
        }
        
        return strength;
    }
    
    // Update password strength indicator
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = checkPasswordStrength(password);
            
            // Update strength bar width and color
            let width = (strength / 5) * 100;
            strengthBar.style.width = `${width}%`;
            
            // Update color based on strength
            if (strength <= 1) {
                strengthBar.style.backgroundColor = '#ef4444'; // Weak (red)
                strengthText.textContent = 'Weak password';
                strengthText.style.color = '#ef4444';
            } else if (strength <= 3) {
                strengthBar.style.backgroundColor = '#f59e0b'; // Medium (orange)
                strengthText.textContent = 'Medium password';
                strengthText.style.color = '#f59e0b';
            } else {
                strengthBar.style.backgroundColor = '#10b981'; // Strong (green)
                strengthText.textContent = 'Strong password';
                strengthText.style.color = '#10b981';
            }
        });
    }
    
    // User type card selection
    userTypeCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            userTypeCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked card
            this.classList.add('selected');
            
            // Check the radio button
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
        });
    });
    
    // Next button click handler
    nextBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Get current step
            const currentStepContent = this.closest('.step-content');
            const currentStep = parseInt(currentStepContent.id.split('-')[1]);
            
            // Validate current step
            if (currentStep === 1) {
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                
                if (!name || !email || !password || !confirmPassword) {
                    showNotification('Please fill in all fields', 'error');
                    return;
                }
                
                if (password !== confirmPassword) {
                    showNotification('Passwords do not match', 'error');
                    return;
                }
                
                if (checkPasswordStrength(password) <= 1) {
                    showNotification('Please use a stronger password', 'warning');
                    return;
                }
            }
            
            // Move to next step
            const nextStep = currentStep + 1;
            
            // Hide current step content
            currentStepContent.classList.remove('active');
            currentStepContent.classList.add('hidden');
            
            // Show next step content with animation
            const nextStepContent = document.getElementById(`step-${nextStep}`);
            nextStepContent.classList.remove('hidden');
            nextStepContent.classList.add('active');
            nextStepContent.style.animation = 'slideInRight var(--animation-duration) ease-out';
            
            // Update step indicators
            steps.forEach(step => {
                const stepNum = parseInt(step.getAttribute('data-step'));
                
                if (stepNum === currentStep) {
                    step.classList.remove('active');
                    step.classList.add('completed');
                } else if (stepNum === nextStep) {
                    step.classList.add('active');
                }
            });
        });
    });
    
    // Previous button click handler
    prevBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Get current step
            const currentStepContent = this.closest('.step-content');
            const currentStep = parseInt(currentStepContent.id.split('-')[1]);
            
            // Move to previous step
            const prevStep = currentStep - 1;
            
            // Hide current step content
            currentStepContent.classList.remove('active');
            currentStepContent.classList.add('hidden');
            
            // Show previous step content with animation
            const prevStepContent = document.getElementById(`step-${prevStep}`);
            prevStepContent.classList.remove('hidden');
            prevStepContent.classList.add('active');
            prevStepContent.style.animation = 'slideInLeft var(--animation-duration) ease-out';
            
            // Update step indicators
            steps.forEach(step => {
                const stepNum = parseInt(step.getAttribute('data-step'));
                
                if (stepNum === currentStep) {
                    step.classList.remove('active');
                } else if (stepNum === prevStep) {
                    step.classList.remove('completed');
                    step.classList.add('active');
                }
            });
        });
    });
    
    // Form submission
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const userType = document.querySelector('input[name="user-type"]:checked').value;
            const termsAccepted = document.getElementById('terms').checked;
            const newsletterSubscribed = document.getElementById('newsletter').checked;
            
            // Get selected sports preferences
            const sportsCheckboxes = document.querySelectorAll('input[name="sports"]:checked');
            const sportsPreferences = Array.from(sportsCheckboxes).map(checkbox => checkbox.value);
            
            // Validate form
            if (!name || !email || !password) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            if (!termsAccepted) {
                showNotification('Please accept the terms and conditions', 'error');
                return;
            }
            
            // Prepare data for API call
            const userData = {
                name,
                email,
                password,
                userType,
                sportsPreferences,
                newsletterSubscribed
            };
            
            // Show loading state
            const submitBtn = document.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            submitBtn.disabled = true;
            
            // Simulate API call - In a real app, this would be an API call
            setTimeout(() => {
                // Reset button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Show success message
                showNotification('Account created successfully! Redirecting to login...', 'success');
                
                // Redirect to login page after a delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }, 1500);
        });
    }
    
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
    
    // Notification function
    window.showNotification = function(message, type = 'info') {
        // Check if notification container exists
        let notificationContainer = document.querySelector('.notification-container');
        
        // Create container if it doesn't exist
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Add icon based on type
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<i class="fas fa-check-circle"></i>';
                break;
            case 'error':
                icon = '<i class="fas fa-times-circle"></i>';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle"></i>';
                break;
            default:
                icon = '<i class="fas fa-info-circle"></i>';
        }
        
        // Set notification content
        notification.innerHTML = `
            ${icon}
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Add close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', function() {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 5000);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
    };
    
    // Add notification styles if not already present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .notification {
                display: flex;
                align-items: center;
                padding: 12px 15px;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transform: translateX(120%);
                opacity: 0;
                transition: transform 0.3s ease, opacity 0.3s ease;
                max-width: 350px;
            }
            
            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .notification.fade-out {
                transform: translateX(120%);
                opacity: 0;
            }
            
            .notification i {
                margin-right: 10px;
                font-size: 1.2rem;
            }
            
            .notification span {
                flex: 1;
            }
            
            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                color: #6b7280;
                padding: 0;
                margin-left: 10px;
            }
            
            .notification.success i:first-child {
                color: var(--success-color);
            }
            
            .notification.error i:first-child {
                color: var(--danger-color);
            }
            
            .notification.warning i:first-child {
                color: var(--warning-color);
            }
            
            .notification.info i:first-child {
                color: var(--primary-color);
            }
        `;
        document.head.appendChild(style);
    }
});