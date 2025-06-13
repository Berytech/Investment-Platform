const { Startup, Event } = require('../models');
const APIResponse = require('../utils/APIResponse');

const startupController = {
    // Create a new startup
    async createStartup(req, res) {
        try {
            const { name, eventId } = req.body;
            
            // Validate event exists
            const event = await Event.findById(eventId);
            if (!event) {
                return APIResponse.error(res, 'Event not found', 404);
            }

            const startup = new Startup({
                name,
                eventId
            });
            
            await startup.save();
            return APIResponse.success(res, startup, 'Startup created successfully', 201);
        } catch (error) {
            return APIResponse.error(res, error.message);
        }
    },

    // Get startups by event
    async getStartupsByEvent(req, res) {
        try {
            const { eventId } = req.params;
            const startups = await Startup.find({ eventId });
            return APIResponse.success(res, startups);
        } catch (error) {
            return APIResponse.error(res, error.message);
        }
    },

    // Get startup details
    async getStartupDetails(req, res) {
        try {
            const { startupId } = req.params;
            const startup = await Startup.findById(startupId).populate('eventId');
            if (!startup) {
                return APIResponse.error(res, 'Startup not found', 404);
            }
            return APIResponse.success(res, startup);
        } catch (error) {
            return APIResponse.error(res, error.message);
        }
    }
};

module.exports = startupController;
