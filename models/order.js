const mongoose = require('mongoose')

const Order = mongoose.model('Order', new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
    },
    localPrice: {
        type: Number,
        required: true
    },
    count: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    code: {
        type: [String],
        required: true
    },
    payed: {
        type: Boolean,
        default: false
    }

}));

module.exports = Order;