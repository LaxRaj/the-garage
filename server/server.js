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

// Database Connection with proper options for production
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        const mongooseOptions = {
            serverSelectionTimeoutMS: 30000, // 30 seconds for server selection
            socketTimeoutMS: 45000, // 45 seconds for socket operations
            connectTimeoutMS: 30000, // 30 seconds for initial connection
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 2, // Maintain at least 2 socket connections
            retryWrites: true,
            w: 'majority'
        };

        await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
        console.log('✅ Connected to The Garage DB');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });
        
        return true; // Connection successful
        
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('⚠️  Check your MONGO_URI in environment variables');
        console.log('⚠️  For MongoDB Atlas, ensure:');
        console.log('   1. IP whitelist includes 0.0.0.0/0 (or Railway IPs)');
        console.log('   2. Database user has correct permissions');
        console.log('   3. Connection string is correct');
        throw err; // Re-throw to be caught by caller
    }
};

// Middleware
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

// Page Routes (must come before static file serving)
try {
    const pagesRouter = require('./routes/pages');
    app.use('/', pagesRouter);
    console.log('✅ Page routes registered');
    console.log('   Routes: /, /showroom, /market, /profile');
} catch (err) {
    console.error('❌ Error loading page routes:', err);
}

// Static files (for assets like CSS, JS, images - must come after routes)
// Routes are checked first, so HTML files will be served by routes, not static middleware
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3001;

// Start server after attempting database connection
const startServer = async () => {
    // Attempt database connection (don't block server startup)
    connectDB().catch(err => {
        console.warn('⚠️  Database connection failed, but server will start anyway');
        console.warn('   Some features may not work until database is connected');
    });
    
    // Start server immediately (don't wait for DB)
    const server = app.listen(PORT, () => {
        console.log(`🚀 The Garage is open on port ${PORT}`);
        console.log(`📍 http://localhost:${PORT}`);
        if (mongoose.connection.readyState !== 1) {
            console.warn('⚠️  Waiting for database connection...');
        }
    }).on('error', (err) => {
        console.error('❌ Server error:', err.message);
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️  Port ${PORT} is already in use. Try a different port.`);
        }
        process.exit(1);
    });
};

startServer();