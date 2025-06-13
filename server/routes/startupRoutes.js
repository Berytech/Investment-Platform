const express = require('express');
const router = express.Router();
const startupController = require('../controllers/startupController');

// Create new startup
router.post('/', startupController.createStartup);

// Get startups by event
router.get('/event/:eventId', startupController.getStartupsByEvent);

// Get startup details
router.get('/:startupId', startupController.getStartupDetails);

module.exports = router;
