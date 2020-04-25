const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const Errors = require('../templates/error');
const LOCAL_AUTH_TOKEN = process.env.LOCAL_AUTH_TOKEN;

const User = require('../models/user');

module.exports = async (req, res, next) => {
    // return next()
    const authToken = req.header('auth-token');
    if (!authToken) return next(Errors.forbidden());

    if (isReqFromLocalhost(req)) return next();

    try {
        const payload = jwt.verify(authToken, process.env.TOKEN_SECRET);
        
        if (!payload.exp || payload.exp - Date.now() / 1000 < 0)
            return next(Errors.forbidden());

        if (payload._id) {
            const user = await User.findById(payload._id);
            if (user && user.isAdmin && user.isActive) {
                req.user = payload._id;
                return next();
            }
        }

        return next(Errors.forbidden());
    } catch (error) {
        return next(Errors.forbidden());
    }
};

let isReqFromLocalhost = function (req) {
    if (!LOCAL_AUTH_TOKEN) return false;

    if (req.headers['auth-token'] == LOCAL_AUTH_TOKEN) return true;
    return false;
};
