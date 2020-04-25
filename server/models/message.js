const mongoose = require('mongoose');

const Message = mongoose.model(
    'Message',
    new mongoose.Schema({
        message: {
            type: String,
        },
        senderEmail: {
            type: String,
        },
        senderPhoneNumber: {
            type: String,
        },
        date: {
            type: String,
        },
        isVisited: {
            type: Boolean,
            default: false,
        },
    })
);

module.exports = Message;
