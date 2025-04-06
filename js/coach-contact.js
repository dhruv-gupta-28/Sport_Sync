// Handle coach contact page functionality

const API_URL = '/api';

// Function to check if user is authenticated
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    return !!token;
}

// Function to handle coach search
async function handleCoachSearch(event) {
    event.preventDefault();
    
    const searchParams = {
        name: document.getElementById('coach-name').value,
        sport: document.getElementById('sport-type').value,
        location: document.getElementById('location').value,
        experience: document.getElementById('experience').value,
        specialization: document.getElementById('specialization').value,
        availability: document.getElementById('availability').value
    };
    
    try {
        const response = await fetch(`${API_URL}/coaches/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchParams)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displaySearchResults(data.coaches);
            updateResultsCount(data.coaches.length);
        } else {
            showError(data.message || 'Search failed');
        }
    } catch (error) {
        console.error('Search error:', error);
        showError('An error occurred during search');
    }
}

// Function to display search results
function displaySearchResults(coaches) {
    const coachCardsContainer = document.querySelector('.coach-cards');
    coachCardsContainer.innerHTML = '';
    
    coaches.forEach(coach => {
        const coachCard = createCoachCard(coach);
        coachCardsContainer.appendChild(coachCard);
    });
}

// Function to create a coach card
function createCoachCard(coach) {
    const card = document.createElement('div');
    card.className = 'coach-card';
    
    const ratingStars = generateRatingStars(coach.rating);
    
    card.innerHTML = `
        <div class="coach-header">
            <img src="${coach.image || '../images/default-coach.jpg'}" alt="Coach" class="coach-image">
            <span class="coach-sport">${coach.sport}</span>
        </div>
        <div class="coach-info">
            <h3 class="coach-name">${coach.name}</h3>
            <div class="coach-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${coach.location}</span>
                <span><i class="fas fa-briefcase"></i> ${coach.experience}</span>
            </div>
            <div class="coach-rating">
                ${ratingStars}
                <span>(${coach.rating} - ${coach.reviewCount} reviews)</span>
            </div>
            <div class="coach-specialties">
                <h4>Specialties:</h4>
                <div class="specialty-tags">
                    ${coach.specialties.map(specialty => 
                        `<span class="specialty-tag">${specialty}</span>`
                    ).join('')}
                </div>
            </div>
            <p class="coach-description">${coach.description}</p>
            <div class="coach-actions">
                <button onclick="handleContactCoach('${coach.id}')" class="btn primary-btn">Contact</button>
                <button onclick="viewCoachProfile('${coach.id}')" class="btn secondary-btn">View Profile</button>
            </div>
        </div>
    `;
    
    return card;
}

// Function to generate rating stars
function generateRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Function to handle contacting a coach
async function handleContactCoach(coachId) {
    if (!checkAuthStatus()) {
        window.location.href = '/pages/login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/coaches/${coachId}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Redirect to chat or messaging interface
            window.location.href = `/pages/chat.html?coach=${coachId}`;
        } else {
            showError(data.message || 'Failed to contact coach');
        }
    } catch (error) {
        console.error('Contact error:', error);
        showError('An error occurred while trying to contact the coach');
    }
}

// Function to view coach profile
function viewCoachProfile(coachId) {
    window.location.href = `/pages/coach-profile.html?id=${coachId}`;
}

// Function to update results count
function updateResultsCount(count) {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        resultsCount.textContent = count;
    }
}

// Function to handle sort change
function handleSortChange() {
    const sortBy = document.getElementById('sort-by').value;
    const coachCards = Array.from(document.querySelectorAll('.coach-card'));
    
    coachCards.sort((a, b) => {
        const nameA = a.querySelector('.coach-name').textContent;
        const nameB = b.querySelector('.coach-name').textContent;
        const ratingA = parseFloat(a.querySelector('.coach-rating span').textContent);
        const ratingB = parseFloat(b.querySelector('.coach-rating span').textContent);
        
        switch(sortBy) {
            case 'name-asc':
                return nameA.localeCompare(nameB);
            case 'name-desc':
                return nameB.localeCompare(nameA);
            case 'rating-high':
                return ratingB - ratingA;
            default:
                return 0;
        }
    });
    
    const container = document.querySelector('.coach-cards');
    container.innerHTML = '';
    coachCards.forEach(card => container.appendChild(card));
}

// Function to reset search filters
function resetFilters() {
    document.getElementById('coach-name').value = '';
    document.getElementById('sport-type').value = '';
    document.getElementById('location').value = '';
    document.getElementById('experience').value = '';
    document.getElementById('specialization').value = '';
    document.getElementById('availability').value = '';
    
    handleCoachSearch(new Event('submit'));
}

// Function to show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const searchContainer = document.querySelector('.search-container');
    searchContainer.insertBefore(errorDiv, searchContainer.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.querySelector('.search-form');
    const sortSelect = document.getElementById('sort-by');
    const resetButton = document.getElementById('reset-search');
    
    if (searchForm) {
        searchForm.addEventListener('submit', handleCoachSearch);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }
    
    // Initial search to load all coaches
    handleCoachSearch(new Event('submit'));
});