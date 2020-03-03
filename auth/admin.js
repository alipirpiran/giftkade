const jwt = require('jsonwebtoken');

const User = require('../models/user');

module.exports = async (req, res, next) => {
    const authToken = req.header('auth-token');
    if (!authToken)
        return res
            .status(403)
            .send({ error: { message: 'شما دسترسی ندارید' } });

    // this is for test , TODO : delete it later
    if (authToken == 'test') return next();
    try {
        const payload = jwt.verify(authToken, process.env.TOKEN_SECRET);
        if (payload._id) {
            const user = await User.findById(payload._id);
            if (user && user.isAdmin) {
                req.user = payload._id;
                next();
            }
        }

        return res
            .status(400)
            .send({ error: { message: 'شما دسترسی ندارید' } });
    } catch (error) {
        return res
            .status(400)
            .send({ error: { message: 'شما دسترسی ندارید' } });
    }
};
