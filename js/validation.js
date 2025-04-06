/**
 * Validation utility module for client-side form validation
 */

const validation = {
    // Email validation
    email: function(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return {
            valid: re.test(String(email).toLowerCase()),
            message: 'Please enter a valid email address'
        };
    },
    
    // Enhanced password validation (min 6 chars, checks for complexity)
    password: function(password, options = {}) {
        // Default minimum length is 6
        const minLength = options.minLength || 6;
        
        // Check if password exists and meets minimum length
        if (!password || password.length < minLength) {
            return {
                valid: false,
                message: `Password must be at least ${minLength} characters`
            };
        }
        
        // Check for password complexity if required
        if (options.requireComplex) {
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumbers = /[0-9]/.test(password);
            const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
            
            const complexity = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars]
                .filter(Boolean).length;
            
            if (complexity < 3) {
                return {
                    valid: false,
                    message: 'Password must contain at least 3 of the following: uppercase letters, lowercase letters, numbers, and special characters'
                };
            }
        }
        
        return {
            valid: true,
            message: ''
        };
    },
    
    // Name validation (min 2 chars)
    name: function(name) {
        return {
            valid: name && name.trim().length >= 2,
            message: 'Name must be at least 2 characters'
        };
    },
    
    // User type validation
    userType: function(userType) {
        return {
            valid: userType && ['coach', 'player', 'organizer'].includes(userType),
            message: 'Please select a valid user type'
        };
    },
    
    // Required field validation
    required: function(value, fieldName = 'This field') {
        return {
            valid: value !== undefined && value !== null && value.toString().trim() !== '',
            message: `${fieldName} is required`
        };
    },
    
    // Date validation
    date: function(date) {
        const isValid = !isNaN(new Date(date).getTime());
        return {
            valid: isValid,
            message: 'Please enter a valid date'
        };
    },
    
    // Number validation
    number: function(number, options = {}) {
        const parsed = parseFloat(number);
        let valid = !isNaN(parsed);
        let message = 'Please enter a valid number';
        
        if (valid && options.min !== undefined && parsed < options.min) {
            valid = false;
            message = `Value must be at least ${options.min}`;
        }
        
        if (valid && options.max !== undefined && parsed > options.max) {
            valid = false;
            message = `Value must be at most ${options.max}`;
        }
        
        return { valid, message };
    },
    
    // Form validation helper
    validateForm: function(formData, rules) {
        const errors = {};
        let isValid = true;
        
        Object.keys(rules).forEach(field => {
            const value = formData[field];
            const fieldRules = rules[field];
            
            for (const rule of fieldRules) {
                const result = this[rule.type](value, rule.options);
                
                if (!result.valid) {
                    errors[field] = rule.message || result.message;
                    isValid = false;
                    break;
                }
            }
        });
        
        return { isValid, errors };
    },
    
    // Show validation error on form field
    showFieldError: function(inputElement, message) {
        // Remove any existing error message
        this.clearFieldError(inputElement);
        
        // Add error class to input
        inputElement.classList.add('error');
        
        // Create and append error message
        const errorElement = document.createElement('div');
        errorElement.className = 'validation-error';
        errorElement.textContent = message;
        
        // Insert error message after input
        inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
        
        // Add event listener to clear error on input
        inputElement.addEventListener('input', () => {
            this.clearFieldError(inputElement);
        }, { once: true });
    },
    
    // Clear validation error from form field
    clearFieldError: function(inputElement) {
        // Remove error class
        inputElement.classList.remove('error');
        
        // Remove error message if it exists
        const errorElement = inputElement.nextElementSibling;
        if (errorElement && errorElement.classList.contains('validation-error')) {
            errorElement.parentNode.removeChild(errorElement);
        }
    },
    
    // Validate form and show errors
    validateFormAndShowErrors: function(formElement, rules) {
        const formData = {};
        const inputs = formElement.querySelectorAll('input, select, textarea');
        
        // Collect form data
        inputs.forEach(input => {
            if (input.name) {
                formData[input.name] = input.type === 'checkbox' ? input.checked : input.value;
            }
        });
        
        // Validate form data
        const { isValid, errors } = this.validateForm(formData, rules);
        
        // Show errors if any
        if (!isValid) {
            Object.keys(errors).forEach(field => {
                const inputElement = formElement.querySelector(`[name="${field}"]`);
                if (inputElement) {
                    this.showFieldError(inputElement, errors[field]);
                }
            });
        }
        
        return isValid;
    }
};

// Make validation available globally
window.validation = validation;