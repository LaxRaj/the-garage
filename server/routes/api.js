const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const Bid = require('../models/Bid');
const { ensureAuthenticated, ensureContractor } = require('../middleware/auth');

// @route   GET /api/cars
// @desc    Get all assets for the Marketplace Grid
router.get('/cars', async (req, res) => {
    try {
        // Fetch all cars
        const cars = await Car.find();
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
        const car = await Car.findOne().sort({ price: -1 }); 
        res.json(car);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error: Could not retrieve featured asset.' });
    }
});

// @route   GET /api/cars/live-auctions
// @desc    Get all cars with LIVE_AUCTION status
router.get('/cars/live-auctions', async (req, res) => {
    try {
        const cars = await Car.find({ status: 'LIVE_AUCTION' }).sort({ currentBid: -1 });
        
        // Prioritize Ferrari F40 by putting it first
        const ferrariIndex = cars.findIndex(car => car.make === 'Ferrari' && car.model === 'F40');
        if (ferrariIndex > 0) {
            const ferrari = cars.splice(ferrariIndex, 1)[0];
            cars.unshift(ferrari);
        }
        
        res.json(cars);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error: Could not retrieve live auctions.' });
    }
});

// @route   GET /api/cars/:id/bids
// @desc    Get all bids for a specific car
router.get('/cars/:id/bids', async (req, res) => {
    try {
        const bids = await Bid.find({ car: req.params.id })
            .populate('user', 'displayName')
            .sort({ timestamp: -1 })
            .limit(50);
        res.json(bids);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error: Could not retrieve bids.' });
    }
});

// @route   POST /api/cars/:id/bids
// @desc    Create a new bid for a car
router.post('/cars/:id/bids', async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { amount } = req.body;
        const carId = req.params.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid bid amount' });
        }

        // Get the car
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }

        // Check if car is still in live auction
        if (car.status !== 'LIVE_AUCTION') {
            return res.status(400).json({ error: 'Car is not available for bidding' });
        }

        // Check if bid is higher than current bid
        const minBid = car.currentBid > 0 ? car.currentBid + 1000 : car.price || 1000;
        if (amount < minBid) {
            return res.status(400).json({ 
                error: `Bid must be at least $${minBid.toLocaleString()}` 
            });
        }

        // Create the bid
        const bid = new Bid({
            car: carId,
            user: req.user._id,
            amount: amount
        });

        await bid.save();

        // Update car's current bid
        car.currentBid = amount;
        car.bids.push(bid._id);
        await car.save();

        // Populate user info for response
        await bid.populate('user', 'displayName');

        res.json({ 
            success: true, 
            bid: bid,
            message: 'Bid placed successfully' 
        });
    } catch (err) {
        console.error('Bid creation error:', err);
        res.status(500).json({ error: 'Server Error: Could not place bid.' });
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
        res.json(car);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error: Could not retrieve car.' });
    }
});

// @route   POST /api/cars/:id/deploy
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

// @route   POST /api/cars/:id/terminate
// @desc    Terminate auction and assign to highest bidder (contractor only)
router.post('/cars/:id/terminate', ensureContractor, async (req, res) => {
    try {
        const car = await Car.findById(req.params.id).populate('bids');
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }

        if (!car.isAuction) {
            return res.status(400).json({ error: 'Car is not in auction' });
        }

        // Find highest bidder
        const highestBid = await Bid.findOne({ car: car._id })
            .sort({ amount: -1 })
            .populate('user');

        if (!highestBid) {
            return res.status(400).json({ error: 'No bids found for this auction' });
        }

        // Update car status
        car.isAuction = false;
        car.status = 'SOLD';
        car.owner = highestBid.user._id;
        car.highestBidder = highestBid.user._id;
        await car.save();

        res.json({ 
            success: true, 
            car: car,
            winner: {
                id: highestBid.user._id,
                displayName: highestBid.user.displayName,
                bidAmount: highestBid.amount
            },
            message: 'Auction terminated successfully'
        });
    } catch (err) {
        console.error('Terminate error:', err);
        res.status(500).json({ error: 'Server Error: Could not terminate auction.' });
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

// @route   GET /api/user/bids
// @desc    Get current user's bid history
router.get('/user/bids', ensureAuthenticated, async (req, res) => {
    try {
        const bids = await Bid.find({ user: req.user._id })
            .populate('car', 'make model price image')
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(bids);
    } catch (err) {
        console.error('Bids fetch error:', err);
        res.status(500).json({ error: 'Server Error: Could not retrieve bids.' });
    }
});

module.exports = router;