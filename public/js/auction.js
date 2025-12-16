// ============================================
// LIVE AUCTION LOGIC
// ============================================

let currentAuctionCar = null;
let liveAuctions = [];
let bidUpdateInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    initAuction();
});

async function initAuction() {
    await loadLiveAuctions();
    setupBidForm();
    
    // Poll for bid updates every 5 seconds
    if (liveAuctions.length > 0) {
        bidUpdateInterval = setInterval(() => {
            if (currentAuctionCar) {
                updateBids(currentAuctionCar._id);
                updateCarData(currentAuctionCar._id);
            }
        }, 5000);
    }
}

// Load all live auction cars
async function loadLiveAuctions() {
    try {
        const response = await fetch('/api/cars/live-auctions');
        if (!response.ok) throw new Error('Failed to fetch live auctions');
        
        liveAuctions = await response.json();
        
        if (liveAuctions.length === 0) {
            showNoAuctions();
            return;
        }
        
        renderAuctionTabs();
        
        // Select first auction by default
        if (liveAuctions.length > 0) {
            selectAuction(liveAuctions[0]._id);
        }
    } catch (error) {
        console.error('Error loading live auctions:', error);
        showNoAuctions();
    }
}

// Render auction tabs
function renderAuctionTabs() {
    const tabsContainer = document.getElementById('auction-tabs');
    if (!tabsContainer) return;
    
    tabsContainer.innerHTML = '';
    
    liveAuctions.forEach((car, index) => {
        const tab = document.createElement('button');
        tab.className = 'auction-tab';
        tab.textContent = `${car.make.toUpperCase()} ${car.model.toUpperCase()}`;
        tab.dataset.carId = car._id;
        
        if (car.status === 'SOLD') {
            tab.classList.add('sold');
        }
        
        if (index === 0) {
            tab.classList.add('active');
        }
        
        tab.addEventListener('click', () => {
            selectAuction(car._id);
        });
        
        tabsContainer.appendChild(tab);
    });
}

// Select an auction and load its data
async function selectAuction(carId) {
    // Update active tab
    document.querySelectorAll('.auction-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.carId === carId) {
            tab.classList.add('active');
        }
    });
    
    try {
        // Fetch car data
        const carResponse = await fetch(`/api/cars/${carId}`);
        if (!carResponse.ok) throw new Error('Failed to fetch car');
        
        currentAuctionCar = await carResponse.json();
        
        // Update UI
        updateCarDisplay(currentAuctionCar);
        updateStatusIndicator(currentAuctionCar.status);
        
        // Load bids
        await updateBids(carId);
        
        // Update bid form
        updateBidForm(currentAuctionCar);
    } catch (error) {
        console.error('Error selecting auction:', error);
    }
}

// Update car display stats
function updateCarDisplay(car) {
    document.getElementById('stat-make').textContent = car.make.toUpperCase() || '-';
    document.getElementById('stat-model').textContent = car.model.toUpperCase() || '-';
    document.getElementById('stat-year').textContent = car.year || '-';
    document.getElementById('stat-reserve').textContent = car.price ? `$${car.price.toLocaleString()}` : '-';
    
    const currentPrice = car.currentBid > 0 ? car.currentBid : car.price || 0;
    document.getElementById('current-price').textContent = `$${currentPrice.toLocaleString()}`;
}

// Update status indicator
function updateStatusIndicator(status) {
    const indicator = document.getElementById('live-indicator');
    const statusText = document.getElementById('status-text');
    
    if (!indicator || !statusText) return;
    
    if (status === 'SOLD') {
        indicator.classList.add('inactive');
        statusText.textContent = 'INACTIVE';
    } else if (status === 'LIVE_AUCTION') {
        indicator.classList.remove('inactive');
        statusText.textContent = 'CONNECTED';
    } else {
        indicator.classList.add('inactive');
        statusText.textContent = 'INACTIVE';
    }
}

// Update bids list
async function updateBids(carId) {
    try {
        const response = await fetch(`/api/cars/${carId}/bids`);
        if (!response.ok) throw new Error('Failed to fetch bids');
        
        const bids = await response.json();
        renderBids(bids);
        
        // Update current price if there are bids
        if (bids.length > 0 && currentAuctionCar) {
            const highestBid = bids[0].amount;
            currentAuctionCar.currentBid = highestBid;
            document.getElementById('current-price').textContent = `$${highestBid.toLocaleString()}`;
        }
    } catch (error) {
        console.error('Error updating bids:', error);
    }
}

// Render bids list
function renderBids(bids) {
    const bidList = document.getElementById('bid-list');
    if (!bidList) return;
    
    if (bids.length === 0) {
        bidList.innerHTML = '<li class="bid-item" style="color: #666; text-align: center;">No bids yet</li>';
        return;
    }
    
    bidList.innerHTML = '';
    
    bids.forEach(bid => {
        const li = document.createElement('li');
        li.className = 'bid-item';
        
        const bidderName = bid.user?.displayName || 'ANONYMOUS';
        const amount = `$${bid.amount.toLocaleString()}`;
        const time = formatTime(bid.timestamp);
        
        li.innerHTML = `
            <span class="bidder">${bidderName.toUpperCase()}</span>
            <span class="amount">${amount}</span>
            <span class="time">${time}</span>
        `;
        
        bidList.appendChild(li);
    });
}

// Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'JUST NOW';
    if (diffMins < 60) return `${diffMins}M AGO`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}H AGO`;
    
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Update car data (for current bid changes)
async function updateCarData(carId) {
    try {
        const response = await fetch(`/api/cars/${carId}`);
        if (!response.ok) return;
        
        const car = await response.json();
        if (car._id === currentAuctionCar?._id) {
            currentAuctionCar = car;
            updateCarDisplay(car);
            updateStatusIndicator(car.status);
        }
    } catch (error) {
        console.error('Error updating car data:', error);
    }
}

// Update bid form
function updateBidForm(car) {
    const bidInput = document.getElementById('bid-amount');
    const bidSubmitBtn = document.getElementById('bid-submit-btn');
    
    if (!bidInput || !bidSubmitBtn) return;
    
    const minBid = car.currentBid > 0 ? car.currentBid + 1000 : car.price || 1000;
    bidInput.min = minBid;
    bidInput.placeholder = `MIN: $${minBid.toLocaleString()}`;
    
    // Disable if sold
    if (car.status === 'SOLD') {
        bidInput.disabled = true;
        bidSubmitBtn.disabled = true;
        bidSubmitBtn.textContent = 'SOLD';
    } else {
        bidInput.disabled = false;
        bidSubmitBtn.disabled = false;
        bidSubmitBtn.textContent = 'PLACE_BID >';
    }
}

// Setup bid form handler
function setupBidForm() {
    const bidForm = document.getElementById('bid-form');
    const bidError = document.getElementById('bid-error');
    
    if (!bidForm) return;
    
    bidForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentAuctionCar) {
            showError('No auction selected');
            return;
        }
        
        // Check login status
        const authCheck = await fetch('/auth/status');
        const authData = await authCheck.json();
        
        if (!authData.loggedIn) {
            showError('LOGIN_REQUIRED');
            document.getElementById('login-modal').classList.add('active');
            return;
        }
        
        const bidInput = document.getElementById('bid-amount');
        const amount = parseFloat(bidInput.value);
        
        if (!amount || amount <= 0) {
            showError('Invalid bid amount');
            return;
        }
        
        // Submit bid
        try {
            const response = await fetch(`/api/cars/${currentAuctionCar._id}/bids`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Clear form
                bidInput.value = '';
                hideError();
                
                // Refresh bids and car data
                await updateBids(currentAuctionCar._id);
                await updateCarData(currentAuctionCar._id);
                updateBidForm(currentAuctionCar);
                
                // Show success animation
                const priceEl = document.getElementById('current-price');
                gsap.from(priceEl, { scale: 1.2, color: '#00ff00', duration: 0.5 });
            } else {
                showError(data.error || 'Failed to place bid');
            }
        } catch (error) {
            console.error('Bid submission error:', error);
            showError('Network error. Please try again.');
        }
    });
}

function showError(message) {
    const bidError = document.getElementById('bid-error');
    if (bidError) {
        bidError.textContent = message;
        bidError.classList.add('show');
    }
}

function hideError() {
    const bidError = document.getElementById('bid-error');
    if (bidError) {
        bidError.classList.remove('show');
    }
}

function showNoAuctions() {
    const terminalGrid = document.querySelector('.terminal-grid');
    if (terminalGrid) {
        terminalGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: #666;">
                <h2 style="font-family: var(--font-display); margin-bottom: 1rem;">NO LIVE AUCTIONS</h2>
                <p style="font-family: monospace;">Check back later for available auctions.</p>
            </div>
        `;
    }
}

