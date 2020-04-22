const mongoose = require('mongoose');

const statistic = require('../services/statistics');
const notification = require('../services/notification');

const counterid = 'counter';
let CounterSchema = mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: String, default: '0' },
});
let Counter = mongoose.model('counter', CounterSchema);

const orderSchema = new mongoose.Schema({
    user: {
        phoneNumber: String,
        id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    payment: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Payment',
    },
    subProduct: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'ProductSubType',
    },
    product: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Product',
    },

    title: {
        type: String,
        required: true,
    },
    productTitle: {
        type: String,
    },
    price: {
        type: String,
        required: true,
    },
    localPrice: {
        type: Number,
        required: true,
    },
    count: {
        type: Number,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    finalGiftcards: {
        type: [{ type: mongoose.Types.ObjectId, ref: 'Token' }],
        default: [],
    },
    // never send to client
    pendingGiftcards: {
        type: [{ type: mongoose.Types.ObjectId, ref: 'Token' }],
        default: [],
    },
    time: {
        type: mongoose.Schema.Types.String,
        required: true,
        // default: Date.now,
    },
    targetType: {
        type: String,
        default: 'email',
        enum: ['email', 'sms'],
    },
    target: {
        type: String,
    },
    orderid: {
        type: Number,
        default: 0,
    },
});

orderSchema.pre('remove', async function (next) {
    await statistic.delOrder();

    try {
        const user = await this.model('User').findById(this.user.id);

        const index = user.orders.indexOf(this._id);

        user.orders.splice(index, 1);
        await user.save();
    } catch (error) {}

    next();
});

orderSchema.pre('save', async function (next) {
    if (this.isNew) {
        await statistic.addOrder();
        if (!this.orderid) {
            this.orderid = await getNextOrderid();
        }

        notification.newOrder(
            this._id,
            this.title,
            this.totalPrice,
            this.count
        );
    }
    if (this.isModified('isPayed') && this.isPayed) {
        await statistic.addPayedOrder(this);
    }
    next();
});

async function getNextOrderid() {
    let counter = await Counter.findById(counterid);
    if (!counter) {
        counter = new Counter({ _id: counterid, seq: '11111' });
        counter = await counter.save();
    }
    counter.seq++;
    counter.save();
    return counter.seq;
}

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
