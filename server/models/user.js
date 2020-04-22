const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    isActive: {
        type: Boolean,
        default: true,
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

userSchema.pre('remove', async function (next) {
    await statistics.delUser();
    next();
});

userSchema.pre('save', async function (next) {
    if (this.isNew) {
        this.dateJoined = Date.now();
        this.isActive = true;
        statistics.addUser();
        notification.newUserNotification(
            this._id,
            this.phoneNumber,
            this.dateJoined
        );
    }
    if (this.password)
        if (this.isModified('password') || this.isNew) {
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(this.password, salt);
            this.password = hashedPassword;
        }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
