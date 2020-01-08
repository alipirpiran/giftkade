const mongoose = require('mongoose')

const Payment = mongoose.model('Payment', new mongoose.Schema({
    user: {
        type: {
            type: mongoose.SchemaTypes.ObjectId, ref: 'Users'
        },
    },
    token: {
        type: String,
        require: true,
    },
    order: {
        type: mongoose.SchemaTypes.ObjectId, ref: 'Orders'
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