const mongoose = require('mongoose');

const Payment = mongoose.model(
    'Payment',
    new mongoose.Schema({
        user: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            required: true,
        },
        order: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Order',
        },
        authority: {
            type: String,
            required: true,
        },
        refId: {
            type: String,
        },
        amount: {
            type: String,
            required: true,
        },

        isPayed: {
            type: Boolean,
            default: false,
        },
        isRejected: {
            type: Boolean,
            default: false,
        },
        timeCreated: {
            type: String,
            default: '0',
        },
    })
);

module.exports = Payment;
