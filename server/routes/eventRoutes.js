const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// Create new event
router.post('/', eventController.createEvent);

// Get event details including startups and investors
router.get('/:eventId', eventController.getEventDetails);

// Get all events
router.get('/', eventController.getAllEvents);

module.exports = router;
