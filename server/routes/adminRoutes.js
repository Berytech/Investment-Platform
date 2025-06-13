const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const { Event, Investor, Startup } = require('../models');
const APIResponse = require('../utils/APIResponse');

// Apply admin middleware to all routes
router.use(adminMiddleware);

// Event Routes
router.get('/events', async (req, res) => {
    try {
        const events = await Event.find({}).sort({ date: -1 }).lean();
        console.log('Found events:', events); // Debug log
        
        // Send explicit response structure
        res.json({
            success: true,
            message: 'Events retrieved successfully',
            data: events
        });
    } catch (error) {
        console.error('Error in /admin/events:', error); // Debug log
        return APIResponse.error(res, error.message);
    }
});

router.post('/events', async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();
        return APIResponse.success(res, event, 'Event created successfully', 201);
    } catch (error) {
        return APIResponse.error(res, error.message);
    }
});

router.put('/events/:id', async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!event) return APIResponse.error(res, 'Event not found', 404);
        return APIResponse.success(res, event, 'Event updated successfully');
    } catch (error) {
        return APIResponse.error(res, error.message);
    }
});

router.delete('/events/:id', async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return APIResponse.error(res, 'Event not found', 404);
        
        // Clean up related records
        await Promise.all([
            Investor.deleteMany({ eventId: req.params.id }),
            Startup.deleteMany({ eventId: req.params.id })
        ]);
        
        return APIResponse.success(res, null, 'Event and related records deleted successfully');
    } catch (error) {
        return APIResponse.error(res, error.message);
    }
});

// Investor Routes
router.get('/investors/event/:eventId', async (req, res) => {
    try {
        const investors = await Investor.find({ eventId: req.params.eventId });
        return APIResponse.success(res, investors, 'Investors retrieved successfully');
    } catch (error) {
        return APIResponse.error(res, error.message);
    }
});

router.post('/investors', async (req, res) => {
    try {
        const { name, eventId, budget } = req.body;
        
        const event = await Event.findById(eventId);
        if (!event) return APIResponse.error(res, 'Event not found', 404);
        
        const investor = new Investor({
            name,
            eventId,
            remainingBudget: budget || event.totalBudgetPerInvestor
        });
        
        await investor.save();
        return APIResponse.success(res, investor, 'Investor created successfully', 201);
    } catch (error) {
        return APIResponse.error(res, error.message);
    }
});

router.put('/investors/:id', async (req, res) => {
    try {
        const investor = await Investor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!investor) return APIResponse.error(res, 'Investor not found', 404);
        return APIResponse.success(res, investor, 'Investor updated successfully');
    } catch (error) {
        return APIResponse.error(res, error.message);
    }
});

router.delete('/investors/:id', async (req, res) => {
    try {
        const investor = await Investor.findByIdAndDelete(req.params.id);
        if (!investor) return APIResponse.error(res, 'Investor not found', 404);
        return APIResponse.success(res, null, 'Investor deleted successfully');
    } catch (error) {
        return APIResponse.error(res, error.message);
    }
});

// Startup Routes
router.get('/startups/event/:eventId', async (req, res) => {
    try {
        const startups = await Startup.find({ eventId: req.params.eventId });
        return APIResponse.success(res, startups, 'Startups retrieved successfully');
    } catch (error) {
        return APIResponse.error(res, error.message);
    }
});

const upload = require('../middleware/uploadMiddleware');

router.post('/startups', upload.single('logo'), async (req, res) => {
    try {
        const { name, eventId } = req.body;
        
        const event = await Event.findById(eventId);
        if (!event) return APIResponse.error(res, 'Event not found', 404);
        
        const startupData = {
            name,
            eventId,
            logoUrl: req.file ? `/uploads/${req.file.filename}` : null
        };
        
        const startup = new Startup(startupData);
        await startup.save();
        return APIResponse.success(res, startup, 'Startup created successfully', 201);
    } catch (error) {
        return APIResponse.error(res, error.message);
    }
});

router.put('/startups/:id', async (req, res) => {
    try {
        const startup = await Startup.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!startup) return APIResponse.error(res, 'Startup not found', 404);
        return APIResponse.success(res, startup, 'Startup updated successfully');
    } catch (error) {
        return APIResponse.error(res, error.message);
    }
});

router.delete('/startups/:id', async (req, res) => {
    try {
        const startup = await Startup.findByIdAndDelete(req.params.id);
        if (!startup) return APIResponse.error(res, 'Startup not found', 404);
        return APIResponse.success(res, null, 'Startup deleted successfully');
    } catch (error) {
        return APIResponse.error(res, error.message);
    }
});

// Debug route to check MongoDB directly
router.get('/debug/events', async (req, res) => {
    try {
        const events = await Event.find({}).lean();
        console.log('Debug - Raw events from MongoDB:', events);
        return res.json({
            count: events.length,
            events: events
        });
    } catch (error) {
        console.error('Debug route error:', error);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;
