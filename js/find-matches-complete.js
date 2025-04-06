// Find Matches Page JavaScript

// Global variables
let map;
let markers = [];
let matches = [];
let currentInfoWindow = null;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for filters
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    const resetFiltersBtn = document.getElementById('reset-filters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // Set up event listener for search button
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchLocation);
    }
    
    // Set up event listeners for match items
    setupMatchItemListeners();
    
    // Fetch initial matches data
    fetchMatches();
});

// Function to initialize Google Maps
function initMap() {
    // Check if the map container exists
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    
    // Create a new map centered on a default location (New York)
    map = new google.maps.Map(mapContainer, {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 12,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
    
    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Center map on user's location
                map.setCenter(userLocation);
                
                // Add a marker for user's location
                new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: 'Your Location',
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#4285F4',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2
                    }
                });
                
                // Fetch matches near user's location
                fetchMatchesByLocation(userLocation.lat, userLocation.lng);
            },
            () => {
                // If geolocation fails, fetch all matches
                fetchMatches();
            }
        );
    } else {
        // Browser doesn't support geolocation
        fetchMatches();
    }
    
    // Add search functionality
    const searchInput = document.getElementById('location-search');
    if (searchInput && google.maps.places) {
        const autocomplete = new google.maps.places.Autocomplete(searchInput);
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) return;
            
            // Center map on the selected place
            map.setCenter(place.geometry.location);
            map.setZoom(14);
            
            // Fetch matches near the selected location
            fetchMatchesByLocation(
                place.geometry.location.lat(),
                place.geometry.location.lng()
            );
        });
    }
}

// Function to fetch all matches
async function fetchMatches() {
    try {
        const response = await fetch('/api/matches');
        if (!response.ok) {
            throw new Error('Failed to fetch matches');
        }
        
        matches = await response.json();
        displayMatches(matches);
        addMarkersToMap(matches);
    } catch (error) {
        console.error('Error fetching matches:', error);
        showNotification('Error loading matches. Please try again.', 'error');
        
        // For development/demo purposes, load dummy data if API fails
        loadDummyMatches();
    }
}

// Function to fetch matches by location
async function fetchMatchesByLocation(lat, lng) {
    try {
        const distanceFilter = document.getElementById('distance-filter');
        const distance = distanceFilter ? distanceFilter.value : 10;
        
        const response = await fetch(`/api/matches?lat=${lat}&lng=${lng}&distance=${distance}`);
        if (!response.ok) {
            throw new Error('Failed to fetch matches by location');
        }
        
        matches = await response.json();
        displayMatches(matches);
        addMarkersToMap(matches);
    } catch (error) {
        console.error('Error fetching matches by location:', error);
        showNotification('Error loading matches. Please try again.', 'error');
        
        // For development/demo purposes, load dummy data if API fails
        loadDummyMatches();
    }
}

// Function to apply filters
async function applyFilters() {
    const sportFilter = document.getElementById('sport-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    const levelFilter = document.getElementById('level-filter').value;
    const distanceFilter = document.getElementById('distance-filter').value;
    
    try {
        // Build query string based on filters
        let queryParams = [];
        
        if (sportFilter && sportFilter !== 'all') {
            queryParams.push(`sport=${sportFilter}`);
        }
        
        if (dateFilter && dateFilter !== 'all') {
            queryParams.push(`date=${dateFilter}`);
        }
        
        if (levelFilter && levelFilter !== 'all') {
            queryParams.push(`skillLevel=${levelFilter}`);
        }
        
        // Get current map center for location-based filtering
        if (map) {
            const center = map.getCenter();
            queryParams.push(`lat=${center.lat()}`);
            queryParams.push(`lng=${center.lng()}`);
            queryParams.push(`distance=${distanceFilter}`);
        }
        
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        const response = await fetch(`/api/matches${queryString}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch filtered matches');
        }
        
        matches = await response.json();
        displayMatches(matches);
        addMarkersToMap(matches);
        
        showNotification('Filters applied successfully', 'success');
    } catch (error) {
        console.error('Error applying filters:', error);
        showNotification('Error applying filters. Please try again.', 'error');
        
        // For development/demo purposes, filter dummy data if API fails
        filterDummyMatches(sportFilter, dateFilter, levelFilter);
    }
}

// Function to reset filters
function resetFilters() {
    // Reset filter dropdowns
    document.getElementById('sport-filter').value = 'all';
    document.getElementById('date-filter').value = 'all';
    document.getElementById('level-filter').value = 'all';
    document.getElementById('distance-filter').value = '10';
    
    // Fetch all matches again
    if (map) {
        const center = map.getCenter();
        fetchMatchesByLocation(center.lat(), center.lng());
    } else {
        fetchMatches();
    }
    
    showNotification('Filters have been reset', 'info');
}

// Function to search for a location
function searchLocation() {
    const searchInput = document.getElementById('location-search');
    if (!searchInput || !searchInput.value) return;
    
    // If using Google Places Autocomplete, this is handled by the autocomplete listener
    // This function is a fallback for manual searches
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchInput.value }, (results, status) => {
        if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            
            // Center map on the selected place
            map.setCenter(location);
            map.setZoom(14);
            
            // Fetch matches near the selected location
            fetchMatchesByLocation(location.lat(), location.lng());
        } else {
            showNotification('Location not found. Please try again.', 'error');
        }
    });
}

// Function to display matches in the sidebar
function displayMatches(matchesData) {
    const matchList = document.querySelector('.match-list');
    if (!matchList) return;
    
    // Clear existing matches
    matchList.innerHTML = '';
    
    if (matchesData.length === 0) {
        matchList.innerHTML = '<div class="no-matches">No matches found. Try adjusting your filters.</div>';
        return;
    }
    
    // Add each match to the list
    matchesData.forEach(match => {
        const matchDate = new Date(match.date);
        const formattedDate = matchDate.toLocaleDateString('en-US', { 
            weekday: 'long',
            hour: 'numeric',
            minute: '2-digit'
        });
        
        const matchItem = document.createElement('div');
        matchItem.className = 'match-item';
        matchItem.dataset.id = match._id;
        matchItem.dataset.lat = match.location.coordinates.lat;
        matchItem.dataset.lng = match.location.coordinates.lng;
        
        matchItem.innerHTML = `
            <div class="match-sport ${match.sport}"><i class="fas fa-${getSportIcon(match.sport)}"></i></div>
            <div class="match-info">
                <h4>${match.title}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${match.location.address}</p>
                <p><i class="fas fa-calendar"></i> ${formattedDate}</p>
                <p><i class="fas fa-users"></i> ${match.spotsAvailable} spots available</p>
                <div class="match-actions">
                    <button class="btn primary-btn join-match-btn">Join Match</button>
                    <button class="btn secondary-btn details-btn">Details</button>
                </div>
            </div>
        `;
        
        matchList.appendChild(matchItem);
    });
    
    // Re-attach event listeners to the new match items
    setupMatchItemListeners();
}

// Function to set up event listeners for match items
function setupMatchItemListeners() {
    // Add click event to match items to highlight on map
    const matchItems = document.querySelectorAll('.match-item');
    
    matchItems.forEach(item => {
        // Highlight match on map when clicked
        item.addEventListener('click', function() {
            const matchId = this.dataset.id;
            const lat = parseFloat(this.dataset.lat);
            const lng = parseFloat(this.dataset.lng);
            
            // Center map on match location
            if (map && !isNaN(lat) && !isNaN(lng)) {
                map.setCenter({ lat, lng });
                map.setZoom(15);
                
                // Find and activate the corresponding marker
                const marker = markers.find(m => m.matchId === matchId);
                if (marker) {
                    google.maps.event.trigger(marker, 'click');
                }
            }
        });
        
        // Add event listeners for buttons inside match items
        const joinBtn = item.querySelector('.join-match-btn');
        if (joinBtn) {
            joinBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent triggering the parent click event
                
                const matchId = item.dataset.id;
                joinMatch(matchId);
            });
        }
        
        const detailsBtn = item.querySelector('.details-btn');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent triggering the parent click event
                
                const matchId = item.dataset.id;
                showMatchDetails(matchId);
            });
        }
    });
}

// Function to join a match
function joinMatch(matchId) {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    
    if (!token) {
        showNotification('Please log in to join matches', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    // In a real app, this would be an API call to join the match
    showNotification('Joining match... This feature is coming soon!', 'info');
}

// Function to show match details
function showMatchDetails(matchId) {
    // Find the match in the matches array
    const match = matches.find(m => m._id === matchId);
    
    if (!match) {
        showNotification('Match details not found', 'error');
        return;
    }
    
    // In a real app, this would open a modal with match details
    // For now, just show a notification
    showNotification(`Match details for ${match.title} - Coming soon!`, 'info');
}

// Function to add markers to the map
function addMarkersToMap(matchesData) {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    // Check if map is initialized
    if (!map) return;
    
    // Add a marker for each match
    matchesData.forEach(match => {
        const marker = new google.maps.Marker({
            position: {
                lat: match.location.coordinates.lat,
                lng: match.location.coordinates.lng
            },
            map: map,
            title: match.title,
            animation: google.maps.Animation.DROP,
            matchId: match._id
        });
        
        // Add click listener to show info window
        marker.addListener('click', () => {
            // Close any open info windows
            if (currentInfoWindow) {
                currentInfoWindow.close();
            }
            
            // Create info window content
            const matchDate = new Date(match.date);
            const formattedDate = matchDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                hour: 'numeric',
                minute: '2-digit'
            });
            
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div class="map-info-window">
                        <h3>${match.title}</h3>
                        <p><i class="fas fa-map-marker-alt"></i> ${match.location.address}</p>
                        <p><i class="fas fa-calendar"></i> ${formattedDate}</p>
                        <p><i class="fas fa-users"></i> ${match.spotsAvailable} spots available</p>
                        <p>${match.description}</p>
                        <button class="btn primary-btn map-btn" onclick="joinMatch('${match._id}')">Join Match</button>
                    </div>
                `
            });
            
            // Open the info window
            infoWindow.open(map, marker);
            currentInfoWindow = infoWindow;
        });
        
        // Add marker to the markers array
        markers.push(marker);
    });
}

// Function to get the appropriate icon for each sport
function getSportIcon(sport) {
    switch (sport.toLowerCase()) {
        case 'soccer':
            return 'futbol';
        case 'basketball':
            return 'basketball-ball';
        case 'baseball':
            return 'baseball-ball';
        case 'volleyball':
            return 'volleyball-ball';
        case 'tennis':
            return 'table-tennis';
        case 'football':
            return 'football-ball';
        case 'golf':
            return 'golf-ball';
        case 'hockey':
            return 'hockey-puck';
        case 'running':
            return 'running';
        case 'swimming':
            return 'swimmer';
        case 'cycling':
            return 'bicycle';
        default:
            return 'trophy'; // Default icon
    }
}

// Function to load dummy matches for development/demo purposes
function loadDummyMatches() {
    const dummyMatches = [
        {
            _id: 'match1',
            title: 'Downtown Soccer Match',
            sport: 'soccer',
            location: {
                address: 'Central Park Field 1',
                coordinates: { lat: 40.7128, lng: -74.0060 }
            },
            date: new Date(Date.now() + 86400000), // Tomorrow
            skillLevel: 'intermediate',
            spotsAvailable: 8,
            description: 'Friendly soccer match in Central Park. All skill levels welcome!'
        },
        {
            _id: 'match2',
            title: 'Midtown Basketball Tournament',
            sport: 'basketball',
            location: {
                address: 'Midtown Courts',
                coordinates: { lat: 40.7328, lng: -73.9860 }
            },
            date: new Date(Date.now() + 172800000), // Day after tomorrow
            skillLevel: 'advanced',
            spotsAvailable: 4,
            description: 'Competitive basketball tournament. Looking for experienced players.'
        },
        {
            _id: 'match3',
            title: 'Brooklyn Baseball Game',
            sport: 'baseball',
            location: {
                address: 'Prospect Park Field',
                coordinates: { lat: 40.6928, lng: -74.0260 }
            },
            date: new Date(Date.now() + 86400000), // Tomorrow
            skillLevel: 'beginner',
            spotsAvailable: 3,
            description: 'Casual baseball game in Brooklyn. Beginners welcome!'
        },
        {
            _id: 'match4',
            title: 'Beach Volleyball Tournament',
            sport: 'volleyball',
            location: {
                address: 'Coney Island Beach',
                coordinates: { lat: 40.5728, lng: -73.9760 }
            },
            date: new Date(Date.now() + 259200000), // 3 days from now
            skillLevel: 'intermediate',
            spotsAvailable: 6,
            description: 'Beach volleyball tournament. Teams of 2-3 players.'
        },
        {
            _id: 'match5',
            title: 'Queens Tennis Match',
            sport: 'tennis',
            location: {
                address: 'Flushing Meadows Courts',
                coordinates: { lat: 40.7528, lng: -73.8460 }
            },
            date: new Date(Date.now() + 86400000), // Tomorrow
            skillLevel: 'advanced',
            spotsAvailable: 2,
            description: 'Tennis match in Queens. Looking for skilled players.'
        }
    ];
    
    // Set the matches and display them
    matches = dummyMatches;
    displayMatches(matches);
    addMarkersToMap(matches);
}

// Function to filter dummy matches (for development/demo purposes)
function filterDummyMatches(sport, dateFilter, level) {
    // Start with all dummy matches
    loadDummyMatches();
    
    // Filter by sport
    if (sport && sport !== 'all') {
        matches = matches.filter(match => match.sport === sport);
    }
    
    // Filter by date
    if (dateFilter && dateFilter !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (dateFilter) {
            case 'today':
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                matches = matches.filter(match => {
                    const matchDate = new Date(match.date);
                    return matchDate >= today && matchDate < tomorrow;
                });
                break;
            case 'tomorrow':
                const tomorrowStart = new Date(today);
                tomorrowStart.setDate(tomorrowStart.getDate() + 1);
                const dayAfterTomorrow = new Date(today);
                dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
                matches = matches.filter(match => {
                    const matchDate = new Date(match.date);
                    return matchDate >= tomorrowStart && matchDate < dayAfterTomorrow;
                });
                break;
            case 'week':
                const nextWeek = new Date(today);
                nextWeek.setDate(nextWeek.getDate() + 7);
                matches = matches.filter(match => {
                    const matchDate = new Date(match.date);
                    return matchDate >= today && matchDate < nextWeek;
                });
                break;
            case 'weekend':
                const friday = new Date(today);
                friday.setDate(friday.getDate() + (5 - friday.getDay() + 7) % 7);
                const monday = new Date(friday);
                monday.setDate(monday.getDate() + 3);
                matches = matches.filter(match => {
                    const matchDate = new Date(match.date);
                    return matchDate >= friday && matchDate < monday;
                });
                break;
            case 'month':
                const nextMonth = new Date(today);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                matches = matches.filter(match => {
                    const matchDate = new Date(match.date);
                    return matchDate >= today && matchDate < nextMonth;
                });
                break;
        }
    }
    
    // Filter by skill level
    if (level && level !== 'all') {
        matches = matches.filter(match => match.skillLevel === level);
    }
    
    // Display filtered matches
    displayMatches(matches);
    addMarkersToMap(matches);
    
    // Show notification
    showNotification('Filters applied successfully', 'success');
}

// Add the script to the find-matches.html page
document.addEventListener('DOMContentLoaded', function() {
    // Create a Match button functionality
    const createMatchBtn = document.querySelector('.create-match-container .primary-btn');
    if (createMatchBtn) {
        createMatchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if user is logged in
            const token = localStorage.getItem('token');
            
            if (!token) {
                showNotification('Please log in to create matches', 'warning');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            
            // In a real app, this would open a modal or redirect to a create match page
            showNotification('Create match functionality coming soon!', 'info');
        });
    }
});