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
        showNotification('Loading matches...', 'info');
        
        let result;
        if (window.api && window.api.getMatches) {
            // Use the API module if available
            result = await window.api.getMatches();
            if (!result.success) {
                throw new Error(result.data?.error?.message || 'Failed to fetch matches');
            }
            matches = result.data;
        } else {
            // Fallback to direct fetch
            const token = localStorage.getItem('token');
            const headers = token ? { 'x-auth-token': token } : {};
            
            const response = await fetch('/api/matches', {
                method: 'GET',
                headers: headers,
                credentials: 'include' // Include cookies in the request
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Failed to fetch matches: ${response.status}`);
            }
            
            matches = await response.json();
        }
        
        if (!Array.isArray(matches)) {
            console.warn('API returned non-array data:', matches);
            matches = matches.data || matches.matches || [];
        }
        
        displayMatches(matches);
        addMarkersToMap(matches);
        showNotification(`Found ${matches.length} matches`, 'success');
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
        showNotification('Finding matches near you...', 'info');
        
        const distanceFilter = document.getElementById('distance-filter');
        const distance = distanceFilter ? distanceFilter.value : 10;
        
        let result;
        if (window.api && window.api.getMatches) {
            // Use the API module if available
            result = await window.api.getMatches({ lat, lng, distance });
            if (!result.success) {
                throw new Error(result.data?.error?.message || 'Failed to fetch matches by location');
            }
            matches = result.data;
        } else {
            // Fallback to direct fetch
            const token = localStorage.getItem('token');
            const headers = token ? { 'x-auth-token': token } : {};
            
            const response = await fetch(`/api/matches?lat=${lat}&lng=${lng}&distance=${distance}`, {
                method: 'GET',
                headers: headers,
                credentials: 'include' // Include cookies in the request
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Failed to fetch matches by location: ${response.status}`);
            }
            
            matches = await response.json();
        }
        
        if (!Array.isArray(matches)) {
            console.warn('API returned non-array data:', matches);
            matches = matches.data || matches.matches || [];
        }
        
        displayMatches(matches);
        addMarkersToMap(matches);
        showNotification(`Found ${matches.length} matches in your area`, 'success');
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
        showNotification('Applying filters...', 'info');
        
        // Build filter object
        const filters = {};
        
        if (sportFilter && sportFilter !== 'all') {
            filters.sport = sportFilter;
        }
        
        if (dateFilter && dateFilter !== 'all') {
            filters.date = dateFilter;
        }
        
        if (levelFilter && levelFilter !== 'all') {
            filters.skillLevel = levelFilter;
        }
        
        // Get current map center for location-based filtering
        if (map) {
            const center = map.getCenter();
            filters.lat = center.lat();
            filters.lng = center.lng();
            filters.distance = distanceFilter;
        }
        
        let result;
        if (window.api && window.api.getMatches) {
            // Use the API module if available
            result = await window.api.getMatches(filters);
            if (!result.success) {
                throw new Error(result.data?.error?.message || 'Failed to fetch filtered matches');
            }
            matches = result.data;
        } else {
            // Fallback to direct fetch
            const token = localStorage.getItem('token');
            const headers = token ? { 'x-auth-token': token } : {};
            
            // Build query string based on filters
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                queryParams.append(key, value);
            });
            
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            const response = await fetch(`/api/matches${queryString}`, {
                method: 'GET',
                headers: headers,
                credentials: 'include' // Include cookies in the request
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Failed to fetch filtered matches: ${response.status}`);
            }
            
            matches = await response.json();
        }
        
        if (!Array.isArray(matches)) {
            console.warn('API returned non-array data:', matches);
            matches = matches.data || matches.matches || [];
        }
        
        displayMatches(matches);
        addMarkersToMap(matches);
        
        if (matches.length === 0) {
            showNotification('No matches found with the selected filters', 'info');
        } else {
            showNotification(`Found ${matches.length} matches with the selected filters`, 'success');
        }
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
    
    // Validate matches data
    if (!matchesData || !Array.isArray(matchesData) || matchesData.length === 0) {
        matchList.innerHTML = '<div class="no-matches">No matches found. Try adjusting your filters.</div>';
        return;
    }
    
    // Add each match to the list
    matchesData.forEach(match => {
        try {
            if (!match || !match._id || !match.title) {
                console.warn('Invalid match data:', match);
                return; // Skip this match
            }
            
            // Parse date safely
            let formattedDate = 'Date not available';
            if (match.date) {
                try {
                    const matchDate = new Date(match.date);
                    if (!isNaN(matchDate.getTime())) {
                        formattedDate = matchDate.toLocaleDateString('en-US', { 
                            weekday: 'long',
                            hour: 'numeric',
                            minute: '2-digit'
                        });
                    }
                } catch (dateError) {
                    console.warn('Error formatting date:', dateError);
                }
            }
            
            // Handle different coordinate formats
            let lat, lng;
            if (match.location && match.location.coordinates) {
                if (Array.isArray(match.location.coordinates)) {
                    // MongoDB format [lng, lat]
                    lat = match.location.coordinates[1];
                    lng = match.location.coordinates[0];
                } else if (typeof match.location.coordinates === 'object') {
                    // Our frontend format {lat, lng}
                    lat = match.location.coordinates.lat;
                    lng = match.location.coordinates.lng;
                }
            }
            
            const matchItem = document.createElement('div');
            matchItem.className = 'match-item';
            matchItem.dataset.id = match._id;
            
            // Only add coordinates if they're valid
            if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
                matchItem.dataset.lat = lat;
                matchItem.dataset.lng = lng;
            }
            
            // Format skill level for display
            const skillLevel = match.skillLevel ? 
                match.skillLevel.charAt(0).toUpperCase() + match.skillLevel.slice(1) : 
                'All Levels';
            
            // Safely get sport icon
            const sportIcon = getSportIcon(match.sport || 'other');
            
            matchItem.innerHTML = `
                <div class="match-sport ${match.sport || 'other'}"><i class="fas fa-${sportIcon}"></i></div>
                <div class="match-info">
                    <h4>${match.title}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${match.location?.address || 'Location not specified'}</p>
                    <p><i class="fas fa-calendar"></i> ${formattedDate}</p>
                    <p><i class="fas fa-users"></i> ${match.spotsAvailable || 0} spots available</p>
                    <p><i class="fas fa-signal"></i> ${skillLevel}</p>
                    <div class="match-actions">
                        <button class="btn primary-btn join-match-btn">Join Match</button>
                        <button class="btn secondary-btn details-btn">Details</button>
                    </div>
                </div>
            `;
            
            matchList.appendChild(matchItem);
        } catch (error) {
            console.error('Error displaying match:', error, match);
        }
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
    
    // Check if we have matches to display
    if (!matchesData || matchesData.length === 0) return;
    
    // Create bounds object to fit all markers
    const bounds = new google.maps.LatLngBounds();
    
    // Add a marker for each match
    matchesData.forEach(match => {
        try {
            // Handle different coordinate formats
            // MongoDB GeoJSON format: coordinates: [lng, lat] array
            // Our frontend format: coordinates: {lat, lng} object
            let position;
            
            if (match.location && match.location.coordinates) {
                if (Array.isArray(match.location.coordinates)) {
                    // MongoDB format [lng, lat]
                    position = {
                        lat: match.location.coordinates[1],
                        lng: match.location.coordinates[0]
                    };
                } else if (typeof match.location.coordinates === 'object') {
                    // Our frontend format {lat, lng}
                    position = {
                        lat: parseFloat(match.location.coordinates.lat),
                        lng: parseFloat(match.location.coordinates.lng)
                    };
                } else {
                    console.error('Invalid coordinates format for match:', match);
                    return; // Skip this match
                }
            } else {
                console.error('Match missing location coordinates:', match);
                return; // Skip this match
            }
            
            // Validate coordinates
            if (isNaN(position.lat) || isNaN(position.lng)) {
                console.error('Invalid coordinates for match:', match);
                return; // Skip this match
            }
            
            const marker = new google.maps.Marker({
                position: position,
                map: map,
                title: match.title,
                animation: google.maps.Animation.DROP,
                matchId: match._id
            });
            
            // Extend bounds to include this marker
            bounds.extend(position);
            
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
                
                // Format skill level for display
                const skillLevel = match.skillLevel ? 
                    match.skillLevel.charAt(0).toUpperCase() + match.skillLevel.slice(1) : 
                    'All Levels';
                
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div class="map-info-window">
                            <h3>${match.title}</h3>
                            <p><i class="fas fa-map-marker-alt"></i> ${match.location.address}</p>
                            <p><i class="fas fa-calendar"></i> ${formattedDate}</p>
                            <p><i class="fas fa-users"></i> ${match.spotsAvailable} spots available</p>
                            <p><i class="fas fa-signal"></i> ${skillLevel}</p>
                            ${match.description ? `<p>${match.description}</p>` : ''}
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
        } catch (error) {
            console.error('Error creating marker for match:', match, error);
        }
    });
    
    // Fit map to markers if there are any
    if (markers.length > 0) {
        map.fitBounds(bounds);
        
        // Don't zoom in too far on single marker
        const listener = google.maps.event.addListener(map, 'idle', function() {
            if (map.getZoom() > 15) map.setZoom(15);
            google.maps.event.removeListener(listener);
        });
    }
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
        default:
            return 'running';
    }
}
                    