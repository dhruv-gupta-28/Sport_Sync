/**
 * API utility module for making authenticated requests to the backend
 */

const API_URL = '/api';

// Error handling utility
function handleApiError(error, defaultMessage = 'An unexpected error occurred') {
    console.error('API Error:', error);
    
    if (error.response) {
        // Server responded with an error status
        return {
            success: false,
            status: error.response.status,
            message: error.response.data?.error?.message || defaultMessage,
            type: error.response.data?.error?.type || 'UnknownError'
        };
    } else if (error.request) {
        // Request was made but no response received
        return {
            success: false,
            status: 0,
            message: 'No response from server. Please check your internet connection.',
            type: 'NetworkError'
        };
    } else {
        // Something else happened while setting up the request
        return {
            success: false,
            status: 0,
            message: defaultMessage,
            type: 'ClientError'
        };
    }
}

// Handle token expiration and refresh
async function handleTokenExpiration(response, retryFn) {
    let data;
    try {
        data = await response.json();
    } catch (error) {
        console.error('Error parsing response:', error);
        return { 
            success: false, 
            status: response.status, 
            data: { error: { message: 'Invalid response format' } } 
        };
    }
    
    // Check if the error is due to token expiration
    if (response.status === 401 && 
        (data?.error?.message?.includes('expired') || 
         data?.error?.message?.includes('Token is not valid'))) {
        
        console.log('Token expired, attempting to refresh...');
        const refreshResult = await refreshToken();
        
        if (refreshResult.success) {
            console.log('Token refreshed successfully, retrying original request');
            // Retry the original request with the new token
            return await retryFn();
        } else {
            console.warn('Token refresh failed, user needs to re-authenticate');
            // Clear any stored authentication data
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            
            // If we're on a page that requires authentication, redirect to login
            if (window.location.pathname !== '/pages/login.html') {
                // Store the current URL to redirect back after login
                sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
                window.location.href = '/pages/login.html';
            }
        }
    }
    
    return { success: response.ok, status: response.status, data, headers: response.headers };
}

// Get authentication token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Check if user is authenticated
function isAuthenticated() {
    return getAuthToken() !== null;
}

// Add authentication headers to request options
function addAuthHeaders(options = {}) {
    const token = getAuthToken();
    
    if (!token) return options;
    
    const headers = options.headers || {};
    
    return {
        ...options,
        headers: {
            ...headers,
            'x-auth-token': token
        }
    };
}

// API request methods
async function get(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, addAuthHeaders(options));
        
        // Handle token expiration if needed
        if (response.status === 401) {
            return await handleTokenExpiration(response, () => get(endpoint, options));
        }
        
        const data = await response.json();
        return {
            success: response.ok,
            status: response.status,
            data,
            headers: response.headers
        };
    } catch (error) {
        return handleApiError(error);
    }
}

async function post(endpoint, body, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, addAuthHeaders({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(body),
            ...options
        }));
        
        // Handle token expiration if needed
        if (response.status === 401) {
            return await handleTokenExpiration(response, () => post(endpoint, body, options));
        }
        
        const data = await response.json();
        return {
            success: response.ok,
            status: response.status,
            data,
            headers: response.headers
        };
    } catch (error) {
        return handleApiError(error);
    }
}

async function put(endpoint, body, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, addAuthHeaders({
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify(body),
            ...options
        }));
        
        // Handle token expiration if needed
        if (response.status === 401) {
            return await handleTokenExpiration(response, () => put(endpoint, body, options));
        }
        
        const data = await response.json();
        return {
            success: response.ok,
            status: response.status,
            data,
            headers: response.headers
        };
    } catch (error) {
        return handleApiError(error);
    }
}

async function del(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, addAuthHeaders({
            method: 'DELETE',
            ...options
        }));
        
        // Handle token expiration if needed
        if (response.status === 401) {
            return await handleTokenExpiration(response, () => del(endpoint, options));
        }
        
        const data = await response.json();
        return {
            success: response.ok,
            status: response.status,
            data,
            headers: response.headers
        };
    } catch (error) {
        return handleApiError(error);
    }
}

// Auth-specific API methods
async function login(email, password) {
    const result = await post('/auth/login', { email, password });
    
    if (result.success) {
        // Store token and user type
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('userType', result.data.userType);
        
        // Check for token in headers as well
        const headerToken = result.headers.get('x-auth-token');
        if (headerToken) {
            localStorage.setItem('token', headerToken);
        }
    }
    
    return result;
}

async function register(userData) {
    return await post('/auth/register', userData);
}

async function logout() {
    const result = await post('/auth/logout', {});
    
    // Clear local storage regardless of API response
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    
    return result;
}

async function refreshToken() {
    const result = await get('/auth/refresh');
    
    if (result.success) {
        // Update token if provided in headers
        const newToken = result.headers.get('x-auth-token');
        if (newToken) {
            localStorage.setItem('token', newToken);
        }
    }
    
    return result;
}

// Match-specific API methods
async function getMatches(filters = {}) {
    // Convert filters object to query string
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
            queryParams.append(key, value);
        }
    });
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    return await get(`/matches${queryString}`);
}

async function getMatchById(matchId) {
    return await get(`/matches/${matchId}`);
}

async function createMatch(matchData) {
    return await post('/matches', matchData);
}

async function updateMatch(matchId, matchData) {
    return await put(`/matches/${matchId}`, matchData);
}

async function joinMatch(matchId) {
    return await put(`/matches/${matchId}/join`, {});
}

async function leaveMatch(matchId) {
    return await put(`/matches/${matchId}/leave`, {});
}

// User-specific API methods
async function getCurrentUser() {
    return await get('/users/me');
}

async function updateUserProfile(userData) {
    return await put('/users/me', userData);
}

// Chatbot API methods
async function sendChatMessage(message, history = []) {
    return await post('/gemini/chat', { message, history });
}

// OAuth login function
function oauthLogin(provider) {
    if (!['google', 'facebook', 'apple'].includes(provider)) {
        console.error('Invalid OAuth provider:', provider);
        return false;
    }
    
    // Redirect to the OAuth provider's authentication page
    window.location.href = `${API_URL}/auth/${provider}`;
    return true;
}

// Export all API methods
window.api = {
    // Auth methods
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated,
    getAuthToken,
    oauthLogin,
    
    // Match methods
    getMatches,
    getMatchById,
    createMatch,
    updateMatch,
    joinMatch,
    leaveMatch,
    
    // User methods
    getCurrentUser,
    updateUserProfile,
    
    // Chatbot methods
    sendChatMessage,
    
    // Base request methods
    get,
    post,
    put,
    delete: del
};