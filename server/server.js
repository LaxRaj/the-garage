require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // Persist sessions in DB
const path = require('path');

const app = express();

// Configs
try {
    require('./config/passport')(passport);
    console.log('✅ Passport configured successfully');
} catch (err) {
    console.error('❌ Passport config error:', err.message);
    // Don't exit - allow server to start without OAuth for development/testing
    // In production, ensure environment variables are set in Railway dashboard
    console.warn('⚠️  Server will continue without Google OAuth. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Railway environment variables.');
}

// Database
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to The Garage DB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('⚠️  Check your MONGO_URI in .env file');
        // Don't exit - let server start anyway for development
    });

// Middleware
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());


// Session (The "Cookie" logic)
try {
    app.use(session({
        secret: process.env.SESSION_SECRET || 'garage_secret_key',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ 
            mongoUrl: process.env.MONGO_URI,
            touchAfter: 24 * 3600 // lazy session update
        })
    }));
} catch (err) {
    console.error('❌ Session store error:', err.message);
    // Fallback to memory store if MongoStore fails
    app.use(session({
        secret: process.env.SESSION_SECRET || 'garage_secret_key',
        resave: false,
        saveUninitialized: false
    }));
    console.log('⚠️  Using memory store for sessions');
}

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));
app.use('/api/payment', require('./routes/payment'));

// Main Entry
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
    console.log(`🚀 The Garage is open on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('❌ Server error:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Port ${PORT} is already in use. Try a different port.`);
    }
    process.exit(1);
});