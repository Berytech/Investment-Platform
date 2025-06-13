const express = require('express');
const router = express.Router();
const { publicCors, adminCors } = require('../middleware/corsMiddleware');

const eventRoutes = require('./eventRoutes');
const investorRoutes = require('./investorRoutes');
const startupRoutes = require('./startupRoutes');
const investmentRoutes = require('./investmentRoutes');
const adminRoutes = require('./adminRoutes');

// Public routes with open CORS
router.use('/events', publicCors, eventRoutes);
router.use('/investors', publicCors, investorRoutes);
router.use('/startups', publicCors, startupRoutes);
router.use('/investments', publicCors, investmentRoutes);

// Admin routes with restricted CORS
router.use('/admin', adminCors, adminRoutes);

module.exports = router;
