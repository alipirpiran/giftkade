const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authToken = req.header('auth-token');
    if (!authToken)
        return res
            .status(403)
            .send({ error: { message: 'شما دسترسی ندارید' } });

    try {
        const payload = jwt.verify(authToken, process.env.TOKEN_SECRET);
        req.user = payload._id;
        next();
    } catch (error) {
        return res
            .status(400)
            .send({ error: { message: 'شما دسترسی ندارید' } });
    }
};
