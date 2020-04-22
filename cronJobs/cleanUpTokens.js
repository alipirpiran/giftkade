const Payment = require('../server/models/payment');
const rejectOrder = require('../server/routes/order').rejectOrder;
const expireTime = 20 * 60 * 1000;

const func = async function () {
    const now = Date.now();
    const payments = await Payment.find({ isPayed: false, isRejected: false });
    for (const payment of payments) {
        if (now - payment.timeCreated < expireTime) continue;
        payment.isRejected = true;
        await payment.save();
        rejectOrder(payment.order);
    }
};

module.exports = func;
