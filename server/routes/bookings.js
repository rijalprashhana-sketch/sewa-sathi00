// Add this to your existing booking.js file

// ===== NEW FUNCTIONS TO ADD =====

// Check if user is logged in before booking
function checkAuthBeforeBooking() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) {
        // Show login modal or redirect to login
        showLoginModal('Please login to book a service');
        return false;
    }
    
    if (user.role !== 'customer') {
        alert('Only customers can book services');
        return false;
    }
    
    return true;
}

// Create new booking with notification
async function createBooking(bookingData) {
    try {
        if (!checkAuthBeforeBooking()) return;
        
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        // Show loading state
        showLoading('Creating your booking...');
        
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                worker: bookingData.workerId,
                service: bookingData.serviceId,
                date: bookingData.date,
                timeSlot: bookingData.timeSlot,
                location: bookingData.location || user.location,
                amount: bookingData.amount,
                description: bookingData.description
            })
        });
        
        const data = await response.json();
        hideLoading();
        
        if (data.success) {
            // Show success message
            showNotification('success', 'Booking request sent to worker!');
            
            // Redirect to my bookings page
            setTimeout(() => {
                window.location.href = '/my-bookings.html';
            }, 2000);
        } else {
            showNotification('error', data.message);
        }
    } catch (error) {
        hideLoading();
        console.error('Booking error:', error);
        showNotification('error', 'Failed to create booking. Please try again.');
    }
}

// Update your existing "Book Now" button click handler
document.addEventListener('DOMContentLoaded', function() {
    // Find all "Book Now" buttons
    const bookNowButtons = document.querySelectorAll('.book-now-btn, [data-action="book"]');
    
    bookNowButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get worker details from data attributes
            const workerId = this.dataset.workerId;
            const workerName = this.dataset.workerName;
            const serviceId = this.dataset.serviceId;
            const hourlyRate = parseFloat(this.dataset.hourlyRate);
            
            // Check if user is logged in
            if (!checkAuthBeforeBooking()) {
                return;
            }
            
            // Open booking modal with pre-filled data
            openBookingModal({
                workerId,
                workerName,
                serviceId,
                hourlyRate
            });
        });
    });
});

// Booking modal HTML (add this to your HTML or create dynamically)
function openBookingModal(workerData) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('bookingModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'bookingModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Book Service</h2>
                <form id="bookingForm">
                    <div class="worker-info">
                        <h3 id="modalWorkerName"></h3>
                        <p>Rate: ₹<span id="modalHourlyRate"></span>/hour</p>
                    </div>
                    
                    <div class="form-group">
                        <label for="bookingDate">Select Date:</label>
                        <input type="date" id="bookingDate" required min="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <div class="form-group">
                        <label for="timeSlot">Select Time:</label>
                        <select id="timeSlot" required>
                            <option value="">Choose time slot</option>
                            <option value="9AM-12PM">Morning (9 AM - 12 PM)</option>
                            <option value="12PM-3PM">Afternoon (12 PM - 3 PM)</option>
                            <option value="3PM-6PM">Evening (3 PM - 6 PM)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="hours">Estimated Hours:</label>
                        <input type="number" id="hours" min="1" max="8" value="2" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="jobDescription">Job Description:</label>
                        <textarea id="jobDescription" rows="3" placeholder="Describe the problem..." required></textarea>
                    </div>
                    
                    <div class="price-calculation">
                        <p>Total Amount: ₹<span id="totalAmount">0</span></p>
                    </div>
                    
                    <button type="submit" class="btn-confirm">Confirm Booking</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add styles for modal
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
            }
            
            .modal-content {
                background-color: white;
                margin: 5% auto;
                padding: 20px;
                border-radius: 10px;
                width: 90%;
                max-width: 500px;
                position: relative;
            }
            
            .close {
                position: absolute;
                right: 20px;
                top: 10px;
                font-size: 28px;
                cursor: pointer;
            }
            
            .form-group {
                margin-bottom: 15px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            
            .form-group input,
            .form-group select,
            .form-group textarea {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            .btn-confirm {
                background: #27ae60;
                color: white;
                padding: 12px;
                border: none;
                border-radius: 5px;
                width: 100%;
                font-size: 16px;
                cursor: pointer;
            }
            
            .btn-confirm:hover {
                background: #219a52;
            }
            
            .price-calculation {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
                font-size: 18px;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Fill modal with worker data
    document.getElementById('modalWorkerName').textContent = workerData.workerName;
    document.getElementById('modalHourlyRate').textContent = workerData.hourlyRate;
    document.getElementById('totalAmount').textContent = workerData.hourlyRate * 2; // Default 2 hours
    
    // Calculate total when hours change
    document.getElementById('hours').addEventListener('input', function() {
        const hours = parseInt(this.value) || 0;
        const total = workerData.hourlyRate * hours;
        document.getElementById('totalAmount').textContent = total;
    });
    
    // Handle form submission
    const form = document.getElementById('bookingForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const bookingData = {
            workerId: workerData.workerId,
            serviceId: workerData.serviceId,
            date: document.getElementById('bookingDate').value,
            timeSlot: {
                start: document.getElementById('timeSlot').value.split('-')[0],
                end: document.getElementById('timeSlot').value.split('-')[1]
            },
            hours: parseInt(document.getElementById('hours').value),
            amount: workerData.hourlyRate * parseInt(document.getElementById('hours').value),
            description: document.getElementById('jobDescription').value
        };
        
        await createBooking(bookingData);
        modal.style.display = 'none';
    };
    
    // Show modal
    modal.style.display = 'block';
    
    // Close modal when clicking X
    modal.querySelector('.close').onclick = () => {
        modal.style.display = 'none';
    };
    
    // Close modal when clicking outside
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Helper functions
function showLoginModal(message) {
    // Create login prompt modal
    const loginModal = document.createElement('div');
    loginModal.className = 'modal';
    loginModal.innerHTML = `
        <div class="modal-content" style="max-width: 400px; text-align: center;">
            <h3>Login Required</h3>
            <p>${message}</p>
            <div style="margin: 20px 0;">
                <button onclick="window.location.href='/login.html'" class="btn-login">Login</button>
                <button onclick="window.location.href='/register.html'" class="btn-register">Register</button>
                <button onclick="this.closest('.modal').remove()" class="btn-cancel">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(loginModal);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .btn-login, .btn-register, .btn-cancel {
            padding: 10px 20px;
            margin: 0 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        .btn-login { background: #3498db; color: white; }
        .btn-register { background: #27ae60; color: white; }
        .btn-cancel { background: #95a5a6; color: white; }
    `;
    document.head.appendChild(style);
}

function showLoading(message) {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'loading-overlay';
    loader.innerHTML = `
        <div class="loading-spinner"></div>
        <p>${message}</p>
    `;
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('loader');
    if (loader) loader.remove();
}

function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 9999;
        animation: slideIn 0.5s;
    `;
    
    if (type === 'success') notification.style.background = '#27ae60';
    if (type === 'error') notification.style.background = '#e74c3c';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
    }
    
    .loading-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin-bottom: 10px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);