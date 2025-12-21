// ============================================
// TECHNICAL ARCHIVE - X-RAY SCANNER & CLASSIFIED GRID
// Creative Developer Implementation
// ============================================

// Global garage inventory and current index (exposed to window for cross-module access)
let garageInventory = [];
let currentIndex = 0;
// Expose to window for cross-module access
window.garageInventory = garageInventory;
window.currentIndex = currentIndex;

// Don't auto-initialize here - let app.js handle it
// This prevents double initialization and timing issues
// document.addEventListener('DOMContentLoaded', () => {
//     // Only initialize if on showroom or market page
//     const currentPath = window.location.pathname;
//     if (currentPath === '/showroom') {
//         initShowroomCarousel();
//         initXRayScanner();
//     }
//     if (currentPath === '/market') {
//         initClassifiedGrid();
//     }
// });

// Function to load a specific car in showroom (called from profile page)
window.loadShowroom = async function(carId) {
    try {
        const response = await fetch(`/api/cars/${carId}`);
        if (!response.ok) throw new Error('Car not found');
        
        const car = await response.json();
        
        // Find car index in inventory
        const carIndex = garageInventory.findIndex(c => c._id === carId || c.id === carId);
        
        if (carIndex !== -1) {
            currentIndex = carIndex;
            window.currentIndex = carIndex;
            updateShowroom(carIndex, false);
        } else {
            // Car not in current inventory, add it temporarily
            garageInventory.push(car);
            currentIndex = garageInventory.length - 1;
            window.currentIndex = currentIndex;
            window.garageInventory = garageInventory;
            updateShowroom(currentIndex, false);
        }
    } catch (error) {
        console.error('Error loading car:', error);
    }
};

// ============================================
// SHOWROOM CAROUSEL LOGIC
// ============================================
async function initShowroomCarousel() {
    console.log('🚗 initShowroomCarousel() called');
    
    // Fetch all cars from API
    try {
        console.log('🔄 Fetching cars from /api/cars...');
        const response = await fetch('/api/cars');
        if (response.ok) {
            garageInventory = await response.json();
            window.garageInventory = garageInventory; // Sync to window
            console.log(`✅ Loaded ${garageInventory.length} cars`);
            
            if (garageInventory.length === 0) {
                console.warn('⚠️ No cars found in inventory');
                return;
            }
            
            // Initialize UI
            console.log('🔧 Setting up navigation...');
            setupNavigation();
            console.log('🔄 Updating showroom with first car...');
            updateShowroom(0, true); // Initial load without animation
            console.log('✅ Showroom carousel initialized');
        } else {
            console.error('❌ Failed to fetch cars. Status:', response.status);
        }
    } catch (error) {
        console.error('❌ Failed to load garage inventory:', error);
    }
}

function setupNavigation() {
    console.log('🔧 setupNavigation() called');
    
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const actionBtn = document.getElementById('action-btn');
    
    console.log('   Previous button found:', !!prevBtn);
    console.log('   Next button found:', !!nextBtn);
    console.log('   Action button found:', !!actionBtn);
    
    // Previous button
    if (prevBtn) {
        // Remove existing listeners by cloning
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        const freshPrevBtn = document.getElementById('prev-btn');
        
        freshPrevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('⬅️ Previous button clicked. Current index:', currentIndex);
            if (currentIndex > 0) {
                updateShowroom(currentIndex - 1);
            } else {
                console.log('   Already at first car');
            }
        }, { once: false });
        
        // Ensure button is clickable
        freshPrevBtn.style.pointerEvents = 'auto';
        freshPrevBtn.style.cursor = 'pointer';
        
        console.log('✅ Previous button listener attached');
    } else {
        console.error('❌ Previous button not found!');
    }
    
    // Next button
    if (nextBtn) {
        // Remove existing listeners by cloning
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        const freshNextBtn = document.getElementById('next-btn');
        
        freshNextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('➡️ Next button clicked. Current index:', currentIndex, 'Total cars:', garageInventory.length);
            if (currentIndex < garageInventory.length - 1) {
                updateShowroom(currentIndex + 1);
            } else {
                console.log('   Already at last car');
            }
        }, { once: false });
        
        // Ensure button is clickable
        freshNextBtn.style.pointerEvents = 'auto';
        freshNextBtn.style.cursor = 'pointer';
        
        console.log('✅ Next button listener attached');
    } else {
        console.error('❌ Next button not found!');
    }
    
    // Action button - attach event listener directly with multiple methods
    if (actionBtn) {
        console.log('✅ Setting up action button click handler');
        console.log('   Button element:', actionBtn);
        console.log('   Button disabled:', actionBtn.disabled);
        console.log('   Button pointer-events:', window.getComputedStyle(actionBtn).pointerEvents);
        
        // Remove any existing listeners by cloning
        const newBtn = actionBtn.cloneNode(true);
        actionBtn.parentNode.replaceChild(newBtn, actionBtn);
        const freshBtn = document.getElementById('action-btn');
        
        // Use onclick (most reliable)
        freshBtn.onclick = function(e) {
            console.log('🔘 Button clicked via onclick!');
            e.preventDefault();
            e.stopPropagation();
            handleActionClick(e);
        };
        
        // Also addEventListener as backup
        freshBtn.addEventListener('click', function(e) {
            console.log('🔘 Button clicked via addEventListener!');
            e.preventDefault();
            e.stopPropagation();
            handleActionClick(e);
        }, true); // Use capture phase
        
        // Also handle mousedown
        freshBtn.addEventListener('mousedown', function(e) {
            console.log('🔘 Button mousedown!');
            e.preventDefault();
            handleActionClick(e);
        });
        
        // Ensure button is clickable
        freshBtn.style.pointerEvents = 'auto';
        freshBtn.style.cursor = 'pointer';
        freshBtn.setAttribute('tabindex', '0');
        
        console.log('✅ Action button listener attached. Button:', freshBtn);
        console.log('   Final pointer-events:', window.getComputedStyle(freshBtn).pointerEvents);
    } else {
        console.error('❌ Action button not found!');
    }

    // Setup offer modal event listeners
    setupOfferModalListeners();
}

function updateShowroom(index, isInitial = false) {
    if (index < 0 || index >= garageInventory.length) {
        return;
    }
    
    const previousIndex = currentIndex;
    currentIndex = index;
    window.currentIndex = currentIndex; // Sync to window
    const car = garageInventory[index];
    
    // Get DOM elements
    const carWrapper = document.querySelector('.car-wrapper');
    const thermalImg = document.getElementById('thermal-img');
    const realImg = document.getElementById('real-img');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const actionBtn = document.getElementById('action-btn');
    const actionText = document.getElementById('action-text');
    
    if (!carWrapper || !thermalImg || !realImg) {
        console.warn('Showroom elements not found');
        return;
    }
    
    // Update stealth footer elements
    const stealthAssetId = document.getElementById('stealth-asset-id');
    const stealthStatusIndicator = document.getElementById('stealth-status-indicator');
    const stealthCarName = document.getElementById('stealth-car-name');
    const stealthCarPrice = document.getElementById('stealth-car-price');
    const drawerEngine = document.getElementById('drawer-engine');
    const drawerZerosixty = document.getElementById('drawer-zerosixty');
    
    // Update Asset ID
    if (stealthAssetId) {
        const assetIdValue = car._id ? car._id.toString().slice(-6).toUpperCase() : '001';
        stealthAssetId.textContent = `REF: _${assetIdValue}`;
    }
    
    // Update Status Indicator
    if (stealthStatusIndicator) {
        const statusDot = stealthStatusIndicator.querySelector('.status-dot');
        if (statusDot) {
            statusDot.classList.remove('active', 'sold');
            if (car.status === 'SOLD') {
                statusDot.classList.add('sold');
            }
        }
    }
    
    // Update Car Name
    if (stealthCarName) {
        stealthCarName.textContent = car.make && car.model 
            ? `${car.make.toUpperCase()} ${car.model.toUpperCase()}`
            : 'CLASSIFIED';
    }
    
    // Update Price
    if (stealthCarPrice) {
        const price = car.askingPrice || car.price || 0;
        const priceFormatted = price >= 1000000 
            ? `$${(price / 1000000).toFixed(1)}M`
            : `$${(price / 1000).toFixed(0)}K`;
        stealthCarPrice.textContent = priceFormatted;
    }
    
    // Update Drawer Specs (Redacted)
    if (drawerEngine) {
        drawerEngine.classList.add('redacted');
        drawerEngine.textContent = '';
    }
    if (drawerZerosixty) {
        drawerZerosixty.classList.add('redacted');
        drawerZerosixty.textContent = '';
    }
    
    
    // Update button states
    if (prevBtn) {
        prevBtn.disabled = index === 0;
    }
    if (nextBtn) {
        nextBtn.disabled = index === garageInventory.length - 1;
    }
    
    // Update action button based on car status
    if (actionBtn && actionText) {
        actionBtn.disabled = false;
        
        // Fetch latest car data to check offers
        const carId = car._id || car.id;
        fetch(`/api/cars/${carId}`)
            .then(res => res.ok ? res.json() : car)
            .then(latestCar => {
                // Update car in inventory with latest data
                if (latestCar._id) {
                    garageInventory[currentIndex] = latestCar;
                }
                
                // Check auth status
                return fetch('/auth/status')
                    .then(res => res.json())
                    .then(userData => ({ latestCar, userData }))
                    .catch(() => ({ latestCar, userData: { loggedIn: false } }));
            })
            .then(({ latestCar, userData }) => {
                if (latestCar.status === 'RESERVED' && userData.loggedIn && userData.user) {
                    // Check if user has an accepted offer for this car
                    const userId = userData.user._id || userData.user.id;
                    const hasAcceptedOffer = latestCar.offers && latestCar.offers.some(offer => {
                        const offerUserId = offer.userId?._id || offer.userId?.toString() || offer.userId;
                        return offerUserId && offerUserId.toString() === userId.toString() && offer.status === 'accepted';
                    });
                    
                    if (hasAcceptedOffer) {
                        actionText.textContent = 'PROCEED_TO_PAYMENT';
                        actionBtn.disabled = false;
                        // Re-attach event listener to ensure it works
                        actionBtn.onclick = handleActionClick;
                        console.log('✅ Button set to PROCEED_TO_PAYMENT, enabled:', !actionBtn.disabled);
                    } else {
                        actionText.textContent = 'RESERVED';
                        actionBtn.disabled = true;
                    }
                } else if (latestCar.status === 'AVAILABLE') {
                    actionText.textContent = 'INITIATE OFFER';
                    actionBtn.disabled = false;
                    // Re-attach event listener to ensure it works
                    actionBtn.onclick = handleActionClick;
                    console.log('✅ Button set to INITIATE OFFER, enabled:', !actionBtn.disabled);
                } else {
                    actionText.textContent = 'SOLD';
                    actionBtn.disabled = true;
                }
            })
            .catch(() => {
                // Default fallback
                if (car.status === 'AVAILABLE') {
                    actionText.textContent = 'INITIATE OFFER';
                    actionBtn.disabled = false;
                    actionBtn.onclick = handleActionClick;
                } else {
                    actionText.textContent = 'BUY NOW';
                    actionBtn.disabled = false;
                    actionBtn.onclick = handleActionClick;
                }
            });
        
        actionBtn.classList.remove('auction-mode');
    }
    
    // For initial load, just set content without animation
    if (isInitial) {
        thermalImg.src = car.image || '/assets/photo/porsche_911.png';
        realImg.src = car.image || '/assets/photo/porsche_911.png';
        updateSpecOverlay(car);
        return;
    }
    
    // GSAP Animation: Smooth slide transition
    const direction = index > previousIndex ? 1 : -1; // 1 = next, -1 = prev
    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    
    // Prevent rapid clicking during animation
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    
    // Slide out current car smoothly
    tl.to(carWrapper, {
        x: direction * -100,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in"
    })
    // Update content mid-transition
    .call(() => {
        // Update images
        thermalImg.src = car.image || '/assets/photo/porsche_911.png';
        realImg.src = car.image || '/assets/photo/porsche_911.png';
        
        // Update overlay
        updateSpecOverlay(car);
    })
    // Slide in new car from opposite direction
    .fromTo(carWrapper, 
        {
            x: direction * 100,
            opacity: 0
        },
        {
            x: 0,
            opacity: 1,
            duration: 0.4,
            ease: "power2.out"
        }
    )
    // Re-enable buttons after animation completes
    .call(() => {
        if (prevBtn) prevBtn.disabled = index === 0;
        if (nextBtn) nextBtn.disabled = index === garageInventory.length - 1;
    });
}

async function handleActionClick(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('🔘🔘🔘 Action button clicked! Event:', e);
    console.trace('Button click stack trace');
    
    const car = garageInventory[currentIndex];
    
    if (!car) {
        console.error('❌ No car found at current index:', currentIndex);
        return;
    }
    
    console.log('📦 Current car:', car.make, car.model, 'Status:', car.status);
    
    // Fetch latest car data to ensure we have up-to-date offers
    const carId = car._id || car.id;
    let latestCar = car;
    
    try {
        console.log('🔄 Fetching latest car data for:', carId);
        const carResponse = await fetch(`/api/cars/${carId}`);
        if (carResponse.ok) {
            latestCar = await carResponse.json();
            console.log('✅ Latest car data:', latestCar.status, 'Offers:', latestCar.offers?.length || 0);
        }
    } catch (error) {
        console.error('❌ Failed to fetch latest car data:', error);
    }
    
    // Check if car is reserved and user has accepted offer
    try {
        const userResponse = await fetch('/auth/status').catch(() => ({ json: () => ({ loggedIn: false }) }));
        const userData = await userResponse.json();
        console.log('👤 User data:', userData.loggedIn ? 'Logged in' : 'Not logged in', userData.user?._id);
        
        if (latestCar.status === 'RESERVED' && userData.loggedIn && userData.user) {
            // Check if user has an accepted offer for this car
            const userId = userData.user._id || userData.user.id;
            const hasAcceptedOffer = latestCar.offers && latestCar.offers.some(offer => {
                const offerUserId = offer.userId?._id || offer.userId?.toString() || offer.userId;
                const matches = offerUserId && offerUserId.toString() === userId.toString() && offer.status === 'accepted';
                if (matches) {
                    console.log('✅ Found accepted offer:', offer);
                }
                return matches;
            });
            
            console.log('🔍 Has accepted offer?', hasAcceptedOffer);
            
            if (hasAcceptedOffer) {
                // Redirect to payment page instead of opening modal
                console.log('💳 Redirecting to payment page for car:', latestCar._id);
                window.location.href = `/payment?id=${latestCar._id}`;
                return;
            } else {
                console.log('⚠️ No accepted offer found');
                alert('This car is reserved. Only the user with an accepted offer can proceed to payment.');
                return;
            }
        }
        
        // Open Offer Modal for available cars
        if (latestCar.status === 'AVAILABLE') {
            console.log('📝 Opening offer modal...');
            await openOfferModal(latestCar);
        } else {
            // For other statuses (SOLD), show message
            console.log('❌ Car status:', latestCar.status);
            alert('This car is no longer available.');
        }
    } catch (error) {
        console.error('❌ Error in handleActionClick:', error);
        alert('An error occurred. Please try again.');
    }
}

// Open Offer Modal
async function openOfferModal(car) {
    try {
        // Check if user is logged in first
        const userResponse = await fetch('/auth/status');
        if (!userResponse.ok) {
            alert('Please log in to make an offer');
            return;
        }

        const userData = await userResponse.json();
        if (!userData.loggedIn) {
            alert('Please log in to make an offer');
            return;
        }

        // Fetch latest car data
        const carId = car._id || car.id;
        if (!carId) {
            alert('Error: Car ID not found');
            return;
        }

        const carResponse = await fetch(`/api/cars/${carId}`);
        if (!carResponse.ok) {
            throw new Error('Failed to fetch car data');
        }
        const latestCar = await carResponse.json();

        // Populate modal
        const modal = document.getElementById('offer-modal');
        const carNameEl = document.getElementById('offer-terminal-car-name');
        const askingPriceEl = document.getElementById('offer-asking-price');
        const offerInput = document.getElementById('offer-amount-input');
        const messageInput = document.getElementById('offer-message-input');
        const statusEl = document.getElementById('offer-status');
        const transmitBtn = document.getElementById('transmit-offer-btn');
        const transmitText = document.getElementById('transmit-offer-text');
        const transmitLoader = document.getElementById('transmit-offer-loader');

        if (!modal || !carNameEl || !askingPriceEl || !offerInput) {
            console.error('Offer modal elements not found');
            return;
        }

        // Reset modal state
        statusEl.classList.remove('show', 'success', 'error');
        statusEl.textContent = '';
        transmitBtn.disabled = false;
        transmitText.style.display = 'inline';
        transmitLoader.style.display = 'none';
        offerInput.value = '';
        if (messageInput) messageInput.value = '';

        // Populate data
        const askingPrice = latestCar.askingPrice || latestCar.price || 0;

        carNameEl.textContent = `${latestCar.make} ${latestCar.model}`.toUpperCase();
        askingPriceEl.textContent = `$${askingPrice.toLocaleString()}`;

        // Store car data for submission
        offerInput.dataset.carId = carId;
        offerInput.dataset.askingPrice = askingPrice;

        // Show modal
        modal.classList.add('active');

        // Focus input
        setTimeout(() => {
            offerInput.focus();
        }, 300);

    } catch (error) {
        console.error('Error opening offer modal:', error);
        alert('Failed to open offer modal: ' + error.message);
    }
}

// Submit Offer
async function submitOffer() {
    const offerInput = document.getElementById('offer-amount-input');
    const messageInput = document.getElementById('offer-message-input');
    const statusEl = document.getElementById('offer-status');
    const transmitBtn = document.getElementById('transmit-offer-btn');
    const transmitText = document.getElementById('transmit-offer-text');
    const transmitLoader = document.getElementById('transmit-offer-loader');

    if (!offerInput || !transmitBtn) {
        console.error('Offer submission elements not found');
        return;
    }

    try {
        // Get values
        const carId = offerInput.dataset.carId;
        const askingPrice = parseFloat(offerInput.dataset.askingPrice) || 0;
        const inputValue = offerInput.value.replace(/[^0-9.]/g, '');
        const offerAmount = parseFloat(inputValue);
        const message = messageInput ? messageInput.value.trim() : '';

        // Validate input
        if (!offerAmount || offerAmount <= 0) {
            statusEl.textContent = 'INVALID_OFFER_AMOUNT';
            statusEl.classList.add('show', 'error');
            statusEl.classList.remove('success');
            return;
        }

        // Get user data
        const userResponse = await fetch('/auth/status');
        if (!userResponse.ok) {
            throw new Error('Authentication required');
        }
        const userData = await userResponse.json();
        if (!userData.loggedIn) {
            throw new Error('Please log in to submit an offer');
        }
        const alias = userData.user?.displayName || 'ANONYMOUS';

        // Disable button and show loading
        transmitBtn.disabled = true;
        transmitText.style.display = 'none';
        transmitLoader.style.display = 'inline';

        // Clear status
        statusEl.classList.remove('show', 'error', 'success');

        // Submit offer
        console.log('Submitting offer:', { carId, amount: offerAmount, alias, message });

        const response = await fetch(`/api/cars/${carId}/offer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                amount: offerAmount,
                alias: alias,
                message: message
            })
        });

        console.log('Offer response status:', response.status);

        if (!response.ok) {
            let errorMessage = 'Failed to submit offer';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
                console.error('Offer error response:', errorData);
            } catch (e) {
                const text = await response.text();
                console.error('Offer error text:', text);
                errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
            }

            statusEl.textContent = `ERROR: ${errorMessage}`;
            statusEl.classList.add('show', 'error');
            statusEl.classList.remove('success');

            // Re-enable button
            transmitBtn.disabled = false;
            transmitText.style.display = 'inline';
            transmitLoader.style.display = 'none';
            return;
        }

        const data = await response.json();
        console.log('Offer success:', data);

        // Show success message
        statusEl.textContent = 'OFFER_TRANSMITTED_SUCCESSFULLY';
        statusEl.classList.add('show', 'success');
        statusEl.classList.remove('error');

        // Wait 2 seconds, then close modal
        setTimeout(() => {
            const modal = document.getElementById('offer-modal');
            if (modal) {
                modal.classList.remove('active');
            }
        }, 2000);

    } catch (error) {
        console.error('Offer submission error:', error);
        statusEl.textContent = `ERROR: ${error.message}`;
        statusEl.classList.add('show', 'error');
        statusEl.classList.remove('success');

        // Re-enable button
        transmitBtn.disabled = false;
        transmitText.style.display = 'inline';
        transmitLoader.style.display = 'none';
    }
}

// Setup offer modal event listeners
function setupOfferModalListeners() {
    // Close button
    const closeBtn = document.getElementById('close-offer-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const modal = document.getElementById('offer-modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    }

    // Transmit button
    const transmitBtn = document.getElementById('transmit-offer-btn');
    if (transmitBtn) {
        transmitBtn.addEventListener('click', submitOffer);
    }

    // Close modal when clicking overlay
    const modal = document.getElementById('offer-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const offerModal = document.getElementById('offer-modal');
            const paymentModal = document.getElementById('payment-modal');
            if (offerModal && offerModal.classList.contains('active')) {
                offerModal.classList.remove('active');
            }
            if (paymentModal && paymentModal.classList.contains('active')) {
                paymentModal.classList.remove('active');
            }
        }
    });

    // Enter key on input
    const offerInput = document.getElementById('offer-amount-input');
    if (offerInput) {
        offerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (transmitBtn && !transmitBtn.disabled) {
                    submitOffer();
                }
            }
        });
    }
}


// ============================================
// X-RAY SCANNER LOGIC
// ============================================
async function initXRayScanner() {
    const scannerSection = document.getElementById('showroom-section');
    const carWrapper = document.querySelector('.car-wrapper');
    const realLayer = document.getElementById('real-layer');
    const scannerCursor = document.getElementById('scanner-cursor');
    
    if (!scannerSection || !carWrapper || !realLayer || !scannerCursor) {
        console.warn('Thermal Scanner elements not found');
        return;
    }
    
    let mouseX = 0;
    let mouseY = 0;
    
    // Update mask position based on mouse
    function updateMask(e) {
        const rect = scannerSection.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Update CSS variables for mask position on real layer
        realLayer.style.setProperty('--x', `${x}%`);
        realLayer.style.setProperty('--y', `${y}%`);
    }
    
    // Smooth cursor follow with GSAP (heavy mechanical feel)
    function updateCursor() {
        // Use GSAP for smooth, delayed movement
        gsap.to(scannerCursor, {
            x: mouseX,
            y: mouseY,
            duration: 0.6,
            ease: "power2.out"
        });
        
        requestAnimationFrame(updateCursor);
    }
    
    // Mouse move handler
    scannerSection.addEventListener('mousemove', (e) => {
        updateMask(e);
    });
    
    // Initialize cursor position
    scannerSection.addEventListener('mouseenter', (e) => {
        updateMask(e);
        scannerCursor.style.opacity = '0.9';
    });
    
    scannerSection.addEventListener('mouseleave', () => {
        scannerCursor.style.opacity = '0';
    });
    
    // Start cursor animation loop
    updateCursor();
}

// ============================================
// CLASSIFIED GRID - FETCH FROM API
// ============================================
// Global filter state
let currentFilter = 'all';
let allCars = [];

async function initClassifiedGrid() {
    const assetGrid = document.getElementById('market-grid') || document.getElementById('asset-grid');
    
    if (!assetGrid) {
        console.warn('Asset grid not found');
        return;
    }
    
    try {
        // Fetch cars from API
        const response = await fetch('/api/cars');
        if (!response.ok) {
            throw new Error('Failed to fetch cars');
        }
        
        const cars = await response.json();
        allCars = cars; // Store for filtering
        
        // Setup filter buttons
        setupMarketFilters();
        
        // Render cards with current filter
        renderFilteredCards();
        
    } catch (error) {
        console.error('Error loading classified assets:', error);
        assetGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: #555; font-family: var(--font-tech, "JetBrains Mono", monospace); text-transform: uppercase; letter-spacing: 2px;"><div style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--thermal-red, #ff3300);">NO_ACTIVE_ASSETS</div><div style="font-size: 0.9rem; opacity: 0.7;">MARKET_OFFLINE</div></div>';
    }
}

function setupMarketFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update filter
            currentFilter = btn.dataset.filter;
            
            // Re-render cards
            renderFilteredCards();
        });
    });
}

function renderFilteredCards() {
    const assetGrid = document.getElementById('market-grid') || document.getElementById('asset-grid');
    if (!assetGrid) return;
    
    // Filter cars based on current filter
    let filteredCars = allCars;
    
    if (currentFilter === 'buynow') {
        filteredCars = allCars.filter(car => car.status === 'AVAILABLE');
    }
    
    // Transform to card data
    const classifiedAssets = filteredCars.map((car, index) => ({
        code: `REF_${String(index + 1).padStart(3, '0')}`,
        name: `${car.make.toUpperCase()} ${car.model.toUpperCase()}`,
        image: car.image || getPlaceholderImage(car.make),
        price: formatPrice(car.askingPrice || car.price || 0),
        status: car.status || 'AVAILABLE',
        year: car.year || 'N/A',
        _id: car._id,
        car: car // Store full car object for later use
    }));
    
    // Render cards
    if (classifiedAssets.length > 0) {
        renderAssetCards(classifiedAssets);
    } else {
        assetGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: #555; font-family: var(--font-tech, "JetBrains Mono", monospace); text-transform: uppercase; letter-spacing: 2px;"><div style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--thermal-red, #ff3300);">NO_ASSETS_FOUND</div><div style="font-size: 0.9rem; opacity: 0.7;">TRY_SELECTING_DIFFERENT_FILTER</div></div>';
    }
}

// Format price with commas
function formatPrice(price) {
    return '$' + price.toLocaleString('en-US');
}

// Get placeholder image based on car make
function getPlaceholderImage(make) {
    // Use a placeholder service or local placeholder
    // For now, return a data URI or placeholder URL
    return `https://via.placeholder.com/400x300/1a1a1a/666666?text=${encodeURIComponent(make)}`;
}

// Fallback cards if API fails
function renderFallbackCards() {
    const fallbackAssets = [
        {
            code: 'REF_001',
            name: 'PORSCHE 911 GT3 RS',
            image: getPlaceholderImage('Porsche'),
            price: '$215,000',
            status: 'AVAILABLE',
            year: '2023'
        },
        {
            code: 'REF_002',
            name: 'FERRARI F40',
            image: getPlaceholderImage('Ferrari'),
            price: '$2,450,000',
            status: 'AVAILABLE',
            year: '1990'
        }
    ];
    renderAssetCards(fallbackAssets);
}

function renderAssetCards(assets) {
    const assetGrid = document.getElementById('market-grid') || document.getElementById('asset-grid');
    
    if (!assetGrid) return;
    
    // Clear existing content
    assetGrid.innerHTML = '';
    
    // Create card for each asset
    assets.forEach(asset => {
        const card = createAssetCard(asset);
        assetGrid.appendChild(card);
    });
}

function createAssetCard(asset) {
    const article = document.createElement('article');
    article.className = 'asset-card';
    
    // Handle image errors with fallback
    const imgSrc = asset.image || getPlaceholderImage(asset.name.split(' ')[0]);
    
    // Status chip content
    const statusChipHTML = `
        <div class="status-chip secure">
            SECURE_STOCK
        </div>
    `;
    
    // Price display
    const priceDisplay = asset.price;
    
    // Build card HTML with new structure
    article.innerHTML = `
        <!-- Layer 1: Image -->
        <img src="${imgSrc}" alt="${asset.name}" class="asset-card-image" loading="lazy" onerror="this.src='${getPlaceholderImage(asset.name.split(' ')[0])}'">
        
        <!-- Layer 2: Status Chip (Top-Left) -->
        ${statusChipHTML}
        
        <!-- Layer 3: Data Plate (Bottom - Slides Up on Hover) -->
        <div class="data-plate">
            <div class="data-plate-row">
                <div class="data-plate-make-model">${asset.name}</div>
            </div>
            <div class="data-plate-row">
                <div class="data-plate-price">${priceDisplay}</div>
            </div>
            <div class="data-plate-row">
                <a href="#" class="data-plate-button">VIEW_INTEL</a>
            </div>
        </div>
    `;
    
    // Click handler: Redirect to showroom
    article.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const carId = asset._id || asset.car?._id;
        if (carId) {
            window.location.href = `/showroom?id=${carId}`;
        } else {
            console.error('Car ID not found for asset:', asset);
        }
    });
    
    return article;
}

function handleAssetAccess(asset) {
    if (!asset.car) {
        console.warn('Asset missing car data:', asset.code);
        return;
    }
    
    const car = asset.car;
    
    // Find the car index in garageInventory
    const carIndex = garageInventory.findIndex(c => c._id === car._id || c._id?.toString() === car._id?.toString());
    
    if (carIndex === -1) {
        console.warn('Car not found in garage inventory:', car._id);
        return;
    }
    
    // Scroll to showroom section
    const showroomSection = document.getElementById('showroom-section');
    if (showroomSection) {
        // Navigation handled by routing - no scroll needed
    }
    
    // Update showroom to display this car
    updateShowroom(carIndex);
    
    // Open payment terminal after transition
    setTimeout(() => {
        // Redirect to payment page instead of opening modal
        if (car && car._id) {
            console.log('💳 Redirecting to payment page for car:', car._id);
            window.location.href = `/payment?id=${car._id}`;
        }
    }, 800); // Wait for showroom transition to complete
}

// Fetch bid history for a car
async function fetchBidHistory(carId) {
    const bidHistoryContainer = document.getElementById('bid-history-container');
    if (!bidHistoryContainer) return;
    
    try {
        const response = await fetch(`/api/cars/${carId}/bids`);
        if (!response.ok) {
            throw new Error('Failed to fetch bid history');
        }
        
        const bids = await response.json();
        
        // Clear existing content
        bidHistoryContainer.innerHTML = '';
        
        if (bids.length === 0) {
            bidHistoryContainer.innerHTML = '<div class="bid-item" style="color: #555; font-size: 0.7rem; padding: 0.5rem;">NO_BIDS_YET</div>';
            return;
        }
        
        // Display last 5 bids
        bids.forEach((bid, index) => {
            const bidItem = document.createElement('div');
            bidItem.className = 'bid-item';
            
            const bidDate = new Date(bid.timestamp).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const bidAmount = bid.amount >= 1000000 
                ? `$${(bid.amount / 1000000).toFixed(1)}M` 
                : `$${(bid.amount / 1000).toFixed(0)}K`;
            
            bidItem.innerHTML = `
                <span class="bid-bidder">${(bid.bidder || 'ANONYMOUS').toUpperCase()}</span>
                <span class="bid-amount">${bidAmount}</span>
                <span class="bid-date">${bidDate}</span>
            `;
            
            bidHistoryContainer.appendChild(bidItem);
            
            // Stagger fade-in
            gsap.fromTo(bidItem,
                { opacity: 0, x: -20 },
                { opacity: 1, x: 0, duration: 0.3, delay: index * 0.1 }
            );
        });
        
    } catch (error) {
        console.error('Error fetching bid history:', error);
        bidHistoryContainer.innerHTML = '<div class="bid-item" style="color: #ff3300; font-size: 0.7rem; padding: 0.5rem;">ERROR_LOADING_BIDS</div>';
    }
}

function updateSpecOverlay(car) {
    if (!car) return;
    
    // Update Background Watermark with Car Make/Model
    const watermark = document.getElementById('archive-watermark');
    if (watermark) {
        const watermarkText = car.make && car.model 
            ? `${car.make.toUpperCase()} ${car.model.toUpperCase()}`
            : 'ARCHIVE';
        watermark.textContent = watermarkText;
        
        // Add fade-in effect on load
        gsap.fromTo(watermark, 
            { opacity: 0 },
            { opacity: 0.05, duration: 1, ease: "power2.out" }
        );
    }
    
    // Update Stealth Footer (new minimal UI)
    const stealthAssetId = document.getElementById('stealth-asset-id');
    const stealthStatusIndicator = document.getElementById('stealth-status-indicator');
    const stealthCarName = document.getElementById('stealth-car-name');
    const stealthCarPrice = document.getElementById('stealth-car-price');
    const drawerEngine = document.getElementById('drawer-engine');
    const drawerZerosixty = document.getElementById('drawer-zerosixty');
    
    // Update Asset ID
    if (stealthAssetId) {
        const assetIdValue = car._id ? car._id.toString().slice(-6).toUpperCase() : '001';
        stealthAssetId.textContent = `REF: _${assetIdValue}`;
    }
    
    // Update Status Indicator Dot
    if (stealthStatusIndicator) {
        const statusDot = stealthStatusIndicator.querySelector('.status-dot');
        if (statusDot) {
            statusDot.classList.remove('active', 'sold');
            if (car.status === 'SOLD') {
                statusDot.classList.add('sold');
            }
        }
    }
    
    // Update Car Name
    if (stealthCarName) {
        stealthCarName.textContent = car.make && car.model 
            ? `${car.make.toUpperCase()} ${car.model.toUpperCase()}`
            : 'CLASSIFIED';
    }
    
    // Update Price
    if (stealthCarPrice) {
        const price = car.askingPrice || car.price || 0;
        const priceFormatted = price >= 1000000 
            ? `$${(price / 1000000).toFixed(1)}M`
            : price >= 1000
            ? `$${(price / 1000).toFixed(0)}K`
            : `$${price}`;
        stealthCarPrice.textContent = priceFormatted;
    }
    
    // Update Drawer Specs (Redacted with scanline animation)
    if (drawerEngine) {
        drawerEngine.classList.add('redacted');
        drawerEngine.textContent = '';
    }
    if (drawerZerosixty) {
        drawerZerosixty.classList.add('redacted');
        drawerZerosixty.textContent = '';
    }
}

// ============================================
// STRIPE PAYMENT TERMINAL
// ============================================

// Initialize Stripe (use placeholder key - replace with actual publishable key from .env)
let stripe = null;
let cardElement = null;
let currentPaymentCar = null;

// Initialize Stripe Payment Terminal
async function initStripePayment() {
    console.log('🔧 initStripePayment() called');
    
    // Check if Stripe is loaded
    if (typeof Stripe === 'undefined') {
        console.error('❌ Stripe.js library not loaded. Make sure <script src="https://js.stripe.com/v3/"></script> is in the HTML.');
        return false;
    }
    
    console.log('✅ Stripe.js library is loaded');
    
    // Fetch publishable key from server
    try {
        console.log('🔄 Fetching Stripe config from /api/payment/config...');
        const response = await fetch('/api/payment/config');
        
        if (!response.ok) {
            console.error('❌ Failed to fetch Stripe config. Status:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('   Response:', errorText);
            throw new Error(`Failed to fetch Stripe config: ${response.status} ${response.statusText}`);
        }
        
        const config = await response.json();
        console.log('✅ Received Stripe config:', { 
            hasKey: !!config.publishableKey, 
            testMode: config.testMode,
            keyPrefix: config.publishableKey ? config.publishableKey.substring(0, 10) + '...' : 'none'
        });
        
        const { publishableKey, testMode } = config;
        
        if (!publishableKey) {
            console.error('❌ Stripe publishable key not found in server response');
            console.error('   Make sure STRIPE_PUBLISHABLE_KEY is set in server .env file');
            return false;
        }
        
        // Initialize Stripe with the publishable key from server
        console.log('🔄 Initializing Stripe with publishable key...');
        stripe = Stripe(publishableKey);
        console.log('✅ Stripe object created:', stripe ? 'Success' : 'Failed');
        
        if (testMode) {
            console.log('✅ Stripe initialized successfully (TEST MODE)');
        } else {
            console.log('✅ Stripe initialized successfully (LIVE MODE)');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Stripe:', error);
        console.error('   Error details:', error.message);
        stripe = null;
        return false;
    }
    
    // Setup close button
    const closePaymentBtn = document.getElementById('close-payment-modal');
    if (closePaymentBtn) {
        closePaymentBtn.addEventListener('click', closePaymentTerminal);
    }
    
    // Close on overlay click
    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) {
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) {
                closePaymentTerminal();
            }
        });
    }
}

async function openPaymentTerminal(car) {
    console.log('🚀 openPaymentTerminal called with car:', car);
    
    if (!car) {
        console.error('❌ Car data not available');
        alert('Car data not available. Please try again.');
        return;
    }
    
    console.log('✅ Car data available:', car.make, car.model);
    
    // Initialize Stripe if not already initialized
    if (!stripe) {
        console.log('🔄 Stripe not initialized, initializing now...');
        console.log('   Stripe library available?', typeof Stripe !== 'undefined');
        
        try {
            await initStripePayment();
            console.log('   Stripe initialization attempt completed');
            console.log('   Stripe object after init:', stripe ? 'Initialized' : 'Still null');
        } catch (error) {
            console.error('❌ Error during Stripe initialization:', error);
        }
        
        // Check again after initialization
        if (!stripe) {
            console.error('❌ Failed to initialize Stripe - stripe is still null');
            console.error('   This might be due to:');
            console.error('   1. Stripe.js library not loaded');
            console.error('   2. /api/payment/config endpoint failing');
            console.error('   3. Missing STRIPE_PUBLISHABLE_KEY in server .env');
            alert('Payment system is not available. Please check your connection and try again.\n\nCheck browser console for details.');
            return;
        }
    } else {
        console.log('✅ Stripe already initialized');
    }
    
    // Fetch latest car data to ensure we have up-to-date offers
    const carId = car._id || car.id;
    let latestCar = car;
    
    try {
        const carResponse = await fetch(`/api/cars/${carId}`);
        if (carResponse.ok) {
            latestCar = await carResponse.json();
        }
    } catch (error) {
        console.error('Failed to fetch latest car data:', error);
    }
    
    // Check if car is reserved - only allow payment if user has accepted offer
    if (latestCar.status === 'RESERVED') {
        const userResponse = await fetch('/auth/status').catch(() => ({ json: () => ({ loggedIn: false }) }));
        const userData = await userResponse.json();
        
        if (!userData.loggedIn || !userData.user) {
            alert('Please log in to access payment terminal');
            return;
        }
        
        // Check if user has an accepted offer for this car
        const userId = userData.user._id || userData.user.id;
        const hasAcceptedOffer = latestCar.offers && latestCar.offers.some(offer => {
            const offerUserId = offer.userId?._id || offer.userId?.toString() || offer.userId;
            return offerUserId && offerUserId.toString() === userId.toString() && offer.status === 'accepted';
        });
        
        if (!hasAcceptedOffer) {
            alert('This car is reserved. Only the user with an accepted offer can proceed to payment.');
            return;
        }
    }
    
    // Use latest car data for payment
    currentPaymentCar = latestCar;
    
    const paymentModal = document.querySelector('.payment-terminal-overlay') || document.getElementById('payment-modal');
    const terminalCarName = document.getElementById('terminal-car-name');
    const terminalAmount = document.getElementById('terminal-amount');
    const cardElementContainer = document.getElementById('card-element');
    const submitBtn = document.getElementById('submit-payment');
    const submitText = document.getElementById('submit-text');
    const submitLoader = document.getElementById('submit-loader');
    const paymentStatus = document.getElementById('payment-status');
    
    if (!paymentModal) {
        console.error('❌ Payment modal not found in DOM');
        alert('Payment modal not found. Please refresh the page.');
        return;
    }
    
    if (!cardElementContainer) {
        console.error('❌ Card element container not found');
        alert('Payment form not found. Please refresh the page.');
        return;
    }
    
    console.log('✅ Payment modal found:', paymentModal);
    console.log('✅ Card element container found:', cardElementContainer);
    
    // Update car name and amount
    if (terminalCarName) {
        terminalCarName.textContent = `${latestCar.make.toUpperCase()} ${latestCar.model.toUpperCase()}`;
    }
    
    const carPrice = latestCar.askingPrice || latestCar.price || 0;
    if (terminalAmount) {
        terminalAmount.textContent = `$${carPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Reset modal state
    paymentModal.classList.remove('success', 'error');
    paymentStatus.classList.remove('show', 'success', 'error');
    paymentStatus.textContent = '';
    submitBtn.disabled = false;
    submitText.style.display = 'inline';
    submitLoader.style.display = 'none';
    
    // Clear billing form
    const billingInputs = paymentModal.querySelectorAll('.terminal-input');
    billingInputs.forEach(input => {
        if (input.tagName === 'SELECT') {
            input.value = 'US';
        } else {
            input.value = '';
        }
    });
    
    // Clear any existing card element
    if (cardElement) {
        cardElement.unmount();
        cardElement = null;
    }
    
    // Show modal first (user fills billing info)
    paymentModal.classList.add('active');
    
    // Setup form submission handler
    submitBtn.onclick = async (e) => {
        e.preventDefault();
        await handlePaymentFlow(latestCar, submitBtn, submitText, submitLoader, paymentStatus);
    };
}

async function handlePaymentFlow(car, submitBtn, submitText, submitLoader, paymentStatus) {
    // Collect billing details
    const billingDetails = {
        name: document.getElementById('billing-name')?.value.trim(),
        email: document.getElementById('billing-email')?.value.trim(),
        address: {
            line1: document.getElementById('billing-line1')?.value.trim(),
            line2: document.getElementById('billing-line2')?.value.trim() || '',
            city: document.getElementById('billing-city')?.value.trim(),
            state: document.getElementById('billing-state')?.value.trim(),
            postal_code: document.getElementById('billing-postal')?.value.trim(),
            country: document.getElementById('billing-country')?.value || 'US',
        }
    };
    
    // Validate billing details
    if (!billingDetails.name || !billingDetails.email || !billingDetails.address.line1 || 
        !billingDetails.address.city || !billingDetails.address.state || !billingDetails.address.postal_code) {
        showPaymentStatus('INCOMPLETE_BILLING_INFORMATION', 'error');
        return;
    }
    
    // Show processing state
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitLoader.style.display = 'inline';
    hidePaymentStatus();
    
    try {
        // Create payment intent with billing details
        const response = await fetch('/api/payment/create-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                carId: car._id,
                billingDetails: billingDetails
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            // Handle Stripe limit error gracefully
            if (errorData.message && errorData.message.includes('exceeds')) {
                throw new Error(errorData.message || 'This asset exceeds the maximum payment amount. Please contact us for wire transfer arrangements.');
            }
            throw new Error(errorData.error || 'Failed to create payment intent');
        }
        
        const { clientSecret, amount, currency } = await response.json();
        
        // If card element doesn't exist, create it
        if (!cardElement) {
            const elements = stripe.elements({ clientSecret });
            
            cardElement = elements.create('card', {
                style: {
                    base: {
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '14px',
                        color: '#ffffff',
                        '::placeholder': {
                            color: '#666666',
                        },
                        iconColor: '#ff3300',
                    },
                    invalid: {
                        color: '#ff3300',
                        iconColor: '#ff3300',
                    },
                },
            });
            
            cardElement.mount('#card-element');
            
            // Handle real-time validation errors
            cardElement.on('change', (event) => {
                if (event.error) {
                    showPaymentStatus(event.error.message.toUpperCase(), 'error');
                } else {
                    hidePaymentStatus();
                }
            });
        }
        
        // Submit payment
        await handlePaymentSubmit(clientSecret, billingDetails, submitBtn, submitText, submitLoader, paymentStatus);
        
    } catch (error) {
        console.error('Payment flow error:', error);
        showPaymentStatus(error.message.toUpperCase() || 'TRANSACTION_INITIALIZATION_FAILED', 'error');
        submitBtn.disabled = false;
        submitText.style.display = 'inline';
        submitLoader.style.display = 'none';
    }
}

async function handlePaymentSubmit(clientSecret, billingDetails, submitBtn, submitText, submitLoader, paymentStatus) {
    if (!cardElement || !stripe) {
        return;
    }
    
    // Show processing state
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitLoader.style.display = 'inline';
    hidePaymentStatus();
    
    const paymentModal = document.querySelector('.payment-terminal-overlay');
    
    try {
        // Confirm payment with Stripe, including billing details
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: billingDetails.name,
                    email: billingDetails.email,
                    address: {
                        line1: billingDetails.address.line1,
                        line2: billingDetails.address.line2 || null,
                        city: billingDetails.address.city,
                        state: billingDetails.address.state,
                        postal_code: billingDetails.address.postal_code,
                        country: billingDetails.address.country,
                    }
                }
            }
        });
        
        if (error) {
            // Show error
            showPaymentStatus(error.message.toUpperCase(), 'error');
            paymentModal.classList.add('error');
            submitBtn.disabled = false;
            submitText.style.display = 'inline';
            submitLoader.style.display = 'none';
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            // Success!
            showPaymentStatus('ASSET_SECURED', 'success');
            paymentModal.classList.add('success');
            submitBtn.disabled = true;
            
            // Close modal after 3 seconds
            setTimeout(() => {
                closePaymentTerminal();
            }, 3000);
        }
    } catch (err) {
        console.error('Payment processing error:', err);
        showPaymentStatus('TRANSACTION_FAILED', 'error');
        paymentModal.classList.add('error');
        submitBtn.disabled = false;
        submitText.style.display = 'inline';
        submitLoader.style.display = 'none';
    }
}

function showPaymentStatus(message, type) {
    const paymentStatus = document.getElementById('payment-status');
    if (paymentStatus) {
        paymentStatus.textContent = message;
        paymentStatus.classList.add('show', type);
    }
}

function hidePaymentStatus() {
    const paymentStatus = document.getElementById('payment-status');
    if (paymentStatus) {
        paymentStatus.classList.remove('show', 'success', 'error');
        paymentStatus.textContent = '';
    }
}

function closePaymentTerminal() {
    const paymentModal = document.querySelector('.payment-terminal-overlay');
    if (paymentModal) {
        paymentModal.classList.remove('active', 'success', 'error');
        
        // Clean up Stripe element
        if (cardElement) {
            cardElement.unmount();
            cardElement = null;
        }
        
        // Reset state
        hidePaymentStatus();
        currentPaymentCar = null;
    }
}

// Expose functions to window for cross-module access
window.updateShowroom = updateShowroom;
window.updateSpecOverlay = updateSpecOverlay;
window.initShowroomCarousel = initShowroomCarousel;
window.initXRayScanner = initXRayScanner;
window.setupNavigation = setupNavigation;
window.loadShowroom = loadShowroom;
window.initXRayScanner = initXRayScanner;
window.setupNavigation = setupNavigation;

