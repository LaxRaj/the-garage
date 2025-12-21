const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const { ensureAuthenticated, ensureContractor } = require('../middleware/auth');

// @route   GET /api/cars
// @desc    Get all assets for the Marketplace Grid (PUBLIC - only listed cars)
router.get('/cars', async (req, res) => {
    try {
        const query = { isListed: true };
        const cars = await Car.find(query).sort({ askingPrice: -1 });
        res.json(cars);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error: Could not retrieve assets.' });
    }
});

// @route   GET /api/cars/featured
// @desc    Get the "Hero" car for the X-Ray Showroom (e.g., the first one or a random one)
router.get('/cars/featured', async (req, res) => {
    try {
        // For now, just grab the most expensive/featured one, or random
        const car = await Car.findOne().sort({ askingPrice: -1 }); 
        res.json(car);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error: Could not retrieve featured asset.' });
    }
});

// @route   GET /api/cars/:id
// @desc    Get a specific car by ID
router.get('/cars/:id', async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        // Return car with offers populated
        res.json(car);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error: Could not retrieve car.' });
    }
});

// @route   GET /api/contractor/assets
// @desc    Get House Vault assets for Contractor (cars where owner is null - belonging to "The House")
router.get('/contractor/assets', ensureContractor, async (req, res) => {
    try {
        // Return only cars where owner is null or doesn't exist (belonging to "The House")
        // MongoDB query: owner is null OR owner field doesn't exist
        const cars = await Car.find({ 
            $or: [
                { owner: null },
                { owner: { $exists: false } }
            ]
        }).sort({ make: 1, model: 1 });
        
        console.log(`✅ House Vault: Found ${cars.length} assets`);
        if (cars.length === 0) {
            console.warn('⚠️  House Vault is empty! Checking database...');
            const allCars = await Car.find({});
            console.log(`   Total cars in database: ${allCars.length}`);
            allCars.forEach(car => {
                console.log(`   - ${car.make} ${car.model}: owner=${car.owner || 'null'}, isListed=${car.isListed}`);
            });
        }
        res.json(cars);
    } catch (err) {
        console.error('❌ Contractor assets fetch error:', err);
        res.status(500).json({ error: 'Server Error: Could not retrieve contractor assets.' });
    }
});

// @route   POST /api/cars/:id/toggle-deploy
// @desc    Toggle car's isListed status (CONTRACTOR ONLY)
router.post('/cars/:id/toggle-deploy', ensureContractor, async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }

        // Toggle isListed status
        car.isListed = !car.isListed;
        await car.save();

        res.json({ 
            success: true, 
            car: car,
            isListed: car.isListed,
            message: car.isListed ? 'Asset deployed to market' : 'Asset recalled from market'
        });
    } catch (err) {
        console.error('Toggle deploy error:', err);
        res.status(500).json({ error: 'Server Error: Could not update car listing.' });
    }
});

// @route   POST /api/cars/:id/deploy (DEPRECATED - kept for backward compatibility)
// @desc    Toggle car's isListed status (authenticated users only)
router.post('/cars/:id/deploy', ensureAuthenticated, async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }

        // Check if user owns the car (optional: can be removed if any user can list)
        // For now, allow any authenticated user to toggle listing
        // You can add ownership check: if (car.owner && car.owner.toString() !== req.user._id.toString())

        // Toggle isListed status
        car.isListed = !car.isListed;
        await car.save();

        res.json({ 
            success: true, 
            car: car,
            message: car.isListed ? 'Car listed on marketplace' : 'Car removed from marketplace'
        });
    } catch (err) {
        console.error('Deploy error:', err);
        res.status(500).json({ error: 'Server Error: Could not update car listing.' });
    }
});


// @route   GET /api/user/garage
// @desc    Get current user's garage (cars they own)
router.get('/user/garage', ensureAuthenticated, async (req, res) => {
    try {
        const cars = await Car.find({ owner: req.user._id });
        res.json(cars);
    } catch (err) {
        console.error('Garage fetch error:', err);
        res.status(500).json({ error: 'Server Error: Could not retrieve garage.' });
    }
});

// @route   GET /api/user/role
// @desc    Get current user's role
router.get('/user/role', ensureAuthenticated, async (req, res) => {
    try {
        res.json({ 
            role: req.user.role,
            user: {
                id: req.user._id,
                displayName: req.user.displayName,
                email: req.user.email
            }
        });
    } catch (err) {
        console.error('Role fetch error:', err);
        res.status(500).json({ error: 'Server Error: Could not retrieve role.' });
    }
});

// @route   POST /api/cars/:id/offer
// @desc    Create a new offer for a car
router.post('/cars/:id/offer', ensureAuthenticated, async (req, res) => {
    try {
        const { amount, alias, message } = req.body;
        const carId = req.params.id;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid offer amount' });
        }
        
        if (!alias || alias.trim() === '') {
            return res.status(400).json({ error: 'Alias is required' });
        }
        
        // Fetch the car
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        
        // Check if car is available for offers
        if (car.status !== 'AVAILABLE') {
            return res.status(400).json({ error: 'Car is not available for offers' });
        }
        
        // Create the offer
        const offer = {
            userId: req.user._id,
            alias: alias.trim(),
            amount: amount,
            status: 'pending',
            message: message || '',
            createdAt: new Date()
        };
        
        // Add offer to car
        if (!car.offers) {
            car.offers = [];
        }
        car.offers.push(offer);
        await car.save();
        
        console.log(`✅ Offer created: ${alias} offered $${amount} on ${car.make} ${car.model}`);
        
        res.json({
            success: true,
            offer: offer,
            car: car,
            message: 'Offer submitted successfully'
        });
    } catch (err) {
        console.error('❌ Offer creation error:', err);
        res.status(500).json({ error: 'Server Error: Could not submit offer.' });
    }
});

// @route   POST /api/cars/:id/offers/:offerId/accept
// @desc    Accept an offer (CONTRACTOR ONLY)
router.post('/cars/:id/offers/:offerId/accept', ensureContractor, async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        
        const offerId = req.params.offerId;
        const offer = car.offers.id(offerId);
        
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }
        
        // Reject all other pending offers
        car.offers.forEach(o => {
            if (o.status === 'pending' && o._id.toString() !== offerId) {
                o.status = 'rejected';
            }
        });
        
        // Accept this offer
        offer.status = 'accepted';
        car.status = 'RESERVED';
        await car.save();
        
        console.log(`✅ Offer accepted: ${offer.alias} - $${offer.amount} on ${car.make} ${car.model}`);
        
        res.json({
            success: true,
            car: car,
            offer: offer,
            message: 'Offer accepted successfully'
        });
    } catch (err) {
        console.error('❌ Offer acceptance error:', err);
        res.status(500).json({ error: 'Server Error: Could not accept offer.' });
    }
});

// @route   POST /api/cars/:id/offers/:offerId/decline
// @desc    Decline an offer (CONTRACTOR ONLY)
router.post('/cars/:id/offers/:offerId/decline', ensureContractor, async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        
        const offerId = req.params.offerId;
        const offer = car.offers.id(offerId);
        
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }
        
        // Decline this offer
        offer.status = 'rejected';
        await car.save();
        
        console.log(`✅ Offer declined: ${offer.alias} - $${offer.amount} on ${car.make} ${car.model}`);
        
        res.json({
            success: true,
            car: car,
            offer: offer,
            message: 'Offer declined successfully'
        });
    } catch (err) {
        console.error('❌ Offer decline error:', err);
        res.status(500).json({ error: 'Server Error: Could not decline offer.' });
    }
});

// @route   GET /api/user/offers
// @desc    Get current user's offers
router.get('/user/offers', ensureAuthenticated, async (req, res) => {
    try {
        const cars = await Car.find({ 
            'offers.userId': req.user._id 
        }).select('make model askingPrice image offers status');
        
        // Extract user's offers from cars
        const userOffers = [];
        cars.forEach(car => {
            car.offers.forEach(offer => {
                if (offer.userId && offer.userId.toString() === req.user._id.toString()) {
                    userOffers.push({
                        car: {
                            _id: car._id,
                            make: car.make,
                            model: car.model,
                            askingPrice: car.askingPrice,
                            image: car.image,
                            status: car.status
                        },
                        offer: {
                            _id: offer._id,
                            userId: offer.userId,
                            alias: offer.alias,
                            amount: offer.amount,
                            status: offer.status,
                            message: offer.message,
                            createdAt: offer.createdAt
                        }
                    });
                }
            });
        });
        
        // Sort by creation date (newest first)
        userOffers.sort((a, b) => {
            const dateA = new Date(a.offer.createdAt || 0);
            const dateB = new Date(b.offer.createdAt || 0);
            return dateB - dateA;
        });
        
        res.json(userOffers);
    } catch (err) {
        console.error('Offers fetch error:', err);
        res.status(500).json({ error: 'Server Error: Could not retrieve offers.' });
    }
});

// @route   PATCH /api/cars/:id
// @desc    Update car status (for payment completion)
router.patch('/cars/:id', ensureAuthenticated, async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        
        // Only allow status updates to SOLD if user has accepted offer
        if (req.body.status === 'SOLD') {
            const userId = req.user._id.toString();
            const hasAcceptedOffer = car.offers && car.offers.some(offer => {
                const offerUserId = offer.userId?._id?.toString() || offer.userId?.toString() || offer.userId;
                return offerUserId === userId && offer.status === 'accepted';
            });
            
            if (!hasAcceptedOffer) {
                return res.status(403).json({ error: 'Unauthorized: You do not have an accepted offer for this car' });
            }
            
            // Assign ownership to the buyer
            car.owner = req.user._id;
            car.status = 'SOLD';
            
            // Mark all other pending offers as rejected
            if (car.offers) {
                car.offers.forEach(offer => {
                    if (offer.status === 'pending') {
                        offer.status = 'rejected';
                    }
                });
            }
            
            await car.save();
            console.log(`✅ Car ${car.make} ${car.model} sold to ${req.user.displayName || req.user.email}. Owner assigned.`);
        } else {
            // Update car status for other status changes
            if (req.body.status) {
                car.status = req.body.status;
                await car.save();
            }
        }
        
        res.json(car);
    } catch (err) {
        console.error('Car update error:', err);
        res.status(500).json({ error: 'Server Error: Could not update car.' });
    }
});

module.exports = router;