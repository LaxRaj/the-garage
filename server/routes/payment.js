const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const Car = require('../models/Car');

// Initialize Stripe with your Secret Key (Get this from Stripe Dashboard)
// Handle case where Stripe key might not be set (for development)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = Stripe(process.env.STRIPE_SECRET_KEY);
} else {
    console.warn('⚠️  STRIPE_SECRET_KEY not found in .env - Payment functionality disabled');
}

// @route   GET /api/payment/config
// @desc    Get Stripe publishable key for frontend
router.get('/config', (req, res) => {
    if (!process.env.STRIPE_PUBLISHABLE_KEY) {
        return res.status(503).json({ 
            error: 'Payment service not configured. Please set STRIPE_PUBLISHABLE_KEY in .env file.' 
        });
    }
    // Check if we're in test mode
    const isTestMode = process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_');
    
    res.json({ 
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        testMode: isTestMode
    });
});

// @route   POST /api/payment/create-intent
// @desc    Generate a payment session for a specific car
router.post('/create-intent', async (req, res) => {
    try {
        // Check if Stripe is configured
        if (!stripe) {
            return res.status(503).json({ 
                error: 'Payment service not configured. Please set STRIPE_SECRET_KEY in .env file.' 
            });
        }

        const { carId, billingDetails } = req.body;
        
        // 1. Find the car to get the REAL price (Security measure)
        const car = await Car.findById(carId);
        if (!car) return res.status(404).json({ error: 'Asset not found' });

        // 2. Determine payment amount (use currentBid for auction cars, price for Buy Now)
        const paymentAmount = car.isAuction ? (car.currentBid || car.price) : car.price;
        
        // 3. Validate amount against Stripe limit ($999,999.99 = 99999999 cents)
        const STRIPE_MAX_AMOUNT_CENTS = 99999999; // $999,999.99
        const amountInCents = Math.round(paymentAmount * 100);
        
        if (amountInCents > STRIPE_MAX_AMOUNT_CENTS) {
            return res.status(400).json({ 
                error: 'Payment amount exceeds Stripe limit',
                message: 'This asset exceeds the maximum payment amount. Please contact us for wire transfer arrangements.',
                maxAmount: 999999.99
            });
        }
        
        if (amountInCents < 50) { // Stripe minimum is $0.50
            return res.status(400).json({ 
                error: 'Payment amount too low',
                message: 'Payment amount must be at least $0.50'
            });
        }

        // 4. Check if we're in test mode (test keys start with sk_test_)
        const isTestMode = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');
        
        // 5. Create PaymentIntent with billing details for wire transfer compliance
        const paymentIntentData = {
            amount: amountInCents,
            currency: 'usd',
            // Ensure test mode is explicitly set (though Stripe handles this automatically)
            ...(isTestMode && {
                payment_method_types: ['card'],
            }),
            metadata: { 
                integration_check: 'accept_a_payment', 
                carId: car._id.toString(),
                carName: `${car.make} ${car.model}`,
                carPrice: car.price.toString(),
                test_mode: isTestMode ? 'true' : 'false'
            },
            // Add billing details for compliance (required for wire transfers)
            ...(billingDetails && {
                receipt_email: billingDetails.email,
                shipping: billingDetails.address ? {
                    name: billingDetails.name,
                    address: {
                        line1: billingDetails.address.line1,
                        line2: billingDetails.address.line2 || '',
                        city: billingDetails.address.city,
                        state: billingDetails.address.state,
                        postal_code: billingDetails.address.postal_code,
                        country: billingDetails.address.country || 'US',
                    }
                } : undefined
            })
        };

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

        // 3. Send the Client Secret to the frontend
        res.json({ 
            clientSecret: paymentIntent.client_secret,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency
        });
        
    } catch (err) {
        console.error('Stripe payment intent error:', err);
        res.status(500).json({ error: 'Transaction Initialization Failed', details: err.message });
    }
});

module.exports = router;