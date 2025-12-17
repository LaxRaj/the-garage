require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const Car = require('./models/Car');
const Bid = require('./models/Bid');
const User = require('./models/user');

// Connect to MongoDB and wait for connection before seeding
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000, // 30 seconds timeout
    socketTimeoutMS: 45000, // 45 seconds socket timeout
})
    .then(() => {
        console.log('✅ Connected to MongoDB for Seeding...');
        // Run seed function after connection is established
        return seedDB();
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('⚠️  Check your MONGO_URI in .env file');
        console.log('⚠️  Make sure MongoDB is running or your Atlas connection string is correct');
        process.exit(1);
    });

const dreamCars = [
    {
        make: "Porsche",
        model: "911 GT3 RS (992)",
        year: 2024,
        price: 295000,
        description: "The ultimate track tool. Weissach Package included.",
        image: "/assets/photo/porsche_911.png",
        modelPath: "/assets/sls300.glb",
        status: "LIVE_AUCTION",
        isAuction: true,
        currentBid: 310000,
        isListed: false, // Hidden from public by default
        owner: null, // Belongs to "The House"
        specs: { engine: "4.0L Flat-6", hp: "518 hp", zeroSixty: "3.0s" }
    },
    {
        make: "Ferrari",
        model: "F40",
        year: 1991,
        price: 999999, // Capped at Stripe limit (auction car, but price used for reference)
        description: "The last Ferrari approved by Enzo himself. Raw, analog perfection.",
        image: "/assets/photo/Ferrari_F40.png",
        modelPath: "/assets/sls300.glb",
        status: "LIVE_AUCTION",
        isAuction: true,
        currentBid: 245000, // Capped at Stripe limit
        isListed: false, // Hidden from public by default
        owner: null, // Belongs to "The House"
        specs: { engine: "2.9L Twin-Turbo V8", hp: "471 hp", zeroSixty: "4.1s" }
    },
    {
        make: "McLaren",
        model: "F1",
        year: 1994,
        price: 999999, // Capped at Stripe $999,999.99 limit for Buy Now
        description: "The gold standard. Center seat, gold-lined engine bay.",
        image: "/assets/photo/McLaren_F1.png",
        modelPath: "/assets/sls300.glb",
        status: "AVAILABLE",
        isAuction: false, // Buy Now only
        currentBid: 0,
        isListed: false, // Hidden from public by default
        owner: null, // Belongs to "The House"
        specs: { engine: "6.1L BMW V12", hp: "618 hp", zeroSixty: "3.2s" }
    },
    {
        make: "Lamborghini",
        model: "Countach LP5000",
        year: 1988,
        price: 650000,
        description: "The poster car of the 80s. Impossible geometry.",
        image: "/assets/photo/Lamborghini_Countach.png",
        modelPath: "/assets/sls300.glb",
        status: "RESERVED",
        isAuction: true,
        currentBid: 680000,
        isListed: false, // Hidden from public by default
        owner: null, // Belongs to "The House"
        specs: { engine: "5.2L V12", hp: "449 hp", zeroSixty: "4.7s" }
    },
    {
        make: "Aston Martin",
        model: "DB5 (Bond Spec)",
        year: 1964,
        price: 999999, // Capped at Stripe limit (auction car, but price used for reference)
        description: "The most famous car in the world. Silver Birch finish.",
        image: "/assets/photo/aston.png",
        modelPath: "/assets/sls300.glb",
        status: "AVAILABLE",
        isAuction: false,
        currentBid: 0, // Capped at Stripe limit
        isListed: false, // Hidden from public by default
        owner: null, // Belongs to "The House"
        specs: { engine: "4.0L I-6", hp: "282 HP", zeroSixty: "8.0s" }
    },
    {
        make: "Mercedes-Benz",
        model: "300 SL Gullwing",
        year: 1954,
        price: 999999, // Capped at Stripe limit (auction car, but price used for reference)
        description: "The original supercar. Alloy bodywork and tartan seats.",
        image: "/assets/photo/mercedes.png",
        modelPath: "/assets/sls300.glb",
        status: "LIVE_AUCTION",
        isAuction: true,
        currentBid: 999999, // Capped at Stripe limit
        isListed: false, // Hidden from public by default
        owner: null, // Belongs to "The House"
        specs: { engine: "3.0L I-6", hp: "215 HP", zeroSixty: "8.8s" }
    },
    {
        make: "Rolls-Royce",
        model: "Phantom VIII",
        year: 2024,
        price: 550000,
        description: "The architecture of luxury. Absolute silence.",
        image: "/assets/photo/rolls.png",
        modelPath: "/assets/sls300.glb",
        status: "AVAILABLE",
        isAuction: false,
        currentBid: 0,
        isListed: false, // Hidden from public by default
        owner: null, // Belongs to "The House"
        specs: { engine: "6.75L V12", hp: "563 HP", zeroSixty: "5.1s" }
    },
    {
        make: "Jaguar",
        model: "E-Type Series 1",
        year: 1961,
        price: 730000,
        description: "Enzo Ferrari called it 'The most beautiful car ever made.'",
        image: "/assets/photo/jaguar.png",
        modelPath: "/assets/sls300.glb",
        status: "AVAILABLE",
        isAuction: false,
        currentBid: 0,
        isListed: false, // Hidden from public by default
        owner: null, // Belongs to "The House"
        specs: { engine: "3.8L I-6", hp: "265 HP", zeroSixty: "6.9s" }
    }
];

const seedDB = async () => {
    await Car.deleteMany({}); // CLEAR existing data to avoid duplicates
    await Bid.deleteMany({}); // Clear bids too
    
    const cars = await Car.insertMany(dreamCars);
    console.log(`Garage Populated with ${cars.length} Dream Cars!`);
    
    // Find Ferrari and add sample bids
    const ferrari = cars.find(car => car.make === "Ferrari" && car.model === "F40");
    
    if (ferrari) {
        // Create a test user for bids (or use existing users)
        let testUser = await User.findOne({ email: 'test@garage.com' });
        if (!testUser) {
            const passwordHash = crypto.createHash('sha256').update('test123').digest('hex');
            testUser = await User.create({
                providerId: `local_test_${Date.now()}`,
                provider: 'local',
                displayName: 'Test Bidder',
                email: 'test@garage.com',
                password: passwordHash
            });
        }
        
        // Add sample bids for Ferrari to make it look active (capped at Stripe limit)
        const sampleBids = [
            { amount: 10000, minutesAgo: 45 },
            { amount: 450000, minutesAgo: 32 },
            { amount: 500000, minutesAgo: 18 },
            { amount: 510000, minutesAgo: 5 }
        ];
        
        for (const bidData of sampleBids) {
            const bid = new Bid({
                car: ferrari._id,
                user: testUser._id,
                amount: bidData.amount,
                timestamp: new Date(Date.now() - bidData.minutesAgo * 60000)
            });
            await bid.save();
            ferrari.bids.push(bid._id);
        }
        
        // Update Ferrari's current bid (capped at Stripe limit)
        ferrari.currentBid = 520000;
        await ferrari.save();
        
        console.log(`${ferrari.make} ${ferrari.model} auction populated with ${sampleBids.length} sample bids!`);
    }
    
    mongoose.connection.close();
    console.log(' Seeding complete! Database connection closed.');
};