const router = require('express').Router();
const Payment = require('../models/payment');
const adminAuth = require('../auth/admin');

// get payment by id
router.get('/payment/:id', adminAuth, async (req, res) => {
    const id = req.params.id;
    const payment = await Payment.findById(id);
    if (payment) return res.status(200).send(payment);
    return res.status(400).send({ error: { message: 'یافت نشد' } });
});

// get user payments
router.get('/user/:id', adminAuth, async (req, res) => {
    const userId = req.params.id;
    const payments = await Payment.find({ user: userId });
    if (!payments)
        return res.status(400).send({ error: { message: 'چیزی یافت نشد' } });

    return res.send({ items: payments });
});

// get order payments
router.get('/order/:id', adminAuth, async (req, res) => {
    const orderId = req.params.id;
    const payments = await Payment.find({ order: orderId });
    if (!payments)
        return res.status(400).send({ error: { message: 'چیزی یافت نشد' } });

    return res.send({ items: payments });
});

//get payment by refId
router.get('/ref/:id', adminAuth, async (req, res) => {
    const id = req.params.id;
    const payment = await Payment.findOne({ refId: id });
    if (!payment)
        return res.status(400).send({ error: { message: 'چیزی یافت نشد' } });

    return res.send({ payment });
});

module.exports = router;
