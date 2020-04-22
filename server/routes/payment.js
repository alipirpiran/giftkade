const joi = require('joi');
const router = require('express').Router();
const Payment = require('../models/payment');
const adminAuth = require('../auth/admin');

router.get('/', adminAuth, async (req, res) => {
    let {
        id,
        user,
        order,
        ref,
        startDate,
        endDate,
        limit,
        skip,
        isPayed,
        isRejected,
    } = req.query;
    let conditions = {};

    id ? (conditions._id = id) : null;
    user ? (conditions.user = user) : null;
    order ? (conditions.order = order) : null;
    ref ? (conditions.ref = ref) : null;

    if (isPayed) {
        conditions.isPayed = isPayed == 'true';
    }
    if (isRejected) {
        conditions.isRejected = isRejected == 'true';
    }

    startDate = new Date(startDate);
    endDate = new Date(endDate);

    const options = {
        limit: parseInt(limit),
        skip: parseInt(skip),
    };

    try {
        let payments = Payment.find(conditions).setOptions(options);
        payments.populate('user', 'phoneNumber email');
        if (id) {
            payments = payments.populate('order');
            // .populate('user', '-orders');
        }

        payments = await payments;

        let filter = (payment) => {
            let valid = true;

            startDate != 'Invalid Date'
                ? (valid = payment.timeCreated >= startDate)
                : null;
            endDate != 'Invalid Date'
                ? (valid = payment.timeCreated < endDate && valid)
                : null;

            return valid;
        };

        payments = payments.filter(filter);

        return res.send(payments.reverse());
    } catch (error) {
        console.log(error);

        return res.send({});
    }
});

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

// router.post('/update/:id', adminAuth, async (req, res) => {
//     const { error } = validatePayment(req.body);
//     if (error)
//         return res
//             .status(400)
//             .send({ error: { message: 'لطفا ورودی هارا کنترل کنید' } });

//     const id = req.params.id;
    
//     const payment = await Payment.findByIdAndUpdate(id, req.body);
    
//     return res.send(payment);
// });

function validatePayment(payment) {
    return joi.validate(payment, {
        isRejected: joi.boolean(),
    });
}

module.exports = router;
