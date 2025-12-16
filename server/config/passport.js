const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    // Only initialize Google OAuth if credentials are provided
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.warn('⚠️  Google OAuth credentials not found. Google login will be disabled.');
        console.warn('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables.');
        return; // Exit early, don't initialize GoogleStrategy
    }
    
    // Construct the full callback URL
    const callbackURL = process.env.CALLBACK_URL || 
        `http://localhost:${process.env.PORT || 3001}/auth/google/callback`;
    
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user exists, if not, create them (The "Guest List")
            let user = await User.findOne({ providerId: profile.id });

            if (user) {
                return done(null, user);
            } else {
                const newUser = {
                    providerId: profile.id,
                    provider: 'google',
                    displayName: profile.displayName,
                    email: profile.emails[0].value,
                    avatar: profile.photos[0].value
                };
                user = await User.create(newUser);
                return done(null, user);
            }
        } catch (err) {
            console.error(err);
            return done(err, null);
        }
    }));

    // Serialization: Packing the user into the session cookie
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialization: Unpacking the user from the cookie
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};