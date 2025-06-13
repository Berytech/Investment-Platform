const APIResponse = require('../utils/APIResponse');

const adminMiddleware = (req, res, next) => {
    // TODO: Replace this with proper admin authentication
    const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY;
    
    if (!isAdmin) {
        return APIResponse.error(res, 'Unauthorized: Admin access required', 403);
    }
    
    next();
};

module.exports = adminMiddleware;
