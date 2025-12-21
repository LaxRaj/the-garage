// Navbar Component - Injected into all pages (hidden on home page)
function initNavbar() {
    const currentPath = window.location.pathname;
    const isHomePage = currentPath === '/';
    
    // Don't show navbar on home page
    if (isHomePage) {
        return; // Exit early - no navbar on home page
    }
    
    const navbarHTML = `
        <nav id="global-nav" class="global-nav visible">
            <div class="nav-container">
                <a href="/showroom" class="nav-link" data-section="showroom">SHOWROOM</a>
                <a href="/market" class="nav-link" data-section="market">MARKET</a>
                <a href="/profile" class="nav-link" data-section="profile">PROFILE</a>
                <a href="#" class="nav-link" id="nav-logout">LOGOUT</a>
            </div>
        </nav>
    `;
    
    // Insert navbar at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
    
    // Setup logout handler (will be handled by app.js setupNavbarLogout)
    // This is a placeholder - actual handler is set up in app.js to avoid duplicate listeners
    
    // Update active nav link based on current page
    const navLinks = document.querySelectorAll('.global-nav .nav-link');
    navLinks.forEach(link => {
        if (link.id === 'nav-logout') return;
        const linkPath = link.getAttribute('href');
        if (currentPath === linkPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
} else {
    initNavbar();
}

