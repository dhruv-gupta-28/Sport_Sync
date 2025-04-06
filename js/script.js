document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const NOTIFICATION_DURATION = 5000;
    const REDIRECT_DELAY = 1500;
    const DEFAULT_MAP_CENTER = { lat: 40.7128, lng: -74.0060 };
    const MAP_STYLES = [
        {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
        }
    ];
    const ANIMATION_DELAY = 300;
    
    // Check if token exists and validate on page load
    const token = localStorage.getItem('token');
    if (token) {
        validateToken();
    }
    
    // Function to validate token
    async function validateToken() {
        try {
            const result = await window.api.refreshToken();
            if (!result.success) {
                // Token is invalid, clear it
                localStorage.removeItem('token');
                localStorage.removeItem('userType');
            }
        } catch (error) {
            console.error('Token validation error:', error);
        }
    }

    // Hamburger menu functionality
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            // Toggle active class for animation
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
    
    // Close mobile menu when clicking on a link
    const navItems = document.querySelectorAll('.nav-links li a');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (hamburger && hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    });
    
    // Dashboard sidebar toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Dashboard navigation
    const sidebarLinks = document.querySelectorAll('.sidebar-nav li a');
    const contentSections = document.querySelectorAll('.content-section');
    
    if (sidebarLinks.length > 0 && contentSections.length > 0) {
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all links
                sidebarLinks.forEach(l => {
                    l.parentElement.classList.remove('active');
                });
                
                // Add active class to clicked link
                this.parentElement.classList.add('active');
                
                // Hide all content sections
                contentSections.forEach(section => {
                    section.classList.remove('active');
                });
                
                // Show the selected content section
                const targetId = this.getAttribute('href');
                document.querySelector(targetId).classList.add('active');
            });
        });
    }
    
    // Enhanced notification system
    const notificationQueue = [];
    let isNotificationActive = false;
    
    // Show notification function
    function showNotification(message, type = 'info') {
        // Add to queue
        notificationQueue.push({ message, type });
        
        // Process queue if not already processing
        if (!isNotificationActive) {
            processNotificationQueue();
        }
    }
    
    // Process notification queue function
    function processNotificationQueue() {
        if (notificationQueue.length === 0) {
            isNotificationActive = false;
            return;
        }
        
        isNotificationActive = true;
        const { message, type } = notificationQueue.shift();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-exclamation-circle' : 
                          type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('active');
        }, ANIMATION_DELAY);
        
        setTimeout(() => {
            notification.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(notification);
                processNotificationQueue();
            }, ANIMATION_DELAY);
        }, NOTIFICATION_DURATION);
    }
    
    // Make showNotification available globally
    window.showNotification = showNotification;

    // Login function using API module
    window.loginUser = async function(email, password) {
        // Client-side validation
        if (!email || !validateEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return false;
        }
        
        if (!password || password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return false;
        }
        
        showNotification('Logging in...', 'info');
        
        try {
            const result = await window.api.login(email, password);
            
            if (result.success) {
                const userType = localStorage.getItem('userType');
                showNotification(`Login successful! Redirecting to ${userType.charAt(0).toUpperCase() + userType.slice(1)} Dashboard...`, 'success');
                
                // Redirect based on user type
                setTimeout(() => {
                    switch(userType) {
                        case 'coach':
                            window.location.href = 'pages/coach-dashboard.html';
                            break;
                        case 'organizer':
                            window.location.href = 'pages/organizer-dashboard.html';
                            break;
                        case 'player':
                            window.location.href = 'pages/player-dashboard.html';
                            break;
                        default:
                            window.location.href = 'index.html';
                    }
                }, REDIRECT_DELAY);
                return true;
            } else {
                showNotification(result.message || 'Login failed. Please check your credentials.', 'error');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('An error occurred during login. Please try again.', 'error');
            return false;
        }
    };
    
    // Keep simulateLogin for backward compatibility
    window.simulateLogin = window.loginUser;

    // Registration function using API module
    window.registerUser = async function(name, email, password, userType) {
        // Client-side validation
        if (!name || name.trim().length < 2) {
            showNotification('Name must be at least 2 characters', 'error');
            return false;
        }
        
        if (!email || !validateEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return false;
        }
        
        if (!password || password.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return false;
        }
        
        if (!userType || !['coach', 'player', 'organizer'].includes(userType)) {
            showNotification('Please select a valid user type', 'error');
            return false;
        }
        
        showNotification('Creating your account...', 'info');
        
        try {
            const result = await window.api.register({ name, email, password, userType });
            
            if (result.success) {
                showNotification('Registration successful! You can now log in.', 'success');
                
                // Switch to login tab
                setTimeout(() => {
                    const loginTabBtn = document.querySelector('[data-tab="login"]');
                    if (loginTabBtn) {
                        loginTabBtn.click();
                    }
                }, REDIRECT_DELAY);
                return true;
            } else {
                showNotification(result.message || 'Registration failed. Please try again.', 'error');
                return false;
            }
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('An error occurred during registration. Please try again.', 'error');
            return false;
        }
    };
    
    // Keep simulateRegistration for backward compatibility
    window.simulateRegistration = window.registerUser;

    // OAuth login function
    window.oauthLogin = function(provider) {
        if (!['google', 'facebook', 'apple'].includes(provider)) {
            showNotification('Invalid authentication provider', 'error');
            return;
        }
        
        showNotification(`Redirecting to ${provider} for authentication...`, 'info');
        
        // Redirect to the OAuth provider's authentication page
        window.location.href = `/api/auth/${provider}`;
    };
    
    // Function to handle OAuth callback success
    window.handleOAuthSuccess = function() {
        // Check if we're on the auth success page
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const userType = urlParams.get('userType');
        
        if (token && userType) {
            // Store token and user type
            localStorage.setItem('token', token);
            localStorage.setItem('userType', userType);
            
            showNotification('Authentication successful! Redirecting...', 'success');
            
            // Redirect based on user type
            setTimeout(() => {
                switch(userType) {
                    case 'coach':
                        window.location.href = '/pages/coach-dashboard.html';
                        break;
                    case 'organizer':
                        window.location.href = '/pages/organizer-dashboard.html';
                        break;
                    case 'player':
                    default:
                        window.location.href = '/pages/player-dashboard.html';
                }
            }, REDIRECT_DELAY);
        }
    };
    
    // Check for OAuth callback on page load
    if (window.location.pathname.includes('auth-success')) {
        handleOAuthSuccess();
    }
    
    // Keep simulateOAuthLogin for backward compatibility
    window.simulateOAuthLogin = function(provider) {
        oauthLogin(provider);
    };
    
    // Email validation helper function
    function validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
});

// Function to initialize Google Maps
// Enhanced Map initialization with API data
function initMap() {
    try {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;
        
        const map = new google.maps.Map(mapContainer, {
            center: DEFAULT_MAP_CENTER,
            zoom: 12,
            styles: MAP_STYLES
        });
        
        // Create an info window to share between markers
        const infoWindow = new google.maps.InfoWindow();
        const markers = [];
        
        // Fetch matches from API
        fetchMatches(map, infoWindow, markers);
        
        // Add filter controls if they exist
        const filterForm = document.getElementById('map-filter-form');
        if (filterForm) {
            filterForm.addEventListener('submit', function(e) {
                e.preventDefault();
                // Clear existing markers
                markers.forEach(marker => marker.setMap(null));
                markers.length = 0;
                
                // Get filter values
                const sport = document.getElementById('filter-sport')?.value || 'all';
                const skillLevel = document.getElementById('filter-skill')?.value || 'all';
                const date = document.getElementById('filter-date')?.value || 'all';
                
                // Fetch filtered matches
                fetchMatches(map, infoWindow, markers, { sport, skillLevel, date });
            });
        }
        
        // Function to fetch matches from API
        async function fetchMatches(map, infoWindow, markers, filters = {}) {
            try {
                showNotification('Loading matches...', 'info');
                
                // Build query string from filters
                const queryParams = new URLSearchParams();
                Object.entries(filters).forEach(([key, value]) => {
                    if (value && value !== 'all') {
                        queryParams.append(key, value);
                    }
                });
                
                // Add location if available
                if (map.getCenter()) {
                    const center = map.getCenter();
                    queryParams.append('lat', center.lat());
                    queryParams.append('lng', center.lng());
                    queryParams.append('distance', 10); // 10 miles radius
                }
                
                const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
                
                // Fetch matches from API
                const response = await fetch(`/api/matches${queryString}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch matches');
                }
                
                const matches = await response.json();
                
                if (matches.length === 0) {
                    showNotification('No matches found with the selected filters', 'info');
                    return;
                }
                
                // Add markers for each match
                matches.forEach(match => {
                    try {
                        // Format date
                        const matchDate = new Date(match.date);
                        const formattedDate = matchDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        // Create marker
                        const marker = new google.maps.Marker({
                            position: {
                                lat: match.location.coordinates[1], // MongoDB stores as [lng, lat]
                                lng: match.location.coordinates[0]
                            },
                            map: map,
                            title: match.title,
                            animation: google.maps.Animation.DROP
                        });
                        
                        markers.push(marker);
                        
                        // Add click listener
                        marker.addListener('click', () => {
                            infoWindow.setContent(`
                                <div class="map-info-window">
                                    <h3>${match.title}</h3>
                                    <p>${formattedDate}</p>
                                    <p>${match.location.address}</p>
                                    <p>Sport: ${match.sport} | Skill Level: ${match.skillLevel}</p>
                                    <p>Spots Available: ${match.spotsAvailable}</p>
                                    <button class="btn primary-btn map-btn" data-match-id="${match._id}">Join Match</button>
                                </div>
                            `);
                            infoWindow.open(map, marker);
                            
                            // Add event listener to join button
                            setTimeout(() => {
                                const joinBtn = document.querySelector('.map-btn');
                                if (joinBtn) {
                                    joinBtn.addEventListener('click', function() {
                                        const matchId = this.getAttribute('data-match-id');
                                        joinMatch(matchId);
                                    });
                                }
                            }, 100);
                        });
                    } catch (markerError) {
                        console.error('Error creating marker:', markerError);
                    }
                });
                
                // Fit map to markers if there are any
                if (markers.length > 0) {
                    const bounds = new google.maps.LatLngBounds();
                    markers.forEach(marker => bounds.extend(marker.getPosition()));
                    map.fitBounds(bounds);
                    
                    // Don't zoom in too far
                    const listener = google.maps.event.addListener(map, 'idle', function() {
                        if (map.getZoom() > 15) map.setZoom(15);
                        google.maps.event.removeListener(listener);
                    });
                }
                
                showNotification(`Found ${matches.length} matches`, 'success');
            } catch (error) {
                console.error('Error fetching matches:', error);
                showNotification('Failed to load matches. Please try again.', 'error');
            }
        }
        
        // Function to join a match
        async function joinMatch(matchId) {
            try {
                // Check if user is logged in
                const token = localStorage.getItem('token');
                if (!token) {
                    showNotification('Please log in to join matches', 'warning');
                    setTimeout(() => {
                        window.location.href = '/pages/login.html';
                    }, REDIRECT_DELAY);
                    return;
                }
                
                showNotification('Joining match...', 'info');
                
                const response = await fetch(`/api/matches/${matchId}/join`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    }
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showNotification('Successfully joined match!', 'success');
                    infoWindow.close();
                } else {
                    showNotification(data.error?.message || 'Failed to join match', 'error');
                }
            } catch (error) {
                console.error('Error joining match:', error);
                showNotification('An error occurred while joining the match', 'error');
            }
        }
        
        const searchInput = document.getElementById('location-search');
        if (searchInput) {
            try {
                const autocomplete = new google.maps.places.Autocomplete(searchInput);
                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (!place.geometry) {
                        showNotification('Location not found', 'warning');
                        return;
                    }
                    
                    map.setCenter(place.geometry.location);
                    map.setZoom(14);
                    
                    new google.maps.Marker({
                        position: place.geometry.location,
                        map: map,
                        title: place.name,
                        animation: google.maps.Animation.DROP
                    });
                });
            } catch (searchError) {
                console.error('Error initializing search:', searchError);
                showNotification('Search functionality unavailable', 'error');
            }
        }
    } catch (mapError) {
        console.error('Error initializing map:', mapError);
        showNotification('Unable to load the map', 'error');
    }
}