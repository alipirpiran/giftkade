const mongoose = require('mongoose');

const ResetPass = mongoose.model('Reset', new mongoose.Schema({
    date: {
        type: mongoose.Schema.Types.Number,
        required: true
    },
    token: {
        type: String,
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    isUsed: {
        type: Boolean
    }

}));

module.exports = ResetPass;