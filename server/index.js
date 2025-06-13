const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const { publicCors, adminCors } = require('./middleware/corsMiddleware');

// More detailed logging for debugging
console.log('Starting server...');
console.log('Environment:', {
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI,
    NODE_ENV: process.env.NODE_ENV
});

const app = express();

// Global Middleware
app.use(express.json());
app.use(morgan('dev'));

// CORS configuration for static files
const staticFilesCors = cors({
    origin: '*',
    methods: 'GET',
    optionsSuccessStatus: 200
});

// Configure static file serving with CORS
app.use('/uploads', staticFilesCors, express.static(path.join(__dirname, 'public/uploads')));

// MongoDB Connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/investment-app';
        console.log('Attempting to connect to MongoDB at:', mongoURI);
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('MongoDB Connected Successfully');
        
        // Test the connection by getting the collections
        const collections = await mongoose.connection.db.collections();
        console.log('Available collections:', collections.map(c => c.collectionName));
        
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

connectDB();

// Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
