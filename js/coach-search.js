document.addEventListener('DOMContentLoaded', function() {
    // Sample coach data (in a real app, this would come from an API/database)
    const coaches = [
        {
            id: 1,
            name: 'John Smith',
            sport: 'Soccer',
            location: 'New York, NY',
            experience: 'expert',
            experienceYears: 15,
            specialization: 'Youth Development',
            rating: 4.8,
            ratingCount: 124,
            image: 'https://randomuser.me/api/portraits/men/32.jpg',
            certified: true,
            bio: 'Former professional player with 15+ years of coaching experience specializing in youth development.'
        },
        {
            id: 2,
            name: 'Sarah Johnson',
            sport: 'Basketball',
            location: 'Los Angeles, CA',
            experience: 'advanced',
            experienceYears: 10,
            specialization: 'Offensive Strategies',
            rating: 4.9,
            ratingCount: 87,
            image: 'https://randomuser.me/api/portraits/women/44.jpg',
            certified: true,
            bio: 'NCAA Division I coach with expertise in offensive strategies and player development.'
        },
        {
            id: 3,
            name: 'Michael Chen',
            sport: 'Tennis',
            location: 'Chicago, IL',
            experience: 'intermediate',
            experienceYears: 7,
            specialization: 'Technical Skills',
            rating: 4.6,
            ratingCount: 56,
            image: 'https://randomuser.me/api/portraits/men/67.jpg',
            certified: true,
            bio: 'Certified tennis instructor focusing on technical skills and match strategy.'
        },
        {
            id: 4,
            name: 'Emily Rodriguez',
            sport: 'Swimming',
            location: 'Miami, FL',
            experience: 'expert',
            experienceYears: 18,
            specialization: 'Competitive Training',
            rating: 5.0,
            ratingCount: 112,
            image: 'https://randomuser.me/api/portraits/women/28.jpg',
            certified: true,
            bio: 'Olympic gold medalist with extensive experience training competitive swimmers.'
        },
        {
            id: 5,
            name: 'David Wilson',
            sport: 'Baseball',
            location: 'Boston, MA',
            experience: 'advanced',
            experienceYears: 12,
            specialization: 'Pitching',
            rating: 4.7,
            ratingCount: 93,
            image: 'https://randomuser.me/api/portraits/men/52.jpg',
            certified: true,
            bio: 'Former MLB pitcher specializing in pitching mechanics and strategy.'
        },
        {
            id: 6,
            name: 'Lisa Thompson',
            sport: 'Volleyball',
            location: 'Seattle, WA',
            experience: 'intermediate',
            experienceYears: 6,
            specialization: 'Team Building',
            rating: 4.5,
            ratingCount: 48,
            image: 'https://randomuser.me/api/portraits/women/56.jpg',
            certified: false,
            bio: 'College volleyball coach focusing on team dynamics and skill development.'
        },
        {
            id: 7,
            name: 'Robert Jackson',
            sport: 'Athletics',
            location: 'Atlanta, GA',
            experience: 'expert',
            experienceYears: 20,
            specialization: 'Sprint Training',
            rating: 4.9,
            ratingCount: 135,
            image: 'https://randomuser.me/api/portraits/men/41.jpg',
            certified: true,
            bio: 'Track and field coach with 20+ years experience specializing in sprint techniques.'
        },
        {
            id: 8,
            name: 'Jennifer Lee',
            sport: 'Soccer',
            location: 'Portland, OR',
            experience: 'beginner',
            experienceYears: 3,
            specialization: 'Goalkeeping',
            rating: 4.2,
            ratingCount: 27,
            image: 'https://randomuser.me/api/portraits/women/62.jpg',
            certified: false,
            bio: 'Former collegiate goalkeeper now coaching youth soccer with focus on goalkeeping.'
        },
        {
            id: 9,
            name: 'Carlos Mendez',
            sport: 'Basketball',
            location: 'San Antonio, TX',
            experience: 'advanced',
            experienceYears: 9,
            specialization: 'Defensive Strategies',
            rating: 4.7,
            ratingCount: 82,
            image: 'https://randomuser.me/api/portraits/men/19.jpg',
            certified: true,
            bio: 'High school basketball coach known for developing strong defensive players.'
        },
        {
            id: 10,
            name: 'Samantha Wright',
            sport: 'Swimming',
            location: 'Denver, CO',
            experience: 'intermediate',
            experienceYears: 5,
            specialization: 'Youth Development',
            rating: 4.4,
            ratingCount: 41,
            image: 'https://randomuser.me/api/portraits/women/33.jpg',
            certified: true,
            bio: 'Certified swim instructor specializing in teaching children and beginners.'
        },
        {
            id: 11,
            name: 'James Peterson',
            sport: 'Tennis',
            location: 'San Diego, CA',
            experience: 'expert',
            experienceYears: 14,
            specialization: 'Advanced Techniques',
            rating: 4.8,
            ratingCount: 97,
            image: 'https://randomuser.me/api/portraits/men/22.jpg',
            certified: true,
            bio: 'Former ATP tour player now coaching advanced tennis techniques and strategy.'
        },
        {
            id: 12,
            name: 'Maria Garcia',
            sport: 'Volleyball',
            location: 'Phoenix, AZ',
            experience: 'advanced',
            experienceYears: 11,
            specialization: 'Offensive Strategies',
            rating: 4.6,
            ratingCount: 76,
            image: 'https://randomuser.me/api/portraits/women/17.jpg',
            certified: true,
            bio: 'Professional volleyball player turned coach with focus on offensive strategies.'
        }
    ];
    
    // DOM elements
    const resultsGrid = document.getElementById('results-grid');
    const resultsNumber = document.getElementById('results-number');
    const searchBtn = document.getElementById('search-btn');
    const resetBtn = document.getElementById('reset-btn');
    const sortBySelect = document.getElementById('sort-by');
    const coachNameInput = document.getElementById('coach-name');
    const sportTypeSelect = document.getElementById('sport-type');
    const locationInput = document.getElementById('location');
    const experienceSelect = document.getElementById('experience');
    
    // Initialize with all coaches
    displayCoaches(coaches);
    
    // Search button click handler
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const filteredCoaches = filterCoaches();
            displayCoaches(filteredCoaches);
        });
    }
    
    // Reset button click handler
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            // Clear all inputs
            coachNameInput.value = '';
            sportTypeSelect.value = '';
            locationInput.value = '';
            experienceSelect.value = '';
            
            // Reset to show all coaches
            displayCoaches(coaches);
        });
    }
    
    // Sort select change handler
    if (sortBySelect) {
        sortBySelect.addEventListener('change', function() {
            const filteredCoaches = filterCoaches();
            displayCoaches(filteredCoaches);
        });
    }
    
    // Filter coaches based on search criteria
    function filterCoaches() {
        const name = coachNameInput.value.toLowerCase();
        const sport = sportTypeSelect.value.toLowerCase();
        const location = locationInput.value.toLowerCase();
        const experience = experienceSelect.value.toLowerCase();
        
        return coaches.filter(coach => {
            // Name filter
            if (name && !coach.name.toLowerCase().includes(name)) {
                return false;
            }
            
            // Sport filter
            if (sport && coach.sport.toLowerCase() !== sport) {
                return false;
            }
            
            // Location filter
            if (location && !coach.location.toLowerCase().includes(location)) {
                return false;
            }
            
            // Experience filter
            if (experience && coach.experience !== experience) {
                return false;
            }
            
            return true;
        });
    }
    
    // Sort coaches based on selected criteria
    function sortCoaches(coachesToSort) {
        const sortBy = sortBySelect.value;
        
        switch (sortBy) {
            case 'rating-high':
                return [...coachesToSort].sort((a, b) => b.rating - a.rating);
            case 'rating-low':
                return [...coachesToSort].sort((a, b) => a.rating - b.rating);
            case 'experience-high':
                return [...coachesToSort].sort((a, b) => b.experienceYears - a.experienceYears);
            case 'experience-low':
                return [...coachesToSort].sort((a, b) => a.experienceYears - b.experienceYears);
            default: // relevance or any other value
                return coachesToSort;
        }
    }
    
    // Display coaches in the results grid
    function displayCoaches(coachesToDisplay) {
        // Sort coaches
        const sortedCoaches = sortCoaches(coachesToDisplay);
        
        // Update results count
        resultsNumber.textContent = sortedCoaches.length;
        
        // Clear current results
        resultsGrid.innerHTML = '';
        
        // If no results
        if (sortedCoaches.length === 0) {
            resultsGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No coaches found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
            return;
        }
        
        // Create coach cards
        sortedCoaches.forEach(coach => {
            const coachCard = document.createElement('div');
            coachCard.className = 'coach-card';
            
            // Generate star rating HTML
            const starsHtml = generateStarRating(coach.rating);
            
            coachCard.innerHTML = `
                <div class="coach-image">
                    <img src="${coach.image}" alt="${coach.name}">
                    ${coach.certified ? '<span class="coach-badge">Certified</span>' : ''}
                </div>
                <div class="coach-info">
                    <h3 class="coach-name">${coach.name}</h3>
                    <div class="coach-sport">${coach.sport}</div>
                    <div class="coach-details">
                        <div class="coach-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${coach.location}</span>
                        </div>
                        <div class="coach-detail">
                            <i class="fas fa-medal"></i>
                            <span>${getExperienceText(coach.experience)} (${coach.experienceYears} years)</span>
                        </div>
                        <div class="coach-detail">
                            <i class="fas fa-graduation-cap"></i>
                            <span>${coach.specialization}</span>
                        </div>
                    </div>
                    <div class="coach-rating">
                        <div class="stars">
                            ${starsHtml}
                        </div>
                        <span class="rating-count">(${coach.ratingCount} reviews)</span>
                    </div>
                    <div class="coach-actions">
                        <a href="#" class="btn primary-btn">View Profile</a>
                        <a href="#" class="btn secondary-btn">Contact</a>
                    </div>
                </div>
            `;
            
            resultsGrid.appendChild(coachCard);
        });
    }
    
    // Generate star rating HTML
    function generateStarRating(rating) {
        let starsHtml = '';
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        
        // Add full stars
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }
        
        // Add half star if needed
        if (halfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Add empty stars
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }
        
        return starsHtml;
    }
    
    // Get experience level text
    function getExperienceText(experience) {
        switch (experience) {
            case 'beginner':
                return 'Beginner';
            case 'intermediate':
                return 'Intermediate';
            case 'advanced':
                return 'Advanced';
            case 'expert':
                return 'Expert';
            default:
                return 'Any Experience';
        }
    }
});