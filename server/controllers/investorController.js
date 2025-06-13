const { Investor, Event, Investment, Startup } = require('../models');
const APIResponse = require('../utils/APIResponse');
const mongoose = require('mongoose');

const investorController = {
    // Create a new investor
    async createInvestor(req, res) {
        try {
            const { name, eventId } = req.body;
            
            if (!mongoose.Types.ObjectId.isValid(eventId)) {
                return APIResponse.error(res, 'Invalid event ID', 400);
            }

            const event = await Event.findById(eventId);
            if (!event) {
                return APIResponse.error(res, 'Event not found', 404);
            }

            const investor = new Investor({
                name,
                eventId,
                remainingBudget: event.totalBudgetPerInvestor
            });
            
            await investor.save();
            return APIResponse.success(res, investor, 'Investor created successfully', 201);
        } catch (error) {
            console.error('Create investor error:', error);
            return APIResponse.error(res, error.message);
        }
    },

    // Get investor details including remaining budget and investments
    async getInvestorDetails(req, res) {
        try {
            const { investorId } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(investorId)) {
                return APIResponse.error(res, 'Invalid investor ID', 400);
            }

            console.log('Fetching details for investor:', investorId);
            
            // Get investor with event details
            const investor = await Investor.findById(investorId)
                .populate('eventId', 'name totalBudgetPerInvestor');
                
            if (!investor) {
                return APIResponse.error(res, 'Investor not found', 404);
            }

            console.log('Found investor:', {
                name: investor.name,
                remainingBudget: investor.remainingBudget,
                eventId: investor.eventId
            });

            try {
                // Get investments and startups in parallel
                const [investments, startups] = await Promise.all([
                    Investment.find({ investorId })
                        .populate('startupId', 'name')
                        .lean(),
                    Startup.find({ eventId: investor.eventId })
                        .select('name')
                        .lean()
                ]);

                console.log('Found investments:', investments);
                console.log('Available startups:', startups);

                const response = {
                    _id: investor._id,
                    name: investor.name,
                    event: {
                        _id: investor.eventId._id,
                        name: investor.eventId.name,
                        totalBudgetPerInvestor: investor.eventId.totalBudgetPerInvestor
                    },
                    remainingBudget: investor.remainingBudget,
                    investments: investments.map(inv => ({
                        _id: inv._id,
                        startupId: inv.startupId._id,
                        startupName: inv.startupId.name,
                        amount: inv.amount
                    })),
                    availableStartups: startups.map(startup => ({
                        _id: startup._id,
                        name: startup.name
                    }))
                };

                return APIResponse.success(res, response);
            } catch (error) {
                console.error('Error getting related data:', error);
                return APIResponse.error(res, 'Error getting investments and startups');
            }
        } catch (error) {
            console.error('Get investor details error:', error);
            return APIResponse.error(res, 'Error getting investor details');
        }
    },

    // Get investors by event
    async getInvestorsByEvent(req, res) {
        try {
            const { eventId } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(eventId)) {
                return APIResponse.error(res, 'Invalid event ID', 400);
            }

            const investors = await Investor.find({ eventId })
                .populate('eventId', 'name totalBudgetPerInvestor')
                .lean();

            return APIResponse.success(res, investors);
        } catch (error) {
            console.error('Get investors by event error:', error);
            return APIResponse.error(res, 'Error getting investors');
        }
    }
};

module.exports = investorController;
