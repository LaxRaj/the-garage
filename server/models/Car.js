const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
    make: { type: String, required: true }, // e.g., "Porsche"
    model: { type: String, required: true }, // e.g., "911 GT3 RS"
    year: Number,
    description: String,
    price: Number, // Buy Now Price
    
    // Image for 2D display (marketplace grid, x-ray scanner)
    image: { type: String, default: '/assets/placeholder.jpg' }, // e.g., "/assets/porsche_911.jpg"
    
    // The 3D Asset
    modelPath: { type: String, default: '/assets/sls300.glb' }, // e.g., "/assets/porsche.glb"
    
    // Status for marketplace
    status: { type: String, default: 'AVAILABLE', enum: ['AVAILABLE', 'LIVE_AUCTION', 'RESERVED', 'SOLD'] },
    
    // Auction Logic (Screen 3)
    isAuction: { type: Boolean, default: false },
    currentBid: { type: Number, default: 0 },
    bids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bid' }],
    
    // Marketplace Logic
    isListed: { type: Boolean, default: false }, // Whether car is listed on marketplace (public can see)
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Current owner (null = "The House" / Contractor)
    highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Highest bidder for auctions
});

module.exports = mongoose.model('Car', CarSchema);