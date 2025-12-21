const express = require('express');
const router = express.Router();
const path = require('path');

// Get absolute path to public directory
const publicPath = path.resolve(__dirname, '../../public');

// Debug: Verify public path on load
console.log('📁 Pages router - Public path:', publicPath);
const fs = require('fs');
if (!fs.existsSync(publicPath)) {
    console.error('❌ Public directory does not exist:', publicPath);
} else {
    console.log('✅ Public directory exists');
}

// Middleware to protect pages (redirects instead of JSON error)
const ensurePageAuth = (req, res, next) => {
    console.log('🔐 Auth check for:', req.path, 'Authenticated:', req.isAuthenticated());
    if (req.isAuthenticated()) {
        return next();
    }
    // Redirect to home page if not authenticated
    console.log('   → Redirecting to / (not authenticated)');
    return res.redirect('/');
};

// 1. HOME (Public)
router.get('/', (req, res) => {
    console.log('📍 Route hit: GET /');
    const filePath = path.join(publicPath, 'index.html');
    console.log('   Sending file:', filePath);
    res.sendFile(filePath);
});

// 2. SHOWROOM (Protected - temporarily public for testing)
router.get('/showroom', (req, res, next) => {
    console.log('📍 Route hit: GET /showroom');
    console.log('   Request path:', req.path);
    console.log('   Request url:', req.url);
    const filePath = path.join(publicPath, 'showroom.html');
    console.log('   Sending file:', filePath);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
        console.error('❌ File does not exist:', filePath);
        return res.status(404).send('File not found: ' + filePath);
    }
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('❌ Error sending showroom.html:', err);
            return res.status(500).send('Error loading page: ' + err.message);
        }
    });
});

// 3. MARKET (Protected)
router.get('/market', ensurePageAuth, (req, res) => {
    console.log('📍 Route hit: GET /market');
    const filePath = path.join(publicPath, 'market.html');
    console.log('   Sending file:', filePath);
    res.sendFile(filePath);
});

// 4. PROFILE (Protected)
router.get('/profile', ensurePageAuth, (req, res, next) => {
    console.log('📍 Route hit: GET /profile');
    const filePath = path.join(publicPath, 'profile.html');
    console.log('   Sending file:', filePath);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('❌ Error sending profile.html:', err);
            next(err);
        }
    });
});

// 5. PAYMENT (Protected)
router.get('/payment', ensurePageAuth, (req, res, next) => {
    console.log('📍 Route hit: GET /payment');
    const filePath = path.join(publicPath, 'payment.html');
    console.log('   Sending file:', filePath);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('❌ Error sending payment.html:', err);
            next(err);
        }
    });
});


// Debug: Log all registered routes when router is created
setTimeout(() => {
    console.log('📋 Registered page routes:');
    router.stack.forEach((r) => {
        if (r.route) {
            const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
            console.log(`   ${methods} ${r.route.path}`);
        } else if (r.name === 'router') {
            console.log(`   Router mounted at: ${r.regexp}`);
        }
    });
}, 100);

module.exports = router;

