const mongoose = require('mongoose')
// used only in pay.ir payments!!!
const Transaction = mongoose.model('transaction', new mongoose.Schema({
    status: {
        type: Number,
        required: true
    },
    transId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    factorNumber: {
        type: Number,
        required: true
    },
    mobile: {
        type: String,
    },
    description: {
        type: String
    },
    cardNumber: {
        type: String
    },
    message: {
        type: String
    }


}))

module.exports = Transaction;