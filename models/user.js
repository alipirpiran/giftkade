const mongoose = require('mongoose');

const statistics = require('../services/statistics');
const notification = require('../services/notification');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: false,
    },
    password: {
        type: String,
        required: false,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isPhoneNumberValidated: {
        type: Boolean,
        default: false,
    },

    orders: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Order' }],
        default: [],
    },
    ordersCount: {
        type: Number,
        default: 0,
    },

    payments: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Payment' }],
        default: [],
    },
    dateJoined: {
        type: String,
    },
});

userSchema.pre('remove', async function(next) {
    await statistics.delUser();
    next();
});

userSchema.pre('save', async function(next) {
    if (this.isNew) {
        this.dateJoined = Date.now();
        statistics.addUser();
        notification.newUserNotification(
            this._id,
            this.phoneNumber,
            this.dateJoined
        );
    }
});

userSchema.post('init', function(doc) {
    doc.ordersCount = doc.orders.length;
    // next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
