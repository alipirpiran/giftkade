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
    isPhoneNumberValidated: {
        type: Boolean
    },

    shopingHistory: {
        type: [],
        default: []
    }
}));

module.exports = User;