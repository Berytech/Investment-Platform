const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');

// Make an investment
router.post('/', investmentController.makeInvestment);

// Get investment history
router.get('/:investmentId/history', investmentController.getInvestmentHistory);

// Get investment summaries per event
router.get('/summary/:eventId', investmentController.getEventInvestmentSummary);

module.exports = router;
