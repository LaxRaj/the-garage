// Authentication middleware for role-based access control

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
};

// Middleware to ensure user is a contractor
const ensureContractor = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role !== 'contractor') {
        return res.status(403).json({ error: 'Contractor access required' });
    }
    
    return next();
};

module.exports = {
    ensureAuthenticated,
    ensureContractor
};

