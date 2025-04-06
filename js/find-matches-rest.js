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