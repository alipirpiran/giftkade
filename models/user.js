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

    orders: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Orders' }],
        default: []
    }
}));

module.exports = User;