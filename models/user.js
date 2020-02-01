const mongoose = require('mongoose');

const User = mongoose.model('User', new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
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
        type: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Orders' }],
        default: []
    },

    payments: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Payments' }],
        default: []
    }
}));

module.exports = User;