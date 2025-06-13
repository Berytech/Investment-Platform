class APIResponse {
    static success(res, data, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }

    static error(res, message = 'Internal Server Error', statusCode = 500) {
        return res.status(statusCode).json({
            success: false,
            message
        });
    }
}

module.exports = APIResponse;
