const mongoose = require('mongoose');
module.exports = (req, res, next) => {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next();
    }
    return res.status(400).send({ error: { message: 'ایدی اشتباه است' } });
};

