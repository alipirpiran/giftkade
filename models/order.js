const mongoose = require('mongoose')

const Order = mongoose.model('Order', new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    payment: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Payment'
    },
    subProduct: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'ProductSubType'
    },
    product: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Product'
    },

    title: {
        type: String,
        required: true
    },
    price: {
        type: String,
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
    finalGiftcards: {
        type: [{ type: mongoose.Types.ObjectId, ref: 'Token' }],
        default: []
    },
    // never send to client
    pendingGiftcards: {
        type: [{ type: mongoose.Types.ObjectId, ref: 'Token' }],
        default: []
    },
    isPayed: {
        type: Boolean,
        default: false
    },
    isRejected: {
        type: Boolean,
        default: false
    },
    time: {
        type: mongoose.Schema.Types.String,
        default: Date.now
    }

}));


module.exports = Order;