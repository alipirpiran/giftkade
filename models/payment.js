const mongoose = require('mongoose')

const Payment = mongoose.model('Payment', new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Users',
        required: true
    },
    order: {
        type: mongoose.SchemaTypes.ObjectId, ref: 'Orders'

    },
    token: {
        type: String,
        required: true,
    },
    refId: {
        type: String,

    },
    amount: {
        type: String,
        required: true,
    }

}))

module.exports = Payment;