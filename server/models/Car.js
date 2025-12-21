const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    alias: { type: String, required: true }, // User's display name/alias
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const CarSchema = new mongoose.Schema({
    make: { type: String, required: true }, // e.g., "Porsche"
    model: { type: String, required: true }, // e.g., "911 GT3 RS"
    year: Number,
    description: String,
    
    // Pricing (Private Dealer Model)
    minPrice: { type: Number, required: true }, // Lowest price dealer might accept (hidden from public)
    askingPrice: { type: Number, required: true }, // Visible list price
    
    // Image for 2D display (marketplace grid, x-ray scanner)
    image: { type: String, default: '/assets/placeholder.jpg' }, // e.g., "/assets/porsche_911.jpg"
    
    // The 3D Asset
    modelPath: { type: String, default: '/assets/sls300.glb' }, // e.g., "/assets/porsche.glb"
    
    // Status for marketplace
    status: { type: String, default: 'AVAILABLE', enum: ['AVAILABLE', 'RESERVED', 'SOLD'] },
    
    // Direct Offers System
    offers: [OfferSchema],
    
    // Marketplace Logic
    isListed: { type: Boolean, default: true }, // Whether car is listed on marketplace (public can see)
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null } // Current owner
});

module.exports = mongoose.model('Car', CarSchema);