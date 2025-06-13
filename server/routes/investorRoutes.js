const express = require('express');
const router = express.Router();
const investorController = require('../controllers/investorController');

// Create new investor
router.post('/', investorController.createInvestor);

// Get investor details including remaining budget and investments
router.get('/:investorId', investorController.getInvestorDetails);

// Get investors by event
router.get('/event/:eventId', investorController.getInvestorsByEvent);

module.exports = router;
