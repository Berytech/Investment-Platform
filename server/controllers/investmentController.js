const { Investment, Investor, Startup, Event } = require('../models');
const APIResponse = require('../utils/APIResponse');
const mongoose = require('mongoose');

const investmentController = {
    // Make an investment
    async makeInvestment(req, res) {
        try {
            const { investorId, startupId, amount } = req.body;
            
            console.log('Making investment:', { investorId, startupId, amount }); // Debug log

            if (!investorId || !startupId || !amount) {
                return APIResponse.error(res, 'Missing required fields', 400);
            }

            // Get investor and validate remaining budget
            const investor = await Investor.findById(investorId);
            if (!investor) {
                return APIResponse.error(res, 'Investor not found', 404);
            }

            console.log('Investor found:', { 
                name: investor.name, 
                remainingBudget: investor.remainingBudget 
            }); // Debug log

            if (typeof amount !== 'number' || amount <= 0) {
                return APIResponse.error(res, 'Invalid investment amount', 400);
            }

            // Get startup and validate it belongs to same event
            const startup = await Startup.findById(startupId);
            if (!startup) {
                return APIResponse.error(res, 'Startup not found', 404);
            }

            console.log('Startup found:', { 
                name: startup.name, 
                eventId: startup.eventId 
            }); // Debug log

            if (startup.eventId.toString() !== investor.eventId.toString()) {
                return APIResponse.error(res, 'Startup and investor must belong to the same event', 400);
            }

            // Check for existing investment
            const existingInvestment = await Investment.findOne({
                investorId,
                startupId
            });

            if (investor.remainingBudget + existingInvestment.amount < amount) {
                return APIResponse.error(res, `Insufficient budget. Available: ${investor.remainingBudget}`, 400);
            }

            // assume investor, existingInvestment already fetched
            const newAmt = Number(amount);
            if (Number.isNaN(newAmt) || newAmt < 0)
                return APIResponse.error(res,'amount must be ≥ 0',400);

                if (existingInvestment) {
                    const diff = newAmt - existingInvestment.amount;   // + raise, – cut

            // only block if we need extra cash
            if (diff > 0 && diff > investor.remainingBudget)
                return APIResponse.error(res,
                    `Insufficient budget. Available: ${investor.remainingBudget}`, 400);

            // audit trail
            existingInvestment.history.push({
                amount: existingInvestment.amount,
                timestamp: new Date()
            });

            existingInvestment.amount = newAmt;
            investor.remainingBudget -= diff;                  // adds back when diff < 0

            await Promise.all([existingInvestment.save(), investor.save()]);

            return APIResponse.success(res,
            { investment: existingInvestment, remainingBudget: investor.remainingBudget },
            'Investment updated successfully');
}

            // Create new investment
            const investment = new Investment({
                investorId,
                startupId,
                eventId: investor.eventId,
                amount: Number(amount)
            });

            investor.remainingBudget = Number(investor.remainingBudget) - Number(amount);

            // Save changes without transaction
            await investment.save();
            await investor.save();
            
            return APIResponse.success(
                res, 
                { 
                    investment, 
                    remainingBudget: investor.remainingBudget 
                }, 
                'Investment successful', 
                201
            );
        } catch (error) {
            console.error('Investment error:', error); // Debug log
            return APIResponse.error(res, error.message || 'Error processing investment');
        }
    },

    // Get investment history
    async getInvestmentHistory(req, res) {
        try {
            const { investmentId } = req.params;

            const investment = await Investment.findById(investmentId)
                .populate('investorId', 'name')
                .populate('startupId', 'name')
                .lean();

            if (!investment) {
                return APIResponse.error(res, 'Investment not found', 404);
            }

            // Format history with readable dates and sorted by timestamp
            const history = investment.history
                .map(record => ({
                    ...record,
                    timestamp: new Date(record.timestamp).toISOString(),
                    formattedDate: new Date(record.timestamp).toLocaleString()
                }))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            const response = {
                _id: investment._id,
                investorName: investment.investorId.name,
                startupName: investment.startupId.name,
                currentAmount: investment.amount,
                history: history
            };

            return APIResponse.success(res, response);
        } catch (error) {
            return APIResponse.error(res, error.message);
        }
    },

    // Get investment summaries per event
    async getEventInvestmentSummary(req, res) {
        try {
            const { eventId } = req.params;

            console.log('Getting investment summary for event:', eventId); // Debug log

            if (!mongoose.Types.ObjectId.isValid(eventId)) {
                return APIResponse.error(res, 'Invalid event ID', 400);
            }

            // Validate event exists
            const event = await Event.findById(eventId);
            if (!event) {
                return APIResponse.error(res, 'Event not found', 404);
            }

            console.log('Found event:', event); // Debug log

            // Get total investments
            const totalInvestments = await Investment.aggregate([
                { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);

            // Get investments by startup
            const startupInvestments = await Investment.aggregate([
                { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
                { $group: { 
                    _id: "$startupId",
                    total: { $sum: "$amount" },
                    investmentCount: { $sum: 1 }
                }},
                { $lookup: {
                    from: 'startups',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'startup'
                }},
                { $unwind: '$startup' }
            ]);

            // Get investments by investor
            const investorInvestments = await Investment.aggregate([
                { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
                { $group: {
                    _id: "$investorId",
                    total: { $sum: "$amount" },
                    investmentCount: { $sum: 1 }
                }},
                { $lookup: {
                    from: 'investors',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'investor'
                }},
                { $unwind: '$investor' }
            ]);

            const summaryData = {
                eventTotal: totalInvestments[0]?.total || 0,
                byStartup: startupInvestments || [],
                byInvestor: investorInvestments || []
            };

            console.log('Generated summary:', summaryData); // Debug log

            return APIResponse.success(res, summaryData, 'Investment summary retrieved successfully');
        } catch (error) {
            console.error('Investment summary error:', error); // Debug log
            return APIResponse.error(res, error.message || 'Error retrieving investment summary');
        }
    },

    // Get investor details with investments
    async getInvestorDetails(req, res) {
        try {
            const { investorId } = req.params;
            
            console.log('Getting investor details for:', investorId); // Debug log
            
            const investor = await Investor.findById(investorId)
                .populate('eventId', 'name totalBudgetPerInvestor');

            if (!investor) {
                return APIResponse.error(res, 'Investor not found', 404);
            }

            console.log('Found investor:', investor); // Debug log

            // Get investments
            const investments = await Investment.find({ investorId })
                .populate('startupId', 'name')
                .populate('eventId', 'name')
                .lean();

            console.log('Found investments:', investments); // Debug log

            const investorData = {
                _id: investor._id,
                name: investor.name,
                eventId: investor.eventId,
                remainingBudget: investor.remainingBudget,
                initialBudget: investor.eventId.totalBudgetPerInvestor,
                investments: investments.map(inv => ({
                    ...inv,
                    startupName: inv.startupId.name,
                }))
            };

            return APIResponse.success(res, investorData);
        } catch (error) {
            console.error('Error getting investor details:', error); // Debug log
            return APIResponse.error(res, error.message || 'Error retrieving investor details');
        }
    },

    // Get investments for a specific investor
    async getInvestorInvestments(req, res) {
        try {
            const { investorId } = req.params;
            
            const investments = await Investment.find({ investorId })
                .populate('startupId', 'name')
                .lean();

            return APIResponse.success(res, investments);
        } catch (error) {
            return APIResponse.error(res, error.message);
        }
    },
};

module.exports = investmentController;
