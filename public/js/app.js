// Main application logic - Page-Aware Architecture
// Detect current page
const currentPath = window.location.pathname;
const isHomePage = currentPath === '/';
const isShowroomPage = currentPath === '/showroom';
const isMarketPage = currentPath === '/market';
const isProfilePage = currentPath === '/profile';

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
    // Prevent scrolling initially (only on home page)
    document.body.style.overflowY = "hidden";
    
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
    
    // Home page initialization complete
}

// ============================================
// SHOWROOM PAGE INITIALIZATION
// ============================================
function initShowroomPage() {
    // Enable scrolling on showroom page (protected route, user is logged in)
    document.body.style.overflowY = "auto";
    document.body.classList.add('scroll-enabled');
    // Check if carId is in URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('carId');
    
    // Initialize showroom immediately (no scroll trigger needed)
    if (typeof window.initShowroomCarousel === 'function') {
        window.initShowroomCarousel();
    }
    
    // Load specific car if carId provided
    if (carId && typeof window.loadShowroom === 'function') {
        window.loadShowroom(carId);
    } else if (typeof window.initXRayScanner === 'function') {
        window.initXRayScanner();
    }
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
                    ${car.year || 'N/A'} // ${car.status || 'AVAILABLE'} // $${(car.price || 0).toLocaleString()}
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
        const response = await fetch('/api/user/bids');
        const bids = await response.json();
        
        if (bids.length === 0) {
            bidsList.innerHTML = '<div style="text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.5); font-family: var(--font-tech); letter-spacing: 2px; text-transform: uppercase;">NO_ACTIVE_BIDS</div>';
            return;
        }
        
        bidsList.innerHTML = bids.map(bid => {
            const car = bid.car || {};
            const timestamp = new Date(bid.timestamp);
            const isActive = car.status === 'LIVE_AUCTION' || car.isAuction;
            
            return `
                <div class="bid-item">
                    <div class="bid-item-info">
                        <div class="bid-item-name">${car.make || 'UNKNOWN'} ${car.model || ''}</div>
                        <div class="bid-item-meta">${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}</div>
                    </div>
                    <div class="bid-item-amount">$${bid.amount.toLocaleString()}</div>
                    <div class="bid-item-status">${isActive ? 'ACTIVE' : 'CLOSED'}</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading bids:', error);
        bidsList.innerHTML = '<div style="text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.5); font-family: var(--font-tech); letter-spacing: 2px; text-transform: uppercase;">ERROR_LOADING_BIDS</div>';
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
        
        vaultList.innerHTML = cars.map(car => `
            <div class="vault-item">
                <div class="vault-item-info">
                    <div class="vault-item-name">${car.make} ${car.model}</div>
                    <div class="vault-item-status">${car.isListed ? 'DEPLOYED' : 'SECURED'}</div>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <a href="/showroom?carId=${car._id}" class="vault-item-action" style="text-decoration: none; display: inline-block; padding: 0.5rem 1rem;">VIEW</a>
                    <button class="vault-item-action" data-car-id="${car._id}" data-listed="${car.isListed}">
                        ${car.isListed ? 'RECALL' : 'DEPLOY'}
                    </button>
                </div>
            </div>
        `).join('');
        
        // Setup vault action buttons
        const vaultActions = vaultList.querySelectorAll('.vault-item-action');
        vaultActions.forEach(btn => {
            btn.addEventListener('click', async () => {
                const carId = btn.dataset.carId;
                const isListed = btn.dataset.listed === 'true';
                
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
            });
        });
    } catch (error) {
        console.error('Error loading vault:', error);
        vaultList.innerHTML = '<div style="text-align: center; padding: 4rem 2rem; color: rgba(255,255,255,0.5); font-family: var(--font-tech); letter-spacing: 2px; text-transform: uppercase;">ERROR_LOADING_VAULT</div>';
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

// Duplicate initTerminalTrigger removed