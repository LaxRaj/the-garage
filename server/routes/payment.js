const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const Car = require('../models/Car');
const { ensureAuthenticated } = require('../middleware/auth');

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
// @desc    Generate a payment session for a specific car (SECURITY: Only for users with accepted offers)
router.post('/create-intent', ensureAuthenticated, async (req, res) => {
    try {
        console.log('💳 Payment intent request received:', {
            userId: req.user?._id,
            carId: req.body?.carId,
            hasStripe: !!stripe
        });
        
        // Check if Stripe is configured
        if (!stripe) {
            console.error('❌ Stripe not initialized. STRIPE_SECRET_KEY missing.');
            return res.status(503).json({ 
                error: 'Payment service not configured. Please set STRIPE_SECRET_KEY in .env file.' 
            });
        }

        const { carId, billingDetails } = req.body;
        
        if (!carId) {
            console.error('❌ Car ID missing from request');
            return res.status(400).json({ error: 'Car ID is required' });
        }
        
        // 1. Find the car
        console.log('🔍 Looking up car:', carId);
        const car = await Car.findById(carId);
        if (!car) {
            console.error('❌ Car not found:', carId);
            return res.status(404).json({ error: 'Asset not found' });
        }
        console.log('✅ Car found:', car.make, car.model, 'Status:', car.status);

        // 2. SECURITY CHECK: Verify car is RESERVED and user has accepted offer
        if (car.status !== 'RESERVED') {
            console.error('❌ Car not reserved. Status:', car.status);
            return res.status(403).json({ 
                error: 'Asset not available for payment',
                message: 'This asset is not reserved for payment.'
            });
        }

        // 3. Find user's accepted offer
        const userId = req.user._id.toString();
        console.log('🔍 Checking offers for user:', userId);
        console.log('   Car has', car.offers?.length || 0, 'offers');
        
        const acceptedOffer = car.offers && car.offers.find(offer => {
            // Handle both populated and non-populated userId
            let offerUserId;
            if (offer.userId && typeof offer.userId === 'object' && offer.userId._id) {
                offerUserId = offer.userId._id.toString();
            } else if (offer.userId) {
                offerUserId = offer.userId.toString();
            } else {
                return false;
            }
            
            const matches = offerUserId === userId && offer.status === 'accepted';
            if (matches) {
                console.log('✅ Found accepted offer:', offer.amount, 'Offer ID:', offer._id);
            }
            return matches;
        });

        if (!acceptedOffer) {
            console.error('❌ No accepted offer found for user:', userId);
            console.error('   Available offers:', car.offers?.map(o => ({
                userId: o.userId?.toString() || o.userId?._id?.toString(),
                status: o.status,
                amount: o.amount
            })));
            return res.status(403).json({ 
                error: 'Unauthorized payment attempt',
                message: 'You do not have an accepted offer for this asset.'
            });
        }

        // 4. Use the ACCEPTED OFFER AMOUNT (not asking price)
        const paymentAmount = acceptedOffer.amount || 0;
        
        if (!paymentAmount || paymentAmount <= 0) {
            console.error('❌ Invalid payment amount:', paymentAmount);
            return res.status(400).json({ 
                error: 'Invalid payment amount',
                message: 'The accepted offer amount is invalid.'
            });
        }
        
        console.log(`✅ Preparing payment intent for user ${req.user.displayName || req.user.email} on ${car.make} ${car.model} - Amount: $${paymentAmount}`);
        
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
        // Safely get IDs as strings
        const carIdStr = car && car._id ? car._id.toString() : 'unknown';
        const offerIdStr = acceptedOffer && acceptedOffer._id ? acceptedOffer._id.toString() : 'unknown';
        const carNameStr = car && car.make && car.model ? `${car.make} ${car.model}` : 'Unknown Car';
        const paymentAmountStr = paymentAmount ? paymentAmount.toString() : '0';
        
        const paymentIntentData = {
            amount: amountInCents,
            currency: 'usd',
            // Ensure test mode is explicitly set (though Stripe handles this automatically)
            ...(isTestMode && {
                payment_method_types: ['card'],
            }),
            metadata: { 
                integration_check: 'accept_a_payment', 
                carId: carIdStr,
                carName: carNameStr,
                carPrice: paymentAmountStr,
                acceptedOfferId: offerIdStr,
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

        console.log('🔄 Creating Stripe PaymentIntent:', {
            amount: amountInCents,
            currency: 'usd',
            testMode: isTestMode,
            carId: carIdStr,
            offerId: offerIdStr
        });
        
        const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
        
        console.log('✅ PaymentIntent created:', paymentIntent.id);

        // 3. Send the Client Secret to the frontend
        res.json({ 
            clientSecret: paymentIntent.client_secret,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            testMode: isTestMode
        });
        
    } catch (err) {
        console.error('❌ Stripe payment intent error:', err);
        console.error('   Error details:', {
            message: err.message,
            type: err.type,
            code: err.code,
            statusCode: err.statusCode,
            stack: err.stack
        });
        
        // Provide more detailed error messages
        let errorMessage = 'Transaction Initialization Failed';
        if (err.type === 'StripeInvalidRequestError') {
            errorMessage = `Stripe API Error: ${err.message}`;
        } else if (err.message && err.message.includes('No such')) {
            errorMessage = 'Invalid Stripe configuration. Please check your API keys.';
        }
        
        res.status(500).json({ 
            error: errorMessage, 
            details: err.message,
            type: err.type || 'UnknownError'
        });
    }
});

module.exports = router;