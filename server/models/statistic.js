const mongoose = require('mongoose');

module.exports = mongoose.model(
    'Statistic',
    new mongoose.Schema({
        userCount: {
            type: Number,
            default: 0,
        },
        orderCount: {
            type: Number,
            default: 0,
        },
        productCount: {
            type: Number,
            default: 0,
        },
        payedOrderCount: {
            type: Number,
            default: 0,
        },
    })
);
