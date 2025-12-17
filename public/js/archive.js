// ============================================
// TECHNICAL ARCHIVE - X-RAY SCANNER & CLASSIFIED GRID
// Creative Developer Implementation
// ============================================

// Global garage inventory and current index
let garageInventory = [];
let currentIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    initShowroomCarousel();
    initXRayScanner();
    initClassifiedGrid();
    initStripePayment();
});

// ============================================
// SHOWROOM CAROUSEL LOGIC
// ============================================
async function initShowroomCarousel() {
    // Fetch all cars from API
    try {
        const response = await fetch('/api/cars');
        if (response.ok) {
            garageInventory = await response.json();
            
            if (garageInventory.length === 0) {
                console.warn('No cars found in inventory');
                return;
            }
            
            // Initialize UI
            setupNavigation();
            updateShowroom(0, true); // Initial load without animation
        }
    } catch (error) {
        console.error('Failed to load garage inventory:', error);
    }
}

function setupNavigation() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const actionBtn = document.getElementById('action-btn');
    
    // Previous button
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                updateShowroom(currentIndex - 1);
            }
        });
    }
    
    // Next button
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentIndex < garageInventory.length - 1) {
                updateShowroom(currentIndex + 1);
            }
        });
    }
    
    // Action button
    if (actionBtn) {
        actionBtn.addEventListener('click', handleActionClick);
    }
}

function updateShowroom(index, isInitial = false) {
    if (index < 0 || index >= garageInventory.length) {
        return;
    }
    
    const previousIndex = currentIndex;
    currentIndex = index;
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
            if (car.status === 'LIVE_AUCTION') {
                statusDot.classList.add('active');
            } else if (car.status === 'SOLD') {
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
        const price = car.currentBid || car.price || 0;
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
        if (car.status === 'LIVE_AUCTION') {
            actionText.textContent = 'JOIN AUCTION';
            actionBtn.classList.add('auction-mode');
        } else {
            actionText.textContent = 'BUY NOW';
            actionBtn.classList.remove('auction-mode');
        }
    }
    
    // For initial load, just set content without animation
    if (isInitial) {
        thermalImg.src = car.image || '/assets/photo/porsche_911.png';
        realImg.src = car.image || '/assets/photo/porsche_911.png';
        updateSpecOverlay(car);
        return;
    }
    
    // GSAP Animation: Slide out current, slide in new
    const direction = index > previousIndex ? 1 : -1; // 1 = next, -1 = prev
    const tl = gsap.timeline();
    
    // Slide out current car
    tl.to(carWrapper, {
        x: direction * -100,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in"
    })
    // Update content
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
            duration: 0.5,
            ease: "power2.out"
        }
    );
}

function handleActionClick() {
    const car = garageInventory[currentIndex];
    
    if (!car) return;
    
    if (car.status === 'LIVE_AUCTION') {
        // Scroll to auction section (Screen 3)
        const auctionSection = document.getElementById('auction-section');
        if (auctionSection) {
            auctionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else {
        // Buy Now - Open Payment Terminal
        openPaymentTerminal(car);
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
async function initClassifiedGrid() {
    const assetGrid = document.getElementById('asset-grid');
    
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
        
        // Transform API data to match card structure
        const classifiedAssets = cars.map((car, index) => ({
            code: `REF_${String(index + 1).padStart(3, '0')}`,
            name: `${car.make.toUpperCase()} ${car.model.toUpperCase()}`,
            image: car.image || getPlaceholderImage(car.make),
            price: formatPrice(car.price || car.currentBid || 0),
            status: car.status || 'AVAILABLE',
            year: car.year || 'N/A',
            _id: car._id,
            car: car // Store full car object for later use
        }));
        
        // Render cards
        if (classifiedAssets.length > 0) {
            renderAssetCards(classifiedAssets);
        } else {
            // Show market offline message if no cars are listed
            assetGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: #555; font-family: var(--font-tech, "JetBrains Mono", monospace); text-transform: uppercase; letter-spacing: 2px;"><div style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--thermal-red, #ff3300);">NO_ACTIVE_ASSETS</div><div style="font-size: 0.9rem; opacity: 0.7;">MARKET_OFFLINE</div></div>';
        }
    } catch (error) {
        console.error('Error loading classified assets:', error);
        // Fallback to sample data if API fails
        renderFallbackCards();
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
            status: 'LIVE_AUCTION',
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
    const assetGrid = document.getElementById('asset-grid');
    
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
    
    // Determine if this is an auction car
    const isAuction = asset.car?.isAuction || asset.isAuction || asset.status === 'LIVE_AUCTION';
    const buttonClass = isAuction ? 'btn-card auction' : 'btn-card buy';
    const buttonText = isAuction ? '● PLACE_BID' : 'ACQUIRE_ASSET >';
    
    article.innerHTML = `
        <div class="card-image">
            <img src="${imgSrc}" alt="${asset.name}" loading="lazy" onerror="this.src='${getPlaceholderImage(asset.name.split(' ')[0])}'">
        </div>
        <div class="card-info">
            <div class="card-header">
                <span class="code">${asset.code}</span>
                <span class="status">${asset.status}</span>
            </div>
            <h3>${asset.name}</h3>
            <div class="card-footer">
                <span class="price">${asset.price}</span>
                <button class="${buttonClass}" data-code="${asset.code}">${buttonText}</button>
            </div>
        </div>
    `;
    
    // Add click handler for button
    const btn = article.querySelector('.btn-card');
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleAssetAccess(asset, isAuction);
    });
    
    // Card click handler (only if not clicking button)
    article.addEventListener('click', (e) => {
        // Don't trigger if clicking the button
        if (!e.target.closest('.btn-card')) {
            handleAssetAccess(asset, isAuction);
        }
    });
    
    return article;
}

function handleAssetAccess(asset, isAuction) {
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
        showroomSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Update showroom to display this car
    updateShowroom(carIndex);
    
    // If Buy Now (not auction), open payment terminal after transition
    if (!isAuction) {
        setTimeout(() => {
            if (typeof openPaymentTerminal === 'function') {
                openPaymentTerminal(car);
            }
        }, 800); // Wait for showroom transition to complete
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
            if (car.status === 'LIVE_AUCTION') {
                statusDot.classList.add('active');
            } else if (car.status === 'SOLD') {
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
        const price = car.currentBid || car.price || 0;
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
    // Check if Stripe is loaded
    if (typeof Stripe === 'undefined') {
        console.warn('Stripe.js not loaded. Payment functionality will not work.');
        return;
    }
    
    // Fetch publishable key from server
    try {
        const response = await fetch('/api/payment/config');
        if (!response.ok) {
            throw new Error('Failed to fetch Stripe config');
        }
        const { publishableKey, testMode } = await response.json();
        
        if (!publishableKey) {
            console.error('Stripe publishable key not found');
            return;
        }
        
        // Initialize Stripe with the publishable key from server
        stripe = Stripe(publishableKey);
        
        if (testMode) {
            console.log('✅ Stripe initialized successfully (TEST MODE)');
        } else {
            console.log('✅ Stripe initialized successfully (LIVE MODE)');
        }
    } catch (error) {
        console.error('Failed to initialize Stripe:', error);
        return;
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
    if (!car || !stripe) {
        console.error('Car data or Stripe not available');
        return;
    }
    
    currentPaymentCar = car;
    
    const paymentModal = document.querySelector('.payment-terminal-overlay');
    const terminalCarName = document.getElementById('terminal-car-name');
    const terminalAmount = document.getElementById('terminal-amount');
    const cardElementContainer = document.getElementById('card-element');
    const submitBtn = document.getElementById('submit-payment');
    const submitText = document.getElementById('submit-text');
    const submitLoader = document.getElementById('submit-loader');
    const paymentStatus = document.getElementById('payment-status');
    
    if (!paymentModal || !cardElementContainer) {
        console.error('Payment modal elements not found');
        return;
    }
    
    // Update car name and amount
    if (terminalCarName) {
        terminalCarName.textContent = `${car.make.toUpperCase()} ${car.model.toUpperCase()}`;
    }
    
    const carPrice = car.currentBid || car.price || 0;
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
        await handlePaymentFlow(car, submitBtn, submitText, submitLoader, paymentStatus);
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

