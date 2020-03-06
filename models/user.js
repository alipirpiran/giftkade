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

userSchema.pre('save', async function(next) {
    if (this.isNew) {
        await statistics.addUser();
        this.dateJoined = Date.now();
        notification.newUserNotification(
            this._id,
            this.mobile,
            this.dateJoined
        );
    }
    // return;

    next();
});
userSchema.pre('remove', async function(next) {
    await statistics.delUser();
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
