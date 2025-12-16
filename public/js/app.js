// Main application logic
// Wait for DOM
let isLoggedIn = false; // Declare the variable

document.addEventListener('DOMContentLoaded', () => {
    
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Global Crosshair Cursor
    initGlobalCursor();

    const doorSection = document.getElementById('garage-door-section');
    const doorContainer = document.querySelector('.door-container');
    const heroTitle = document.querySelector('.hero-title');
    const lock = document.getElementById('auth-trigger');
    const modal = document.getElementById('login-modal');
    const closeModal = document.querySelector('.close-modal');

    // X-Ray Scanner logic moved to archive.js
    

    // Prevent scrolling initially
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
    
    // Check Login Status on Load
    fetch('/auth/status')
    .then(res => res.json())
    .then(data => {
        if (data.loggedIn) {
            isLoggedIn = true;
            // Update the lock visually to look "Unlocked"
            document.querySelector('.status-text').textContent = "UNLOCKED";
            document.querySelector('.status-text').style.color = "#00ff00";
            document.querySelector('.shackle').style.transform = "translateY(-20px)"; // Pop the lock open
            
            // Allow scroll - remove event listeners and enable scrolling
            window.removeEventListener('wheel', preventScroll);
            window.removeEventListener('touchmove', preventScroll);
            window.removeEventListener('scroll', preventScroll);
            document.body.classList.add('scroll-enabled');
            document.body.style.overflowY = "auto";
            
            // Initialize scroll animations now that user is logged in
            initScrollAnimation();
        }
    })
    .catch(err => {
        console.error('Auth check failed:', err);
        // Keep scroll disabled if auth check fails
    });

    // 1. Lock Interaction
    lock.addEventListener('click', () => {
        if (!isLoggedIn) {
            modal.classList.add('active');
        } else {
            // If logged in, click opens the door automatically
            window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
        }
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Handle OAuth button clicks (works for both modals)
    const googleBtns = document.querySelectorAll('.btn-oauth.google');
    const githubBtns = document.querySelectorAll('.btn-oauth.github');
    
    googleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = '/auth/google';
        });
    });
    
    githubBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // GitHub OAuth would go here when implemented
            console.log('GitHub OAuth not yet implemented');
        });
    });
    
    // Modal switching
    const loginFormModal = document.getElementById('login-form-modal');
    const switchToLogin = document.getElementById('switch-to-login');
    const switchToSignup = document.getElementById('switch-to-signup');
    
    if (switchToLogin) {
        switchToLogin.addEventListener('click', () => {
            modal.classList.remove('active');
            loginFormModal.classList.add('active');
        });
    }
    
    if (switchToSignup) {
        switchToSignup.addEventListener('click', () => {
            loginFormModal.classList.remove('active');
            modal.classList.add('active');
        });
    }
    
    // Close login form modal
    loginFormModal.addEventListener('click', (e) => {
        if (e.target === loginFormModal || e.target.classList.contains('close-modal')) {
            loginFormModal.classList.remove('active');
        }
    });
    
    // Handle Signup Form
    const signupForm = document.getElementById('signup-form');
    const signupError = document.getElementById('signup-error');
    
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            signupError.classList.remove('show');
            
            const formData = {
                displayName: document.getElementById('signup-name').value,
                email: document.getElementById('signup-email').value,
                password: document.getElementById('signup-password').value
            };
            
            try {
                const response = await fetch('/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Success - reload page to update login status
                    window.location.reload();
                } else {
                    // Show error
                    signupError.textContent = data.message || 'Signup failed. Please try again.';
                    signupError.classList.add('show');
                }
            } catch (err) {
                signupError.textContent = 'Network error. Please try again.';
                signupError.classList.add('show');
                console.error('Signup error:', err);
            }
        });
    }
    
    // Handle Login Form
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.classList.remove('show');
            
            const formData = {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value
            };
            
            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Success - reload page to update login status
                    window.location.reload();
                } else {
                    // Show error
                    loginError.textContent = data.message || 'Login failed. Please try again.';
                    loginError.classList.add('show');
                }
            } catch (err) {
                loginError.textContent = 'Network error. Please try again.';
                loginError.classList.add('show');
                console.error('Login error:', err);
            }
        });
    }

    // 2. The Garage Door Scroll Animation - Hyper-Realistic
    // Telescoping panels, parallax background, chain animation
    // Only initialize when logged in
    let doorTimeline = null;
    
    function initScrollAnimation() {
        if (doorTimeline) return; // Already initialized
        
        const doorSection = document.getElementById('garage-door-section');
        const doorPanels = document.querySelectorAll('.door-panel');
        const parallaxBg = document.querySelector('.parallax-bg');
        const parallaxImg = document.getElementById('parallax-img');
        const chainTracks = document.querySelectorAll('.chain-track');
        const heroTitle = document.querySelector('.hero-title');
        
        if (!doorSection || doorPanels.length === 0) {
            console.warn('Door elements not found for animation');
            return;
        }
        
        // Load featured car image for parallax background
        if (parallaxImg) {
            fetch('/api/cars/featured')
                .then(res => res.json())
                .then(car => {
                    if (car && car.image) {
                        parallaxImg.src = car.image;
                    }
                })
                .catch(err => console.warn('Could not load featured car for parallax'));
        }
        
        // Pin the section and create scroll-triggered animation
        doorTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: "#garage-door-section",
                start: "top top",
                end: "+=100%", // Scroll distance equal to viewport height
                scrub: 1, // Smooth scrubbing tied to scroll
                pin: true, // Keep the section pinned while scrolling
                anticipatePin: 1,
            }
        });

        // Telescoping Effect: Panels slide up with stagger
        // Bottom panel pushes top ones up, creating realistic garage door motion
        doorPanels.forEach((panel, index) => {
            // Reverse order: bottom panel (index 4) moves first, top panel (index 0) moves last
            const reverseIndex = doorPanels.length - 1 - index;
            doorTimeline.to(panel, {
                yPercent: -100, // Slide up completely
                ease: "none"
            }, reverseIndex * 0.05); // Stagger: 0.05s delay between panels
        });

        // Parallax Background: Move up and increase brightness as door opens
        if (parallaxBg && parallaxImg) {
            doorTimeline.to(parallaxImg, {
                yPercent: -20, // Move background image up slightly
                ease: "power2.out"
            }, 0)
            .to(parallaxBg, {
                filter: "brightness(0.6) blur(1px)", // Increase brightness as door opens
                ease: "power2.out"
            }, 0);
        }

        // Chain Track Animation: Background position moves to simulate chain movement
        chainTracks.forEach(track => {
            doorTimeline.to(track, {
                backgroundPosition: "0 100%", // Move chain pattern down
                ease: "none"
            }, 0);
        });

        // Hero Title: Fade out and slight parallax
        if (heroTitle) {
            doorTimeline.to(heroTitle, {
                xPercent: 10, // Slight parallax movement
                opacity: 0,
                ease: "power2.out"
            }, 0.3); // Start fading after door starts opening
        }
    }

    // Auction logic moved to auction.js
    
    // Initialize Terminal Dashboard
    initTerminal();
    
    // Initialize Secret Terminal Trigger
    initTerminalTrigger();
    
}); // End of DOMContentLoaded

// ============================================
// TERMINAL DASHBOARD (Screen 4 - Cyber-Industrial Command Center)
// ============================================

// Global state for user's garage
let userGarage = [];
let transactionHistory = [];

async function initTerminal() {
    const terminalSection = document.getElementById('terminal-section');
    if (!terminalSection) return;
    
    try {
        // Fetch user data from API
        const [userResponse, garageResponse, roleResponse] = await Promise.all([
            fetch('/auth/status'),
            fetch('/api/user/garage').catch(() => ({ json: () => ({}) })),
            fetch('/api/user/role').catch(() => ({ json: () => ({ role: 'user' }) }))
        ]);
        
        const userStatus = await userResponse.json();
        const garageData = await garageResponse.json();
        const roleData = await roleResponse.json();
        
        if (!userStatus.loggedIn) {
            console.warn('User not logged in, using mock data');
            initTerminalWithMockData();
            return;
        }
        
        const user = userStatus.user;
        const userRole = roleData.role || 'user';
        
        // Populate Profile Module
        const operatorAlias = document.getElementById('operator-alias');
        const operatorLevel = document.getElementById('operator-level');
        const operatorId = document.getElementById('operator-id');
        const geometricAvatar = document.getElementById('geometric-avatar');
        
        if (operatorAlias) operatorAlias.textContent = user.displayName?.toUpperCase().replace(/\s/g, '_') || 'OPERATOR_01';
        if (operatorLevel) operatorLevel.textContent = `LEVEL_${String(userRole === 'contractor' ? 9 : 4).padStart(2, '0')}`;
        if (operatorId) operatorId.textContent = `ID: ${user._id || user.id || 'REDACTED'}`;
        
        // Generate geometric avatar pattern
        if (geometricAvatar) {
            const level = userRole === 'contractor' ? 9 : 4;
            const patterns = [
                'linear-gradient(135deg, var(--thermal-red) 0%, transparent 50%)',
                'linear-gradient(45deg, var(--thermal-red) 0%, transparent 50%)',
                'linear-gradient(225deg, var(--thermal-red) 0%, transparent 50%)',
                'linear-gradient(315deg, var(--thermal-red) 0%, transparent 50%)'
            ];
            geometricAvatar.style.background = patterns[level % patterns.length];
        }
        
        // Populate Satellite Module
        const radarPulse = document.getElementById('radar-pulse');
        const satelliteCoords = document.getElementById('satellite-coords');
        
        const location = { x: 40, y: 60 }; // Default location
        if (radarPulse) {
            radarPulse.style.left = `${location.x}%`;
            radarPulse.style.top = `${location.y}%`;
        }
        
        if (satelliteCoords) {
            const lat = (90 - (location.y * 1.8)).toFixed(2);
            const lon = (-180 + (location.x * 3.6)).toFixed(2);
            satelliteCoords.textContent = `${lat}°N, ${lon}°W`;
        }
        
        // Load user's garage from API
        if (Array.isArray(garageData)) {
            userGarage = garageData.map(car => ({
                ref: car._id || car.id,
                model: `${car.make} ${car.model}`,
                value: `$${car.price ? (car.price >= 1000000 ? (car.price / 1000000).toFixed(1) + 'M' : (car.price / 1000).toFixed(0) + 'K') : '0'}`,
                status: car.status || 'SECURE',
                listed: car.isListed || false,
                carId: car._id || car.id
            }));
        } else {
            userGarage = [];
        }
        
        // Mock transaction history (replace with API call later)
        transactionHistory = [];
        
        // Load user's bid history
        await loadBidHistory();
        
        // Populate Asset Ledger
        renderGarage();
        renderHistory();
        renderBids();
        
        // Setup Contractor Mode if applicable
        if (userRole === 'contractor') {
            setupContractorMode();
        }
        
        // Setup Tab Switching
        setupLedgerTabs();
        
        // Setup Sidebar Navigation
        setupSidebarNav();
        
        // Setup Logout Button
        setupLogoutButton();
        
        // Setup Back Button
        setupBackButton();
        
    } catch (error) {
        console.error('Terminal initialization error:', error);
        initTerminalWithMockData();
    }
}

function initTerminalWithMockData() {
    // Fallback to mock data if API fails
    const userData = {
        alias: "OPERATOR_01",
        level: 4,
        userId: "USR_MOCK",
        location: { x: 40, y: 60 },
        garage: [],
        history: []
    };
    
    userGarage = userData.garage;
    transactionHistory = userData.history;
    
    renderGarage();
    renderHistory();
    setupLedgerTabs();
    setupSidebarNav();
}

function renderGarage() {
    const garageTbody = document.getElementById('garage-tbody');
    if (!garageTbody) return;
    
    garageTbody.innerHTML = '';
    
    if (userGarage.length === 0) {
        garageTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #555; padding: 2rem;">NO_ASSETS_IN_GARAGE</td></tr>';
        return;
    }
    
    userGarage.forEach((asset, index) => {
        const row = document.createElement('tr');
        row.className = 'garage-row';
        row.dataset.ref = asset.ref;
        
        const statusClass = asset.listed ? 'status-listed' : 'status-secure';
        const statusText = asset.listed ? 'LIVE_ON_GRID' : 'SECURE';
        const buttonText = asset.listed ? '[ CANCEL_LISTING ]' : '[ DEPLOY_TO_MARKET ]';
        const buttonClass = asset.listed ? 'deploy-btn listed' : 'deploy-btn';
        
        row.innerHTML = `
            <td class="asset-ref">${asset.ref}</td>
            <td>${asset.model}</td>
            <td>${asset.value}</td>
            <td class="${statusClass}">${statusText}</td>
            <td>
                <button class="${buttonClass}" data-ref="${asset.ref}" data-car-id="${asset.carId || asset.ref}">${buttonText}</button>
            </td>
        `;
        
        garageTbody.appendChild(row);
        
        // Stagger fade-in animation
        gsap.fromTo(row, 
            { opacity: 0, y: 20 },
            { 
                opacity: 1, 
                y: 0, 
                duration: 0.5, 
                delay: index * 0.1
            }
        );
        
        // Setup deploy button click handler
        const deployBtn = row.querySelector('.deploy-btn');
        if (deployBtn) {
            deployBtn.addEventListener('click', () => {
                const carId = deployBtn.dataset.carId || asset.ref;
                handleDeployToggle(carId, asset.ref);
            });
        }
    });
}

function renderHistory() {
    const historyTbody = document.getElementById('history-tbody');
    if (!historyTbody) return;
    
    historyTbody.innerHTML = '';
    
    if (transactionHistory.length === 0) {
        historyTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #555; padding: 2rem;">NO_TRANSACTION_HISTORY</td></tr>';
        return;
    }
    
    transactionHistory.forEach((transaction, index) => {
        const row = document.createElement('tr');
        row.className = 'history-row';
        
        row.innerHTML = `
            <td class="asset-ref">${transaction.ref}</td>
            <td>${transaction.model}</td>
            <td>${transaction.value}</td>
            <td>${transaction.date}</td>
            <td class="status-sold">${transaction.status}</td>
        `;
        
        historyTbody.appendChild(row);
        
        // Stagger fade-in animation
        gsap.fromTo(row, 
            { opacity: 0, y: 20 },
            { 
                opacity: 1, 
                y: 0, 
                duration: 0.5, 
                delay: index * 0.1
            }
        );
    });
}

// Global state for user's bids
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

function renderBids() {
    const bidsTbody = document.getElementById('bids-tbody');
    if (!bidsTbody) return;
    
    bidsTbody.innerHTML = '';
    
    if (userBids.length === 0) {
        bidsTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #555; padding: 2rem;">NO_BIDS_PLACED</td></tr>';
        return;
    }
    
    userBids.forEach((bid, index) => {
        const row = document.createElement('tr');
        row.className = 'bid-row';
        
        const statusClass = bid.status === 'CLOSED' ? 'status-sold' : 'status-listed';
        const formattedAmount = bid.amount >= 1000000 
            ? `$${(bid.amount / 1000000).toFixed(1)}M` 
            : `$${(bid.amount / 1000).toFixed(0)}K`;
        
        row.innerHTML = `
            <td>${bid.asset}</td>
            <td>${formattedAmount}</td>
            <td>${bid.date}</td>
            <td class="${statusClass}">${bid.status}</td>
        `;
        
        bidsTbody.appendChild(row);
        
        // Stagger fade-in animation
        gsap.fromTo(row, 
            { opacity: 0, y: 20 },
            { 
                opacity: 1, 
                y: 0, 
                duration: 0.5, 
                delay: index * 0.1
            }
        );
    });
}

async function handleDeployToggle(carId, assetRef) {
    const asset = userGarage.find(a => a.ref === assetRef || a.carId === carId);
    
    try {
        const response = await fetch(`/api/cars/${carId}/deploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to deploy');
        }
        
        const data = await response.json();
        
        // Update local state
        if (asset) {
            asset.listed = data.car.isListed;
        }
        
        // Re-render garage to update UI
        renderGarage();
        
        // Show toast notification
        showToast('MARKET_UPDATED');
        
    } catch (error) {
        console.error('Deploy error:', error);
        showToast('DEPLOY_FAILED');
    }
}

function setupLedgerTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Update active states
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `tab-${targetTab}`) {
                    content.style.display = 'block';
                    content.classList.add('active');
                    // Refresh bid history when switching to bids tab
                    if (targetTab === 'bids') {
                        loadBidHistory().then(() => renderBids());
                    }
                } else {
                    content.style.display = 'none';
                }
            });
        });
    });
}

async function setupContractorMode() {
    try {
        // Fetch active auctions
        const response = await fetch('/api/cars/live-auctions');
        if (!response.ok) throw new Error('Failed to fetch auctions');
        
        const auctions = await response.json();
        
        // Add admin tab button if it doesn't exist
        const ledgerTabs = document.querySelector('.ledger-tabs');
        if (ledgerTabs && !document.querySelector('.tab-btn[data-tab="admin"]')) {
            const adminTabBtn = document.createElement('button');
            adminTabBtn.className = 'tab-btn';
            adminTabBtn.dataset.tab = 'admin';
            adminTabBtn.textContent = 'ADMIN_OVERRIDE';
            ledgerTabs.appendChild(adminTabBtn);
        }
        
        // Render admin table
        renderAdminTable(auctions);
        
    } catch (error) {
        console.error('Contractor mode setup error:', error);
    }
}

function renderAdminTable(auctions) {
    const adminTbody = document.getElementById('admin-tbody');
    if (!adminTbody) return;
    
    adminTbody.innerHTML = '';
    
    if (auctions.length === 0) {
        adminTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #555; padding: 2rem;">NO_ACTIVE_AUCTIONS</td></tr>';
        return;
    }
    
    auctions.forEach((auction, index) => {
        const row = document.createElement('tr');
        row.className = 'admin-row';
        
        // Fetch bid count
        fetch(`/api/cars/${auction._id}/bids`)
            .then(res => res.json())
            .then(bids => {
                const bidCount = bids.length || 0;
                
                row.innerHTML = `
                    <td class="asset-ref">${auction._id.toString().substr(0, 8)}</td>
                    <td>${auction.make} ${auction.model}</td>
                    <td>$${auction.currentBid ? auction.currentBid.toLocaleString() : '0'}</td>
                    <td>${bidCount}</td>
                    <td>
                        <button class="deploy-btn terminate-btn" data-car-id="${auction._id}">STOP_AUCTION</button>
                    </td>
                `;
                
                // Setup terminate button
                const terminateBtn = row.querySelector('.terminate-btn');
                if (terminateBtn) {
                    terminateBtn.addEventListener('click', () => handleTerminateAuction(auction._id));
                }
            })
            .catch(err => {
                console.error('Bid fetch error:', err);
                row.innerHTML = `
                    <td class="asset-ref">${auction._id.toString().substr(0, 8)}</td>
                    <td>${auction.make} ${auction.model}</td>
                    <td>$${auction.currentBid ? auction.currentBid.toLocaleString() : '0'}</td>
                    <td>--</td>
                    <td>
                        <button class="deploy-btn terminate-btn" data-car-id="${auction._id}">STOP_AUCTION</button>
                    </td>
                `;
                
                const terminateBtn = row.querySelector('.terminate-btn');
                if (terminateBtn) {
                    terminateBtn.addEventListener('click', () => handleTerminateAuction(auction._id));
                }
            });
        
        adminTbody.appendChild(row);
        
        // Stagger fade-in animation
        gsap.fromTo(row, 
            { opacity: 0, y: 20 },
            { 
                opacity: 1, 
                y: 0, 
                duration: 0.5, 
                delay: index * 0.1
            }
        );
    });
}

async function handleTerminateAuction(carId) {
    if (!confirm('TERMINATE_AUCTION? This will assign the car to the highest bidder.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/cars/${carId}/terminate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to terminate auction');
        }
        
        const data = await response.json();
        
        // Show success toast
        showToast(`AUCTION_TERMINATED: ${data.winner.displayName}`);
        
        // Reload admin table
        setupContractorMode();
        
    } catch (error) {
        console.error('Terminate error:', error);
        showToast('TERMINATE_FAILED');
    }
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST'
            });
            
            if (response.ok) {
                // Close terminal first
                const terminalSection = document.getElementById('terminal-section');
                if (terminalSection) {
                    terminalSection.style.display = 'none';
                    terminalSection.classList.remove('active');
                }
                // Redirect to garage door login screen
                window.location.href = '/';
            } else {
                // Fallback to GET logout
                window.location.href = '/auth/logout';
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback to GET logout
            window.location.href = '/auth/logout';
        }
    });
}

function setupSidebarNav() {
    const sidebarNavs = document.querySelectorAll('.sidebar-nav');
    const modules = {
        'id': 'module-id',
        'net': 'module-net',
        'log': 'module-log'
    };
    
    sidebarNavs.forEach(nav => {
        nav.addEventListener('click', () => {
            const moduleName = nav.dataset.module;
            
            // Update active state
            sidebarNavs.forEach(n => n.classList.remove('active'));
            nav.classList.add('active');
            
            // Show/hide modules
            Object.values(modules).forEach(moduleId => {
                const module = document.getElementById(moduleId);
                if (module) {
                    module.style.display = 'none';
                }
            });
            
            const targetModule = document.getElementById(modules[moduleName]);
            if (targetModule) {
                targetModule.style.display = 'flex';
                
                // Animate module appearance
                gsap.fromTo(targetModule,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.3 }
                );
            }
        });
    });
    
    // Show Identity module by default
    const defaultNav = document.querySelector('.sidebar-nav[data-module="id"]');
    if (defaultNav) {
        defaultNav.click();
    }
}

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

// Function to show terminal (can be called from elsewhere)
function showTerminal() {
    const terminalSection = document.getElementById('terminal-section');
    if (terminalSection) {
        terminalSection.style.display = 'block';
        terminalSection.classList.add('active');
        
        // Add CRT turn-on animation
        terminalSection.classList.add('crt-turn-on');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            terminalSection.classList.remove('crt-turn-on');
        }, 800);
        
        terminalSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ============================================
// SECRET TERMINAL TRIGGER (System Uplink)
// ============================================
function initTerminalTrigger() {
    const trigger = document.getElementById('terminal-trigger');
    const statusLed = document.getElementById('status-led');
    const statusText = document.getElementById('status-text');
    
    if (!trigger || !statusLed || !statusText) return;
    
    // Check if user is logged in
    // Use the global isLoggedIn variable if available, otherwise check terminal data
    const userAlias = document.getElementById('user-alias');
    const isAuthenticated = isLoggedIn || (userAlias && userAlias.textContent && userAlias.textContent !== 'OPERATOR_GHOST');
    
    // Update LED and text based on auth status
    if (isAuthenticated) {
        statusLed.classList.add('authenticated');
        const alias = userAlias ? userAlias.textContent : 'OPERATOR';
        statusText.textContent = `OP_ID :: ${alias}`;
    } else {
        statusLed.classList.remove('authenticated');
        statusText.textContent = 'SYS :: MONITORING';
    }
    
    // Click event handler
    trigger.addEventListener('click', () => {
        // Optional: Play sound effect (commented out - uncomment if you have a sound file)
        // const audio = new Audio('/assets/sounds/terminal_access.mp3');
        // audio.volume = 0.3;
        // audio.play().catch(err => console.log('Sound play failed:', err));
        
        // Show terminal with animation
        showTerminal();
        
        // Add a brief flash effect to the trigger
        trigger.style.opacity = '0.5';
        setTimeout(() => {
            trigger.style.opacity = '';
        }, 200);
    });
    
    // Enhanced hover effect - show glitch text
    let hoverTimeout;
    trigger.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        const originalText = statusText.textContent;
        
        hoverTimeout = setTimeout(() => {
            if (trigger.matches(':hover')) {
                statusText.textContent = '[ OPEN_TERMINAL ]';
                statusText.style.color = 'var(--thermal-red)';
                statusText.style.textShadow = '0 0 10px rgba(255, 51, 0, 0.8)';
            }
        }, 300);
    });
    
    trigger.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        statusText.style.color = '';
        statusText.style.textShadow = '';
        
        // Restore original text
        const userAlias = document.getElementById('user-alias');
        const isAuthenticated = isLoggedIn || (userAlias && userAlias.textContent && userAlias.textContent !== 'OPERATOR_GHOST');
        if (isAuthenticated) {
            const alias = userAlias ? userAlias.textContent : 'OPERATOR';
            statusText.textContent = `OP_ID :: ${alias}`;
        } else {
            statusText.textContent = 'SYS :: MONITORING';
        }
    });
}

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
    
    // Smooth cursor follow with GSAP
    function updateCursor() {
        gsap.to(globalCursor, {
            x: mouseX,
            y: mouseY,
            duration: 0.3,
            ease: "power2.out"
        });
        
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
// SECRET TERMINAL TRIGGER (System Uplink)
// ============================================
function initTerminalTrigger() {
    const trigger = document.getElementById('terminal-trigger');
    const statusLed = document.getElementById('status-led');
    const statusText = document.getElementById('status-text');
    
    if (!trigger || !statusLed || !statusText) return;
    
    // Check if user is logged in
    // Use the global isLoggedIn variable if available, otherwise check terminal data
    const userAlias = document.getElementById('user-alias');
    const isAuthenticated = isLoggedIn || (userAlias && userAlias.textContent && userAlias.textContent !== 'OPERATOR_GHOST');
    
    // Update LED and text based on auth status
    if (isAuthenticated) {
        statusLed.classList.add('authenticated');
        const alias = userAlias ? userAlias.textContent : 'OPERATOR';
        statusText.textContent = `OP_ID :: ${alias}`;
    } else {
        statusLed.classList.remove('authenticated');
        statusText.textContent = 'SYS :: MONITORING';
    }
    
    // Click event handler
    trigger.addEventListener('click', () => {
        // Optional: Play sound effect (commented out - uncomment if you have a sound file)
        // const audio = new Audio('/assets/sounds/terminal_access.mp3');
        // audio.volume = 0.3;
        // audio.play().catch(err => console.log('Sound play failed:', err));
        
        // Show terminal with animation
        showTerminal();
        
        // Add a brief flash effect to the trigger
        trigger.style.opacity = '0.5';
        setTimeout(() => {
            trigger.style.opacity = '';
        }, 200);
    });
    
    // Enhanced hover effect - show glitch text
    let hoverTimeout;
    trigger.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        const originalText = statusText.textContent;
        
        hoverTimeout = setTimeout(() => {
            if (trigger.matches(':hover')) {
                statusText.textContent = '[ OPEN_TERMINAL ]';
                statusText.style.color = 'var(--thermal-red)';
                statusText.style.textShadow = '0 0 10px rgba(255, 51, 0, 0.8)';
            }
        }, 300);
    });
    
    trigger.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        statusText.style.color = '';
        statusText.style.textShadow = '';
        
        // Restore original text
        const userAlias = document.getElementById('user-alias');
        const isAuthenticated = isLoggedIn || (userAlias && userAlias.textContent && userAlias.textContent !== 'OPERATOR_GHOST');
        if (isAuthenticated) {
            const alias = userAlias ? userAlias.textContent : 'OPERATOR';
            statusText.textContent = `OP_ID :: ${alias}`;
        } else {
            statusText.textContent = 'SYS :: MONITORING';
        }
    });
}