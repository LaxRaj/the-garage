require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');

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
        askingPrice: 295000,
        minPrice: 265000, // ~10% below asking
        description: "The ultimate track tool. Weissach Package included.",
        image: "/assets/photo/porsche_911.png",
        modelPath: "/assets/sls300.glb",
        status: "AVAILABLE",
        offers: [],
        isListed: true,
        owner: null,
        specs: { engine: "4.0L Flat-6", hp: "518 hp", zeroSixty: "3.0s" }
    },
    {
        make: "Ferrari",
        model: "F40",
        year: 1991,
        askingPrice: 2450000,
        minPrice: 2200000, // ~10% below asking
        description: "The last Ferrari approved by Enzo himself. Raw, analog perfection.",
        image: "/assets/photo/Ferrari_F40.png",
        modelPath: "/assets/sls300.glb",
        status: "AVAILABLE",
        offers: [],
        isListed: true,
        owner: null,
        specs: { engine: "2.9L Twin-Turbo V8", hp: "471 hp", zeroSixty: "4.1s" }
    },
    {
        make: "McLaren",
        model: "F1",
        year: 1994,
        askingPrice: 20000000,
        minPrice: 18000000, // ~10% below asking
        description: "The gold standard. Center seat, gold-lined engine bay.",
        image: "/assets/photo/McLaren_F1.png",
        modelPath: "/assets/sls300.glb",
        status: "AVAILABLE",
        offers: [],
        isListed: true,
        owner: null,
        specs: { engine: "6.1L BMW V12", hp: "618 hp", zeroSixty: "3.2s" }
    },
    {
        make: "Lamborghini",
        model: "Countach LP5000",
        year: 1988,
        askingPrice: 650000,
        minPrice: 585000, // ~10% below asking
        description: "The poster car of the 80s. Impossible geometry.",
        image: "/assets/photo/Lamborghini_Countach.png",
        modelPath: "/assets/sls300.glb",
        status: "AVAILABLE",
        offers: [],
        isListed: true,
        owner: null,
        specs: { engine: "5.2L V12", hp: "449 hp", zeroSixty: "4.7s" }
    },
    {
        make: "Aston Martin",
        model: "DB5 (Bond Spec)",
        year: 1964,
        askingPrice: 3500000,
        minPrice: 3150000, // ~10% below asking
        description: "The most famous car in the world. Silver Birch finish.",
        image: "/assets/photo/aston.png",
        modelPath: "/assets/sls300.glb",
        status: "AVAILABLE",
        offers: [],
        isListed: true,
        owner: null,
        specs: { engine: "4.0L I-6", hp: "282 HP", zeroSixty: "8.0s" }
    },
    {
        make: "Mercedes-Benz",
        model: "300 SL Gullwing",
        year: 1954,
        askingPrice: 1500000,
        minPrice: 1350000, // ~10% below asking
        description: "The original supercar. Alloy bodywork and tartan seats.",
        image: "/assets/photo/mercedes.png",
        modelPath: "/assets/sls300.glb",
        status: "AVAILABLE",
        offers: [],
        isListed: true,
        owner: null,
        specs: { engine: "3.0L I-6", hp: "215 HP", zeroSixty: "8.8s" }
    },
    {
        make: "Rolls-Royce",
        model: "Phantom VIII",
        year: 2024,
        askingPrice: 550000,
        minPrice: 495000, // ~10% below asking
        description: "The architecture of luxury. Absolute silence.",
        image: "/assets/photo/rolls.png",
        modelPath: "/assets/sls300.glb",
        status: "AVAILABLE",
        offers: [],
        isListed: true,
        owner: null,
        specs: { engine: "6.75L V12", hp: "563 HP", zeroSixty: "5.1s" }
    },
    {
        make: "Jaguar",
        model: "E-Type Series 1",
        year: 1961,
        askingPrice: 730000,
        minPrice: 657000, // ~10% below asking
        description: "Enzo Ferrari called it 'The most beautiful car ever made.'",
        image: "/assets/photo/jaguar.png",
        modelPath: "/assets/sls300.glb",
        status: "AVAILABLE",
        offers: [],
        isListed: true,
        owner: null,
        specs: { engine: "3.8L I-6", hp: "265 HP", zeroSixty: "6.9s" }
    }
];

const seedDB = async () => {
    await Car.deleteMany({}); // CLEAR existing data to avoid duplicates
    
    const cars = await Car.insertMany(dreamCars);
    console.log(`✅ Garage Populated with ${cars.length} Dream Cars!`);
    console.log(`   All cars are set to AVAILABLE status with askingPrice and minPrice configured.`);
    
    mongoose.connection.close();
    console.log('✅ Seeding complete! Database connection closed.');
};