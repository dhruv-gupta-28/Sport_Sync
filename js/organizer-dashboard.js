document.addEventListener('DOMContentLoaded', function() {
    // Toggle sidebar on mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Navigation functionality
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const contentSections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target section id from the href attribute
            const targetId = this.getAttribute('href');
            
            // Remove active class from all links and add to clicked link
            navLinks.forEach(link => link.parentElement.classList.remove('active'));
            this.parentElement.classList.add('active');
            
            // Hide all sections and show the target section
            contentSections.forEach(section => section.classList.remove('active'));
            document.querySelector(targetId).classList.add('active');
            
            // Close sidebar on mobile after navigation
            if (window.innerWidth < 992) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // Match Creation Form Handling
    const createMatchBtn = document.getElementById('create-match-btn');
    const matchCreationForm = document.getElementById('match-creation-form');
    const closeMatchFormBtn = document.getElementById('close-match-form');
    const cancelMatchBtn = document.getElementById('cancel-match-btn');
    const newMatchForm = document.getElementById('new-match-form');
    
    // Show match creation form
    if (createMatchBtn && matchCreationForm) {
        createMatchBtn.addEventListener('click', function() {
            matchCreationForm.style.display = 'block';
            // Scroll to form
            matchCreationForm.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Hide match creation form
    if (closeMatchFormBtn && matchCreationForm) {
        closeMatchFormBtn.addEventListener('click', function() {
            matchCreationForm.style.display = 'none';
        });
    }
    
    if (cancelMatchBtn && matchCreationForm) {
        cancelMatchBtn.addEventListener('click', function() {
            matchCreationForm.style.display = 'none';
        });
    }
    
    // Handle match form submission
    if (newMatchForm) {
        newMatchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const title = document.getElementById('match-title').value;
            const sport = document.getElementById('match-sport').value;
            const date = document.getElementById('match-date').value;
            const time = document.getElementById('match-time').value;
            const location = document.getElementById('match-location').value;
            const skillLevel = document.getElementById('match-skill-level').value;
            const spotsAvailable = document.getElementById('match-spots').value;
            const description = document.getElementById('match-description').value;
            
            // Create match data object
            const matchData = {
                title,
                sport,
                date: `${date}T${time}`,
                location: {
                    address: location,
                    coordinates: {
                        lat: 0, // Would be set by geocoding in a real app
                        lng: 0
                    }
                },
                skillLevel,
                spotsAvailable: parseInt(spotsAvailable),
                description
            };
            
            // Show loading state
            const submitBtn = newMatchForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Match...';
            submitBtn.disabled = true;
            
            // Simulate API call - In a real app, this would be an API call
            setTimeout(() => {
                // Reset button state
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Show success message
                showNotification('Match created successfully!', 'success');
                
                // Hide form and reset it
                matchCreationForm.style.display = 'none';
                newMatchForm.reset();
                
                // Add the new match to the UI (in a real app, this would be done after API confirmation)
                addMatchToUI(matchData);
            }, 1500);
        });
    }
    
    // Function to add a new match to the UI
    function addMatchToUI(matchData) {
        // Format date for display
        const matchDate = new Date(matchData.date);
        const formattedDate = matchDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        // Create a new row in the matches table
        const matchesTable = document.querySelector('#match-management .dashboard-table tbody');
        
        if (matchesTable) {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${formattedDate}</td>
                <td>${matchData.title}</td>
                <td>${matchData.location.address}</td>
                <td><span class="status-badge upcoming">Upcoming</span></td>
                <td>
                    <div class="table-actions">
                        <button class="view-btn"><i class="fas fa-eye"></i></button>
                        <button class="edit-btn"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            
            // Add to the beginning of the table
            if (matchesTable.firstChild) {
                matchesTable.insertBefore(newRow, matchesTable.firstChild);
            } else {
                matchesTable.appendChild(newRow);
            }
        }
    }
    
    // Notification function (reusing from signup.js)
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
                icon = '<i class="fas