const mongoose = require('mongoose');

const User = mongoose.model('User', new mongoose.Schema({
    email: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: false
    },
    phoneNumber: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isPhoneNumberValidated: {
        type: Boolean,
        default: false
    },

    orders: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Order' }],
        default: []
    },

    payments: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Payment' }],
        default: []
    }
}));

module.exports = User;