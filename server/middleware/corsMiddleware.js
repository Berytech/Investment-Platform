const cors = require('cors');

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-admin-key'],
    credentials: true
};

// Open CORS configuration for public routes
const publicCors = cors(corsOptions);

// Restricted CORS configuration for admin routes
const adminCors = cors(corsOptions);

module.exports = {
    publicCors,
    adminCors
};
