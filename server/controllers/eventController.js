const { Event, Investor, Startup } = require('../models');
const APIResponse = require('../utils/APIResponse');

const eventController = {
    // Create a new event
    async createEvent(req, res) {
        try {
            const { name, date, totalBudgetPerInvestor } = req.body;
            const event = new Event({
                name,
                date,
                totalBudgetPerInvestor
            });
            await event.save();
            return APIResponse.success(res, event, 'Event created successfully', 201);
        } catch (error) {
            return APIResponse.error(res, error.message);
        }
    },

    // Get event details including startups and investors
    async getEventDetails(req, res) {
        try {
            const { eventId } = req.params;
            const event = await Event.findById(eventId);
            if (!event) {
                return APIResponse.error(res, 'Event not found', 404);
            }

            // Get investors and startups for this event
            const [investors, startups] = await Promise.all([
                Investor.find({ eventId }),
                Startup.find({ eventId })
            ]);

            return APIResponse.success(res, {
                event,
                investors,
                startups
            });
        } catch (error) {
            return APIResponse.error(res, error.message);
        }
    },

    // Get all events
    async getAllEvents(req, res) {
        try {
            const events = await Event.find({});
            return APIResponse.success(res, events);
        } catch (error) {
            return APIResponse.error(res, error.message);
        }
    }
};

module.exports = eventController;
