// Main application logic - Page-Aware Architecture
// Detect current page
const currentPath = window.location.pathname;
const isHomePage = currentPath === '/';
const isShowroomPage = currentPath === '/showroom';
const isMarketPage = currentPath === '/market';
const isProfilePage = currentPath === '/profile';
const isPaymentPage = currentPath === '/payment';

let isLoggedIn = false;
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Global Crosshair Cursor
    initGlobalCursor();

    // Initialize global authentication system (works on all pages)
    initGlobalAuth();

    // Page-specific initialization
    if (isHomePage) {
        initHomePage();
    } else if (isShowroomPage) {
        initShowroomPage();
    } else if (isMarketPage) {
        initMarketPage();
    } else if (isProfilePage) {
        initProfilePage();
    } else if (isPaymentPage) {
        initPaymentPage();
    }
});

// ============================================
// GLOBAL AUTHENTICATION SYSTEM
// ============================================
function initGlobalAuth() {
    // Check auth status on page load
    checkAuthStatus();
    
    // Setup login modals (works on all pages)
    setupLoginModals();
    
    // Setup logout button (in navbar)
    setupNavbarLogout();
    
    // Protect navigation links
    protectNavigationLinks();
}

// Global auth status check
async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/status', { 
            credentials: 'include',
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error('Auth check failed');
        }
        
        const data = await response.json();
        isLoggedIn = data.loggedIn || false;
        currentUser = data.user || null;
        
        // Update UI based on auth status
        updateAuthUI(isLoggedIn);
        
        return isLoggedIn;
    } catch (error) {
        console.error('Auth check failed:', error);
        isLoggedIn = false;
        currentUser = null;
        updateAuthUI(false);
        return false;
    }
}

// Update UI based on auth status
function updateAuthUI(loggedIn) {
    // Update lock status on home page
    if (isHomePage) {
        const statusText = document.querySelector('.status-text');
        const shackle = document.querySelector('.shackle');
        
        if (loggedIn) {
            if (statusText) {
                statusText.textContent = "UNLOCKED";
                statusText.style.color = "#00ff00";
            }
            if (shackle) {
                shackle.style.transform = "translateY(-20px)";
            }
        } else {
            if (statusText) {
                statusText.textContent = "LOCKED";
                statusText.style.color = "";
            }
            if (shackle) {
                shackle.style.transform = "";
            }
        }
    }
}

// Setup login modals (works on all pages)
function setupLoginModals() {
    const loginModal = document.getElementById('login-modal');
    const loginFormModal = document.getElementById('login-form-modal');
    
    if (!loginModal && !loginFormModal) {
        // Modals don't exist on this page, skip
        return;
    }
    
    // Login/Join buttons (home page)
    const heroLoginBtn = document.getElementById('hero-login-btn');
    const heroJoinBtn = document.getElementById('hero-join-btn');
    
    if (heroLoginBtn && loginModal) {
        heroLoginBtn.addEventListener('click', () => {
            loginModal.classList.add('active');
        });
    }
    
    if (heroJoinBtn && loginModal) {
        heroJoinBtn.addEventListener('click', () => {
            loginModal.classList.add('active');
        });
    }
    
    // Close modals
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (loginModal) loginModal.classList.remove('active');
            if (loginFormModal) loginFormModal.classList.remove('active');
        });
    });
    
    // Close when clicking outside
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.classList.remove('active');
            }
        });
    }
    
    if (loginFormModal) {
        loginFormModal.addEventListener('click', (e) => {
            if (e.target === loginFormModal) {
                loginFormModal.classList.remove('active');
            }
        });
    }
    
    // Modal switching
    const switchToLogin = document.getElementById('switch-to-login');
    const switchToSignup = document.getElementById('switch-to-signup');
    
    if (switchToLogin && loginModal && loginFormModal) {
        switchToLogin.addEventListener('click', () => {
            loginModal.classList.remove('active');
            loginFormModal.classList.add('active');
        });
    }
    
    if (switchToSignup && loginModal && loginFormModal) {
        switchToSignup.addEventListener('click', () => {
            loginFormModal.classList.remove('active');
            loginModal.classList.add('active');
        });
    }
    
    // OAuth buttons
    const googleBtns = document.querySelectorAll('.btn-oauth.google');
    const githubBtns = document.querySelectorAll('.btn-oauth.github');
    
    googleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = '/auth/google';
        });
    });
    
    githubBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('GitHub OAuth not yet implemented');
        });
    });
    
    // Signup form
    const signupForm = document.getElementById('signup-form');
    const signupError = document.getElementById('signup-error');
    
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (signupError) signupError.classList.remove('show');
            
            const formData = {
                displayName: document.getElementById('signup-name')?.value,
                email: document.getElementById('signup-email')?.value,
                password: document.getElementById('signup-password')?.value
            };
            
            try {
                const response = await fetch('/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Close modals
                    if (loginModal) loginModal.classList.remove('active');
                    if (loginFormModal) loginFormModal.classList.remove('active');
                    
                    // Reload to update auth status
                    window.location.reload();
                } else {
                    if (signupError) {
                        signupError.textContent = data.message || 'Signup failed. Please try again.';
                        signupError.classList.add('show');
                    }
                }
            } catch (err) {
                console.error('Signup error:', err);
                if (signupError) {
                    signupError.textContent = 'Network error. Please try again.';
                    signupError.classList.add('show');
                }
            }
        });
    }
    
    // Login form
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (loginError) loginError.classList.remove('show');
            
            const formData = {
                email: document.getElementById('login-email')?.value,
                password: document.getElementById('login-password')?.value
            };
            
            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Close modals
                    if (loginModal) loginModal.classList.remove('active');
                    if (loginFormModal) loginFormModal.classList.remove('active');
                    
                    // Reload to update auth status
                    window.location.reload();
                } else {
                    if (loginError) {
                        loginError.textContent = data.message || 'Login failed. Please try again.';
                        loginError.classList.add('show');
                    }
                }
            } catch (err) {
                console.error('Login error:', err);
                if (loginError) {
                    loginError.textContent = 'Network error. Please try again.';
                    loginError.classList.add('show');
                }
            }
        });
    }
}

// Setup navbar logout button
function setupNavbarLogout() {
    // Function to setup logout handler
    const attachLogoutHandler = () => {
        const navLogout = document.getElementById('nav-logout');
        if (!navLogout) {
            return false; // Not found yet
        }
        
        // Check if already has handler (avoid duplicate listeners)
        if (navLogout.dataset.handlerAttached === 'true') {
            return true; // Already set up
        }
        
        navLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🔓 Logout button clicked');
            
            try {
                const response = await fetch('/auth/logout', { 
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Logout successful:', data);
                    
                    // Clear local state
                    isLoggedIn = false;
                    currentUser = null;
                    
                    // Redirect to home
                    window.location.href = '/';
                } else {
                    console.warn('⚠️ POST logout failed, trying GET logout');
                    // Fallback: try GET logout
                    window.location.href = '/auth/logout';
                }
            } catch (error) {
                console.error('❌ Logout error:', error);
                // Fallback: try GET logout
                window.location.href = '/auth/logout';
            }
        });
        
        // Mark as attached
        navLogout.dataset.handlerAttached = 'true';
        return true;
    };
    
    // Try immediately
    if (!attachLogoutHandler()) {
        // If not found, try again after a short delay (navbar might still be loading)
        let attempts = 0;
        const maxAttempts = 10;
        const interval = setInterval(() => {
            attempts++;
            if (attachLogoutHandler() || attempts >= maxAttempts) {
                clearInterval(interval);
            }
        }, 100);
    }
}

// Protect navigation links - check auth before navigating
function protectNavigationLinks() {
    // Protect "ENTER SHOP" button/link
    const heroEnterBtn = document.getElementById('hero-enter-btn');
    if (heroEnterBtn) {
        heroEnterBtn.addEventListener('click', async (e) => {
            // Always check auth status (in case it changed)
            const isAuth = await checkAuthStatus();
            
            if (!isAuth) {
                e.preventDefault();
                e.stopPropagation();
                const loginModal = document.getElementById('login-modal');
                if (loginModal) {
                    loginModal.classList.add('active');
                }
                return false;
            }
            // If logged in, allow navigation (link will handle it naturally)
            console.log('✅ User authenticated, allowing navigation to showroom');
        });
    }
    
    // Protect navbar links (they're already protected server-side, but add client-side UX)
    document.addEventListener('click', async (e) => {
        const link = e.target.closest('a[href="/showroom"], a[href="/market"], a[href="/profile"]');
        if (link) {
            // Always check auth status (in case it changed)
            const isAuth = await checkAuthStatus();
            if (!isAuth) {
                e.preventDefault();
                e.stopPropagation();
                // Show login modal if on home page, otherwise redirect to home
                const loginModal = document.getElementById('login-modal');
                if (loginModal && isHomePage) {
                    loginModal.classList.add('active');
                } else {
                    window.location.href = '/';
                }
                return false;
            }
            // If logged in, allow navigation
            console.log('✅ User authenticated, allowing navigation to', link.getAttribute('href'));
        }
    }, true);
}

// ============================================
// HOME PAGE INITIALIZATION
// ============================================
function initHomePage() {
    console.log('🏠 Initializing Home Page...');
    
    // Ensure body has home-page class
    document.body.classList.add('home-page');
    
    // Prevent scrolling initially (only on home page)
    document.body.style.overflowY = "hidden";
    
    // Ensure hero section is visible
    const heroSection = document.getElementById('garage-door-section');
    if (heroSection) {
        heroSection.style.display = 'block';
        heroSection.style.visibility = 'visible';
        heroSection.style.opacity = '1';
    }
    
    // Ensure hero content is visible
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.display = 'block';
        heroContent.style.visibility = 'visible';
    }
    
    // Prevent scroll attempts when not logged in
    let preventScroll = (e) => {
        if (!isLoggedIn) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    };
    
    // Prevent all scroll methods
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('scroll', preventScroll, { passive: false });
    
    // Function to enable scrolling when logged in
    const enableScrolling = () => {
        window.removeEventListener('wheel', preventScroll);
        window.removeEventListener('touchmove', preventScroll);
        window.removeEventListener('scroll', preventScroll);
        document.body.classList.add('scroll-enabled');
        document.body.style.overflowY = "auto";
    };
    
    // Check auth status on load and after OAuth redirect
    checkAuthStatus().then((isAuth) => {
        if (isAuth) {
            enableScrolling();
        }
    });
    
    // Also check after a delay (in case OAuth redirect just happened)
    setTimeout(() => {
        checkAuthStatus().then((isAuth) => {
            if (isAuth) {
                enableScrolling();
            }
        });
    }, 500);
    
    // Check if URL has login success parameter (from OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('login') || urlParams.has('oauth_success')) {
        setTimeout(() => {
            checkAuthStatus().then((isAuth) => {
                if (isAuth) {
                    enableScrolling();
                }
            });
        }, 1000);
    }
    
    console.log('✅ Home Page initialized');
}

// ============================================
// SHOWROOM PAGE INITIALIZATION
// ============================================
function initShowroomPage() {
    console.log('🚗 Initializing Showroom Page...');
    
    // Enable scrolling on showroom page (protected route, user is logged in)
    document.body.style.overflowY = "auto";
    document.body.classList.add('scroll-enabled');
    
    // Ensure showroom section is visible
    const showroomSection = document.getElementById('showroom-section');
    if (showroomSection) {
        showroomSection.style.display = 'block';
        showroomSection.style.visibility = 'visible';
    }
    
    // Wait for archive.js to load, then initialize
    function tryInitialize() {
        // Check if carId is in URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const carId = urlParams.get('carId') || urlParams.get('id');
        
        // Check if functions are available (archive.js might not be loaded yet)
        const hasInitShowroomCarousel = typeof initShowroomCarousel === 'function' || typeof window.initShowroomCarousel === 'function';
        const hasInitXRayScanner = typeof initXRayScanner === 'function' || typeof window.initXRayScanner === 'function';
        
        if (!hasInitShowroomCarousel || !hasInitXRayScanner) {
            console.log('⏳ Waiting for archive.js to load...');
            setTimeout(tryInitialize, 50);
            return;
        }
        
        console.log('✅ archive.js loaded, initializing showroom...');
        
        // Initialize showroom carousel
        if (typeof initShowroomCarousel === 'function') {
            console.log('✅ Calling initShowroomCarousel');
            initShowroomCarousel();
        } else if (typeof window.initShowroomCarousel === 'function') {
            console.log('✅ Calling window.initShowroomCarousel');
            window.initShowroomCarousel();
        }
        
        // Initialize X-Ray scanner
        if (typeof initXRayScanner === 'function') {
            console.log('✅ Calling initXRayScanner');
            initXRayScanner();
        } else if (typeof window.initXRayScanner === 'function') {
            console.log('✅ Calling window.initXRayScanner');
            window.initXRayScanner();
        }
        
        // Load specific car if carId provided
        if (carId) {
            console.log('📦 Loading specific car:', carId);
            if (typeof loadShowroom === 'function') {
                loadShowroom(carId);
            } else if (typeof window.loadShowroom === 'function') {
                window.loadShowroom(carId);
            }
        }
        
        console.log('✅ Showroom Page initialized');
    }
    
    // Start trying to initialize (with initial delay for DOM)
    setTimeout(tryInitialize, 100);
}

// ============================================
// MARKET PAGE INITIALIZATION
// ============================================
function initMarketPage() {
    // Enable scrolling on market page (protected route, user is logged in)
    document.body.style.overflowY = "auto";
    document.body.classList.add('scroll-enabled');
    // Initialize market grid immediately
    if (typeof window.initClassifiedGrid === 'function') {
        window.initClassifiedGrid();
    }
}

// ============================================
// PROFILE PAGE INITIALIZATION
// ============================================
function initProfilePage() {
    // Enable scrolling on profile page (protected route, user is logged in)
    document.body.style.overflowY = "auto";
    document.body.classList.add('scroll-enabled');
    
    // Check if redirected from successful payment
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
        // Show success message
        console.log('✅ Payment successful! Refreshing garage...');
        // Remove the query parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Initialize profile section
    initProfileSection();
}

// ============================================
// PROFILE SECTION - Executive Dashboard
// ============================================

async function initProfileSection() {
    const profileSection = document.getElementById('profile-section');
    if (!profileSection) return;
    
    try {
        // Fetch user data
        const userResponse = await fetch('/auth/status');
        const userStatus = await userResponse.json();
        
        if (!userStatus.loggedIn) {
            // Hide profile section if not logged in
            profileSection.style.display = 'none';
            return;
        }
        
        const user = userStatus.user;
        
        // Fetch user role
        const roleResponse = await fetch('/api/user/role').catch(() => ({ json: () => ({ role: 'user' }) }));
        const roleData = await roleResponse.json();
        const userRole = roleData.role || 'user';
        
        // Populate Identity Column
        populateProfileIdentity(user, userRole);
        
        // Populate Ledger Tabs
        await populateProfileLedger(user, userRole);
        
        // Setup tab switching
        setupProfileTabs();
        
    } catch (error) {
        console.error('Profile initialization error:', error);
    }
}

function populateProfileIdentity(user, userRole) {
    // Avatar
    const avatar = document.getElementById('profile-avatar');
    if (avatar) {
        const patterns = [
            'linear-gradient(135deg, var(--thermal-red) 0%, transparent 50%)',
            'linear-gradient(45deg, var(--thermal-red) 0%, transparent 50%)',
            'linear-gradient(225deg, var(--thermal-red) 0%, transparent 50%)',
            'linear-gradient(315deg, var(--thermal-red) 0%, transparent 50%)'
        ];
        avatar.style.background = patterns[3 % patterns.length];
    }
    
    // Alias
    const alias = document.getElementById('profile-alias');
    if (alias) {
        alias.textContent = user.displayName?.toUpperCase().replace(/\s/g, '_') || 'OPERATOR_01';
    }
    
    // Member Since
    const memberSince = document.getElementById('profile-member-since');
    if (memberSince && user.joinedAt) {
        const date = new Date(user.joinedAt);
        memberSince.textContent = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    } else if (memberSince) {
        memberSince.textContent = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    }
    
    // Account Status
    const status = document.getElementById('profile-status');
    if (status) {
        if (userRole === 'contractor') {
            status.textContent = 'CONTRACTOR';
        } else {
            status.textContent = 'VERIFIED BUYER';
        }
    }
    
    // Operator ID
    const operatorId = document.getElementById('profile-operator-id');
    if (operatorId) {
        operatorId.textContent = user._id ? user._id.toString().substring(0, 8).toUpperCase() : '[REDACTED]';
    }
    
    // Show contractor tab if applicable
    const vaultTab = document.querySelector('.ledger-tab[data-tab="vault"]');
    if (vaultTab && userRole === 'contractor') {
        vaultTab.style.display = 'block';
    }
}

async function populateProfileLedger(user, userRole) {
    // MY GARAGE Tab
    await populateGarageTab();
    
    // ACTIVE BIDS Tab
    await populateBidsTab();
    
    // VAULT MANAGEMENT Tab (Contractor Only)
    if (userRole === 'contractor') {
        await populateVaultTab();
    }
}

async function populateGarageTab() {
    const garageGrid = document.getElementById('profile-garage-grid');
    if (!garageGrid) return;
    
    try {
        const response = await fetch('/api/user/garage');
        const cars = await response.json();
        
        if (cars.length === 0) {
            garageGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.5); font-family: var(--font-tech); letter-spacing: 2px; text-transform: uppercase;">NO_ASSETS_IN_GARAGE</div>';
            return;
        }
        
        garageGrid.innerHTML = cars.map(car => `
            <div class="garage-item">
                <img src="${car.image || '/assets/photo/porsche_911.png'}" alt="${car.make} ${car.model}" class="garage-item-image" onerror="this.src='/assets/photo/porsche_911.png'">
                <div class="garage-item-name">${car.make} ${car.model}</div>
                <div class="garage-item-details">
                    ${car.year || 'N/A'} // ${car.status || 'SOLD'} // $${(car.askingPrice || car.price || 0).toLocaleString()}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading garage:', error);
        garageGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.5); font-family: var(--font-tech); letter-spacing: 2px; text-transform: uppercase;">ERROR_LOADING_GARAGE</div>';
    }
}

async function populateBidsTab() {
    const bidsList = document.getElementById('profile-bids-list');
    if (!bidsList) return;
    
    try {
        const response = await fetch('/api/user/offers');
        if (!response.ok) {
            bidsList.innerHTML = '<div style="text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.5); font-family: var(--font-tech); letter-spacing: 2px; text-transform: uppercase;">NO_OFFERS_YET</div>';
            return;
        }
        
        const userOffers = await response.json();
        
        if (userOffers.length === 0) {
            bidsList.innerHTML = '<div style="text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.5); font-family: var(--font-tech); letter-spacing: 2px; text-transform: uppercase;">NO_OFFERS_YET</div>';
            return;
        }
        
        bidsList.innerHTML = userOffers.map(item => {
            const car = item.car;
            const offer = item.offer;
            let statusClass = '';
            let statusText = '';
            
            if (offer.status === 'accepted') {
                statusClass = 'status-accepted';
                statusText = 'ACCEPTED // PAYMENT_LINK_UNLOCKED';
            } else if (offer.status === 'rejected') {
                statusClass = 'status-rejected';
                statusText = 'OFFER_REJECTED';
            } else {
                statusClass = 'status-pending';
                statusText = 'PENDING_REVIEW';
            }
            
            return `
            <div class="bid-item ${offer.status === 'accepted' ? 'bid-item-clickable' : ''}" ${offer.status === 'accepted' ? `data-car-id="${car._id}"` : ''}>
                <div class="bid-item-info">
                    <div class="bid-item-car">${car.make} ${car.model}</div>
                    <div class="bid-item-amount">$${offer.amount.toLocaleString()}</div>
                    ${offer.message ? `<div class="bid-item-message">"${offer.message}"</div>` : ''}
                </div>
                <div class="bid-item-status ${statusClass}">${statusText}</div>
                <div class="bid-item-date">${new Date(offer.createdAt).toLocaleDateString()}</div>
                ${offer.status === 'accepted' ? '<div class="bid-item-action">PROCEED_TO_PAYMENT →</div>' : ''}
            </div>
        `;
        }).join('');
        
        // Add click handlers for accepted offers
        const acceptedOffers = bidsList.querySelectorAll('.bid-item-clickable');
        acceptedOffers.forEach(item => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                const carId = item.dataset.carId;
                if (carId) {
                    window.location.href = `/payment?id=${carId}`;
                }
            });
        });
    } catch (error) {
        console.error('Error loading offers:', error);
        bidsList.innerHTML = '<div style="text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.5); font-family: var(--font-tech); letter-spacing: 2px; text-transform: uppercase;">ERROR_LOADING_OFFERS</div>';
    }
}

async function populateVaultTab() {
    const vaultList = document.getElementById('profile-vault-list');
    if (!vaultList) return;
    
    try {
        const response = await fetch('/api/contractor/assets').catch(() => {
            // If endpoint doesn't exist or user isn't contractor, return empty
            return { json: () => [] };
        });
        
        if (!response.ok) {
            vaultList.innerHTML = '<div style="text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.5); font-family: var(--font-tech); letter-spacing: 2px; text-transform: uppercase;">ACCESS_DENIED</div>';
            return;
        }
        
        const cars = await response.json();
        
        if (cars.length === 0) {
            vaultList.innerHTML = '<div style="text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.5); font-family: var(--font-tech); letter-spacing: 2px; text-transform: uppercase;">VAULT_EMPTY</div>';
            return;
        }
        
        vaultList.innerHTML = cars.map(car => {
            // Check for pending offers
            const pendingOffers = car.offers ? car.offers.filter(o => o.status === 'pending') : [];
            const hasPendingOffers = pendingOffers.length > 0;
            
            return `
            <div class="vault-item" data-car-id="${car._id}">
                <div class="vault-item-info">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div class="vault-item-name">${car.make} ${car.model}</div>
                        ${hasPendingOffers ? '<span class="offer-alert-icon" title="Pending Offers">⚠️</span>' : ''}
                    </div>
                    <div class="vault-item-status">${car.isListed ? 'DEPLOYED' : 'SECURED'}</div>
                    ${hasPendingOffers ? `<div class="vault-item-offers-count">${pendingOffers.length} PENDING_OFFER${pendingOffers.length > 1 ? 'S' : ''}</div>` : ''}
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="vault-item-action" data-action="view-offers" data-car-id="${car._id}">
                        ${hasPendingOffers ? 'REVIEW_OFFERS' : 'VIEW'}
                    </button>
                    <button class="vault-item-action" data-action="toggle-deploy" data-car-id="${car._id}" data-listed="${car.isListed}">
                        ${car.isListed ? 'RECALL' : 'DEPLOY'}
                    </button>
                </div>
            </div>
        `;
        }).join('');
        
        // Setup vault action buttons
        const vaultActions = vaultList.querySelectorAll('.vault-item-action');
        vaultActions.forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.dataset.action;
                const carId = btn.dataset.carId;
                
                if (action === 'view-offers') {
                    await showOffersModal(carId);
                    return;
                }
                
                if (action === 'toggle-deploy') {
                    try {
                        const response = await fetch(`/api/cars/${carId}/toggle-deploy`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        
                        if (response.ok) {
                            // Reload vault tab
                            await populateVaultTab();
                            // Also refresh marketplace if needed
                            if (typeof window.initClassifiedGrid === 'function') {
                                window.initClassifiedGrid();
                            }
                        }
                    } catch (error) {
                        console.error('Error toggling deploy:', error);
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error loading vault:', error);
        vaultList.innerHTML = '<div style="text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.5); font-family: var(--font-tech); letter-spacing: 2px; text-transform: uppercase;">ERROR_LOADING_VAULT</div>';
    }
}

// Show Offers Modal for Contractor
async function showOffersModal(carId) {
    try {
        const response = await fetch(`/api/cars/${carId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch car data');
        }
        
        const car = await response.json();
        const pendingOffers = car.offers ? car.offers.filter(o => o.status === 'pending') : [];
        
        if (pendingOffers.length === 0) {
            alert('No pending offers for this car');
            return;
        }
        
        // Create modal HTML
        const modalHTML = `
            <div class="offers-modal-overlay" id="offers-modal">
                <div class="offers-modal-content">
                    <div class="offers-modal-header">
                        <h2>INCOMING_OFFERS</h2>
                        <span class="offers-modal-car">${car.make} ${car.model}</span>
                        <button class="offers-modal-close" id="close-offers-modal">X</button>
                    </div>
                    <div class="offers-modal-body">
                        ${pendingOffers.map(offer => `
                            <div class="offer-item">
                                <div class="offer-item-info">
                                    <div class="offer-item-alias">[${offer.alias}]</div>
                                    <div class="offer-item-amount">$${offer.amount.toLocaleString()}</div>
                                    ${offer.message ? `<div class="offer-item-message">"${offer.message}"</div>` : ''}
                                    <div class="offer-item-date">${new Date(offer.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div class="offer-item-actions">
                                    <button class="offer-accept-btn" data-car-id="${car._id}" data-offer-id="${offer._id}">ACCEPT</button>
                                    <button class="offer-decline-btn" data-car-id="${car._id}" data-offer-id="${offer._id}">DECLINE</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('offers-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Setup event listeners
        const modal = document.getElementById('offers-modal');
        const closeBtn = document.getElementById('close-offers-modal');
        const acceptBtns = modal.querySelectorAll('.offer-accept-btn');
        const declineBtns = modal.querySelectorAll('.offer-decline-btn');
        
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        acceptBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const carId = btn.dataset.carId;
                const offerId = btn.dataset.offerId;
                await handleOfferAction(carId, offerId, 'accept');
            });
        });
        
        declineBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const carId = btn.dataset.carId;
                const offerId = btn.dataset.offerId;
                await handleOfferAction(carId, offerId, 'decline');
            });
        });
        
    } catch (error) {
        console.error('Error showing offers modal:', error);
        alert('Failed to load offers: ' + error.message);
    }
}

// Handle offer accept/decline
async function handleOfferAction(carId, offerId, action) {
    try {
        const response = await fetch(`/api/cars/${carId}/offers/${offerId}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to process offer');
        }
        
        // Close modal
        const modal = document.getElementById('offers-modal');
        if (modal) {
            modal.remove();
        }
        
        // Reload vault tab
        await populateVaultTab();
        
        alert(`Offer ${action === 'accept' ? 'ACCEPTED' : 'DECLINED'}`);
        
    } catch (error) {
        console.error(`Error ${action}ing offer:`, error);
        alert(`Failed to ${action} offer: ${error.message}`);
    }
}

function setupProfileTabs() {
    const tabs = document.querySelectorAll('.ledger-tab');
    const panels = document.querySelectorAll('.ledger-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active panel
            panels.forEach(p => p.classList.remove('active'));
            const targetPanel = document.getElementById(`ledger-${targetTab}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

// ============================================
// TERMINAL DASHBOARD FUNCTIONS REMOVED
// ============================================
// renderGarage, renderHistory, renderBids, userGarage, transactionHistory
// These were used by the old terminal section and have been replaced by profile page functions:
// - populateGarageTab() - replaces renderGarage()
// - populateBidsTab() - replaces renderBids()  
// - populateVaultTab() - new function for contractor vault
// ============================================

// Global state for user's bids (used by profile page)
let userBids = [];

async function loadBidHistory() {
    try {
        const response = await fetch('/api/user/bids');
        if (response.ok) {
            const bids = await response.json();
            userBids = bids.map(bid => ({
                id: bid._id || bid.id,
                carId: bid.car?._id || bid.car?.id,
                asset: bid.car ? `${bid.car.make || ''} ${bid.car.model || ''}`.trim() : 'UNKNOWN_ASSET',
                amount: bid.amount,
                date: new Date(bid.timestamp).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                timestamp: bid.timestamp,
                status: bid.car?.status === 'SOLD' ? 'CLOSED' : 'ACTIVE'
            }));
        } else {
            userBids = [];
        }
    } catch (error) {
        console.error('Error loading bid history:', error);
        userBids = [];
    }
}


async function handleViewAsset(carId) {
    try {
        // Fetch car data
        const response = await fetch(`/api/cars/${carId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch car data');
        }
        
        const car = await response.json();
        
        // Hide terminal
        const terminalSection = document.getElementById('terminal-section');
        if (terminalSection) {
            terminalSection.style.opacity = '0';
            terminalSection.style.pointerEvents = 'none';
            terminalSection.style.display = 'none';
            terminalSection.classList.remove('active');
        }
        
        // Load car into showroom
        // Check if garageInventory exists (from archive.js)
        if (typeof window.garageInventory !== 'undefined' && Array.isArray(window.garageInventory) && window.garageInventory.length > 0) {
            // Find car index in garageInventory
            const carIndex = window.garageInventory.findIndex(c => {
                const cId = c._id || c.id;
                return cId && cId.toString() === carId.toString();
            });
            
            if (carIndex !== -1 && typeof window.updateShowroom === 'function') {
                // Update currentIndex and call updateShowroom
                if (typeof window.currentIndex !== 'undefined') {
                    window.currentIndex = carIndex;
                }
                window.updateShowroom(carIndex);
            } else {
                // Add car to inventory if not found
                window.garageInventory.push(car);
                if (typeof window.updateShowroom === 'function') {
                    if (typeof window.currentIndex !== 'undefined') {
                        window.currentIndex = window.garageInventory.length - 1;
                    }
                    window.updateShowroom(window.garageInventory.length - 1);
                } else if (typeof window.updateSpecOverlay === 'function') {
                    window.updateSpecOverlay(car);
                }
            }
        } else {
            // If garageInventory doesn't exist, try to initialize it
            if (typeof window.initShowroomCarousel === 'function') {
                await window.initShowroomCarousel();
                // Wait a bit for inventory to load, then try again
                setTimeout(() => {
                    if (typeof window.garageInventory !== 'undefined' && Array.isArray(window.garageInventory)) {
                        const carIndex = window.garageInventory.findIndex(c => {
                            const cId = c._id || c.id;
                            return cId && cId.toString() === carId.toString();
                        });
                        if (carIndex !== -1 && typeof window.updateShowroom === 'function') {
                            if (typeof window.currentIndex !== 'undefined') {
                                window.currentIndex = carIndex;
                            }
                            window.updateShowroom(carIndex);
                        } else if (typeof window.updateSpecOverlay === 'function') {
                            window.updateSpecOverlay(car);
                        }
                    }
                }, 500);
            } else if (typeof window.updateSpecOverlay === 'function') {
                window.updateSpecOverlay(car);
            }
        }
        
        // Navigation handled by routing - no scroll needed
        
    } catch (error) {
        console.error('View asset error:', error);
        alert('Failed to load asset: ' + error.message);
    }
}

// setupLedgerTabs removed - replaced by profile page ledger tabs


// setupBackButton removed - terminal replaced by profile page

// setupLogoutButton removed - logout handled by navbar.js and setupNavbarLogout()

// setupSidebarNav removed - replaced by profile page layout

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// showTerminal removed - terminal replaced by profile page

// initTerminalTrigger removed - terminal replaced by profile page

// ============================================
// GLOBAL CROSSHAIR CURSOR
// ============================================
function initGlobalCursor() {
    const globalCursor = document.getElementById('global-cursor');
    
    if (!globalCursor) {
        console.warn('Global cursor element not found');
        return;
    }
    
    let mouseX = 0;
    let mouseY = 0;
    
    // Track mouse movement globally
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Smooth cursor follow - use direct style updates for accuracy
    let currentX = 0;
    let currentY = 0;
    
    function updateCursor() {
        // Smooth interpolation
        currentX += (mouseX - currentX) * 0.15;
        currentY += (mouseY - currentY) * 0.15;
        
        // Apply position with CSS transform (works with translate(-50%, -50%))
        globalCursor.style.left = currentX + 'px';
        globalCursor.style.top = currentY + 'px';
        
        requestAnimationFrame(updateCursor);
    }
    
    // Hide cursor when mouse leaves window
    document.addEventListener('mouseleave', () => {
        globalCursor.style.opacity = '0';
    });
    
    document.addEventListener('mouseenter', () => {
        globalCursor.style.opacity = '1';
    });
    
    // Start cursor animation loop
    updateCursor();
}

// ============================================
// PAYMENT PAGE INITIALIZATION
// ============================================
let paymentStripe = null;
let paymentElements = null; // The Elements instance
let paymentElement = null; // The Payment Element
let paymentPageCar = null; // Renamed to avoid conflict with archive.js
let paymentPageOffer = null; // Renamed to avoid conflict

async function initPaymentPage() {
    console.log('💳 Initializing Payment Page...');
    
    // Enable scrolling
    document.body.style.overflowY = "auto";
    
    // Get car ID from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('id') || urlParams.get('carId');
    
    if (!carId) {
        console.error('❌ No car ID in URL');
        showPaymentError('Invalid payment link. Missing car ID.');
        setTimeout(() => {
            window.location.href = '/profile';
        }, 3000);
        return;
    }
    
    // Fetch car details and verify security
    try {
        await loadPaymentCar(carId);
    } catch (error) {
        console.error('❌ Error loading payment car:', error);
        showPaymentError('Failed to load payment details.');
        setTimeout(() => {
            window.location.href = '/profile';
        }, 3000);
    }
}

async function loadPaymentCar(carId) {
    try {
        // Fetch car data
        const carResponse = await fetch(`/api/cars/${carId}`);
        if (!carResponse.ok) {
            throw new Error('Car not found');
        }
        
        const car = await carResponse.json();
        paymentPageCar = car;
        
        // SECURITY CHECK: Verify user has accepted offer
        const userResponse = await fetch('/auth/status');
        if (!userResponse.ok) {
            throw new Error('Not authenticated');
        }
        
        const userData = await userResponse.json();
        if (!userData.loggedIn || !userData.user) {
            throw new Error('Not authenticated');
        }
        
        const userId = userData.user._id || userData.user.id;
        const acceptedOffer = car.offers && car.offers.find(offer => {
            const offerUserId = offer.userId?._id?.toString() || offer.userId?.toString() || offer.userId;
            return offerUserId === userId.toString() && offer.status === 'accepted';
        });
        
        if (!acceptedOffer) {
            console.error('❌ User does not have accepted offer for this car');
            showPaymentError('Unauthorized: You do not have an accepted offer for this asset.');
            setTimeout(() => {
                window.location.href = '/profile?error=unauthorized';
            }, 3000);
            return;
        }
        
        paymentPageOffer = acceptedOffer;
        
        // Populate manifest
        populateManifest(car, acceptedOffer, userData.user);
        
        // Initialize Stripe and load payment form
        await initializeStripePayment(car, acceptedOffer);
        
    } catch (error) {
        console.error('Error loading payment car:', error);
        throw error;
    }
}

function populateManifest(car, offer, user) {
    // Car image
    const carImage = document.getElementById('manifest-car-image');
    if (carImage) {
        carImage.src = car.image || '/assets/photo/porsche_911.png';
    }
    
    // Asset ref
    const assetRef = document.getElementById('manifest-asset-ref');
    if (assetRef) {
        const refId = car._id ? car._id.toString().slice(-6).toUpperCase() : '000000';
        assetRef.textContent = `_${refId}`;
    }
    
    // Buyer ID
    const buyerId = document.getElementById('manifest-buyer-id');
    if (buyerId) {
        buyerId.textContent = offer.alias || user.displayName || user.email || 'UNKNOWN';
    }
    
    // Agreed price
    const agreedPrice = document.getElementById('manifest-agreed-price');
    if (agreedPrice) {
        agreedPrice.textContent = `$${offer.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Status
    const status = document.getElementById('manifest-status');
    if (status) {
        status.textContent = 'AWAITING_FUNDS';
    }
}

async function initializeStripePayment(car, offer) {
    try {
        // Initialize Stripe
        if (typeof Stripe === 'undefined') {
            throw new Error('Stripe.js library not loaded');
        }
        
        // Fetch Stripe config
        const configResponse = await fetch('/api/payment/config');
        if (!configResponse.ok) {
            throw new Error('Failed to fetch Stripe config');
        }
        
        const { publishableKey, testMode } = await configResponse.json();
        if (!publishableKey) {
            throw new Error('Stripe publishable key not found');
        }
        
        // Show test mode indicator if in test mode
        let testModeIndicator = document.getElementById('test-mode-indicator');
        if (testMode && testModeIndicator) {
            testModeIndicator.style.display = 'block';
            console.log('🧪 Stripe Test Mode Active');
        }
        
        paymentStripe = Stripe(publishableKey);
        console.log('✅ Stripe initialized', testMode ? '(TEST MODE)' : '(LIVE MODE)');
        
        // Create payment intent
        const intentResponse = await fetch('/api/payment/create-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                carId: car._id
            })
        });
        
        if (!intentResponse.ok) {
            const errorData = await intentResponse.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ Payment intent creation failed:', {
                status: intentResponse.status,
                statusText: intentResponse.statusText,
                error: errorData
            });
            throw new Error(errorData.message || errorData.error || errorData.details || 'Failed to create payment intent');
        }
        
        const { clientSecret, testMode: intentTestMode } = await intentResponse.json();
        
        // Ensure test mode indicator is shown if in test mode
        if (intentTestMode && testModeIndicator) {
            testModeIndicator.style.display = 'block';
        }
        
        // Create and mount Payment Element with dark terminal theme
        const elements = paymentStripe.elements({
            clientSecret: clientSecret,
            appearance: {
                theme: 'night',
                variables: {
                    colorPrimary: '#ff3300',
                    colorBackground: '#0a0a0a',
                    colorText: '#ffffff',
                    colorDanger: '#ff3300',
                    colorSuccess: '#00ff00',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSizeBase: '14px',
                    spacingUnit: '8px',
                    borderRadius: '0px',
                    colorTextSecondary: 'rgba(255, 255, 255, 0.7)',
                    colorTextPlaceholder: 'rgba(255, 255, 255, 0.4)'
                },
                rules: {
                    '.Input': {
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        color: '#ffffff',
                        padding: '1rem 1.25rem',
                        fontSize: '14px',
                        fontFamily: '"JetBrains Mono", monospace',
                        borderRadius: '0px',
                        boxShadow: 'none'
                    },
                    '.Input:focus': {
                        border: '1px solid #ff3300',
                        boxShadow: '0 0 15px rgba(255, 51, 0, 0.4)',
                        outline: 'none'
                    },
                    '.Input--invalid': {
                        borderColor: '#ff3300',
                        boxShadow: '0 0 10px rgba(255, 51, 0, 0.3)'
                    },
                    '.Label': {
                        color: '#ffffff',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        fontWeight: '700',
                        marginBottom: '0.5rem'
                    },
                    '.Tab': {
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        color: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '0px'
                    },
                    '.Tab--selected': {
                        backgroundColor: '#0a0a0a',
                        borderColor: '#ff3300',
                        color: '#ffffff',
                        boxShadow: '0 0 10px rgba(255, 51, 0, 0.3)'
                    },
                    '.TabLabel': {
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }
                }
            }
        });
        
        // Store the Elements instance for confirmPayment
        paymentElements = elements;
        paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');
        
        // Hide loader, show form
        const loader = document.getElementById('payment-loader');
        const container = document.getElementById('payment-element-container');
        if (loader) loader.style.display = 'none';
        if (container) container.style.display = 'block';
        
        // Setup form submission
        setupPaymentSubmission(clientSecret, car);
        
    } catch (error) {
        console.error('❌ Error initializing Stripe payment:', error);
        showPaymentError(error.message || 'Failed to initialize payment system.');
    }
}

function setupPaymentSubmission(clientSecret, car) {
    const submitBtn = document.getElementById('authorize-transfer-btn');
    const authorizeText = document.getElementById('authorize-text');
    const authorizeLoader = document.getElementById('authorize-loader');
    
    if (!submitBtn) return;
    
    // Listen for changes in payment element
    paymentElement.on('ready', () => {
        submitBtn.disabled = false;
    });
    
    paymentElement.on('change', (event) => {
        if (event.complete) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    });
    
    // Handle form submission
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (submitBtn.disabled) return;
        
        submitBtn.disabled = true;
        authorizeText.style.display = 'none';
        authorizeLoader.style.display = 'inline';
        
        try {
            // Use the Elements instance, not an object wrapper
            if (!paymentElements) {
                throw new Error('Payment elements not initialized');
            }
            
            const { error, paymentIntent } = await paymentStripe.confirmPayment({
                elements: paymentElements,
                confirmParams: {
                    return_url: `${window.location.origin}/profile?payment=success`
                },
                redirect: 'if_required'
            });
            
            if (error) {
                showPaymentError(error.message);
                submitBtn.disabled = false;
                authorizeText.style.display = 'inline';
                authorizeLoader.style.display = 'none';
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Payment succeeded
                showPaymentSuccess();
                
                // Update car status to SOLD and assign owner
                const updateSuccess = await updateCarStatus(car._id);
                
                if (updateSuccess) {
                    console.log('✅ Car ownership updated. Redirecting to profile...');
                    // Redirect to profile with success parameter
                    setTimeout(() => {
                        window.location.href = '/profile?payment=success';
                    }, 2000);
                } else {
                    console.error('⚠️ Payment succeeded but failed to update car status');
                    // Still redirect but without success parameter
                    setTimeout(() => {
                        window.location.href = '/profile';
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Payment submission error:', error);
            showPaymentError(error.message || 'Payment failed. Please try again.');
            submitBtn.disabled = false;
            authorizeText.style.display = 'inline';
            authorizeLoader.style.display = 'none';
        }
    });
}

async function updateCarStatus(carId) {
    try {
        console.log('🔄 Updating car status to SOLD and assigning ownership...');
        const response = await fetch(`/api/cars/${carId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                status: 'SOLD'
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ Failed to update car status:', errorData);
            return false;
        }
        
        const updatedCar = await response.json();
        console.log('✅ Car status updated successfully:', updatedCar.make, updatedCar.model, 'Owner:', updatedCar.owner);
        return true;
    } catch (error) {
        console.error('❌ Error updating car status:', error);
        return false;
    }
}

function showPaymentError(message) {
    const statusEl = document.getElementById('payment-status');
    if (statusEl) {
        statusEl.textContent = message.toUpperCase();
        statusEl.className = 'payment-status show error';
    }
}

function showPaymentSuccess() {
    const statusEl = document.getElementById('payment-status');
    if (statusEl) {
        statusEl.textContent = 'WIRE RECEIVED // ASSET SECURED';
        statusEl.className = 'payment-status show success';
    }
    
    // Update manifest status
    const manifestStatus = document.getElementById('manifest-status');
    if (manifestStatus) {
        manifestStatus.textContent = 'PAYMENT_COMPLETE';
        manifestStatus.style.color = '#00ff00';
        manifestStatus.style.animation = 'none';
    }
}