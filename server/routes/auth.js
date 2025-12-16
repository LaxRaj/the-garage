const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const crypto = require('crypto');
const router = express.Router();

// 1. Trigger Google Login
router.get('/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(503).json({ 
            error: 'Google OAuth not configured',
            message: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables'
        });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// 2. Google Callback (Where they come back after logging in)
router.get('/google/callback', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(503).json({ 
            error: 'Google OAuth not configured',
            message: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables'
        });
    }
    passport.authenticate('google', { failureRedirect: '/' })(req, res, next);
}, (req, res) => {
    // Success! Redirect back to the garage door
    res.redirect('/');
});

// 3. Logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        // Destroy the session
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
            res.clearCookie('connect.sid');
            res.redirect('/');
        });
    });
});

// 4. API Logout (for AJAX calls)
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        // Destroy the session
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
                return res.status(500).json({ error: 'Logout failed' });
            }
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Logged out successfully' });
        });
    });
});

// 4. Signup Route (Local Registration)
router.post('/signup', async (req, res) => {
    try {
        const { displayName, email, password } = req.body;
        
        // Validation
        if (!displayName || !email || !password) {
            return res.status(400).json({ 
                error: 'All fields are required',
                message: 'Please provide display name, email, and password' 
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { providerId: email }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User already exists',
                message: 'An account with this email already exists' 
            });
        }
        
        // Create a simple hash for password (in production, use bcrypt)
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        
        // Generate providerId (use email as unique identifier for local users)
        const providerId = `local_${email}_${Date.now()}`;
        
        // Create new user
        const newUser = await User.create({
            providerId: providerId,
            provider: 'local',
            displayName: displayName.trim(),
            email: email.toLowerCase().trim(),
            password: passwordHash,
            joinedAt: new Date()
        });
        
        // Log them in automatically
        req.login(newUser, (err) => {
            if (err) {
                return res.status(500).json({ 
                    error: 'Login failed',
                    message: 'Account created but login failed. Please try logging in.' 
                });
            }
            return res.json({ 
                success: true, 
                message: 'Account created successfully',
                user: {
                    id: newUser._id,
                    displayName: newUser.displayName,
                    email: newUser.email
                }
            });
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ 
            error: 'Signup failed',
            message: err.message || 'An error occurred during signup' 
        });
    }
});

// 5. Login Route (Local Authentication)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Missing credentials',
                message: 'Please provide email and password' 
            });
        }
        
        // Find user
        const user = await User.findOne({ 
            email: email.toLowerCase().trim(),
            provider: 'local'
        });
        
        if (!user || !user.password) {
            return res.status(401).json({ 
                error: 'Invalid credentials',
                message: 'Email or password is incorrect' 
            });
        }
        
        // Verify password
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        if (user.password !== passwordHash) {
            return res.status(401).json({ 
                error: 'Invalid credentials',
                message: 'Email or password is incorrect' 
            });
        }
        
        // Log them in
        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ 
                    error: 'Login failed',
                    message: 'Authentication failed. Please try again.' 
                });
            }
            return res.json({ 
                success: true, 
                message: 'Login successful',
                user: {
                    id: user._id,
                    displayName: user.displayName,
                    email: user.email
                }
            });
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            error: 'Login failed',
            message: err.message || 'An error occurred during login' 
        });
    }
});

// 6. API: Check Status (For the Frontend Lock Mechanism)
router.get('/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ loggedIn: true, user: req.user });
    } else {
        res.json({ loggedIn: false });
    }
});

module.exports = router;