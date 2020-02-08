const mongoose = require('mongoose')

const Order = mongoose.model('Order', new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    payment: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'payments'
    },
    subProduct:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'productSubTypes'
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
        type: [{ type: mongoose.Types.ObjectId, ref: 'tokens' }],
        default: []
    },
    // never send to client
    pendingGiftcards: {
        type: [{ type: mongoose.Types.ObjectId, ref: 'tokens' }],
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

}));

module.exports = Order;