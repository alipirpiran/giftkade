const mongoose = require('mongoose')

const Payment = mongoose.model('Payment', new mongoose.Schema({
    user: {
        type: {
            type: mongoose.SchemaTypes.ObjectId, ref: 'Users'
        },
    },
    order: {
        type: mongoose.SchemaTypes.ObjectId, ref: 'Orders'
    },
    token: {
        type: String,
        require: true,
    },
    transId: {
        type: String,

    },
    amount: {
        type: String,
        required: true,
    }

}))

module.exports = Payment;