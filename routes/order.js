const router = require('express').Router();
const joi = require('joi');

const SubProduct = require('../models/productSubType');
const Order = require('../models/order');
const User = require('../models/user');
const Token = require('../models/token');

const ObjectId = require('mongoose').Schema.Types.ObjectId;
const validateId = require('../middlewares/isObjectid');

const userAuth = require('../auth/user');
const adminAuth = require('../auth/admin');

const giftcardService = require('../services/giftcardService');
const sendService = require('../services/sendService');

const userMethods = require('../functions/user');
const orderMethods = require('../functions/order');

// const { getDargahURLAfterCreatingOrder } = require('./payment')
const { getDargahURLAfterCreatingOrder } = require('./zarinPayment');

const BASE_URL = process.env.PAYMENT_CALLBACK_URL;

//TODO send giftcard via email or sms
module.exports.verifyOrder = async (userId, orderId, payment) => {
    const order = await Order.findById(orderId);
    const user = await User.findById(userId);

    // complete order details, ispayed: true, add giftcards to final, add paymentid
    order.isPayed = true;
    order.payment = payment._id;

    // add pending gift card token to order final giftcards
    orderMethods.addFinalGiftcards(order);
    await order.save();

    // add order to user orders
    userMethods.addOrder(user, order._id);
    await user.save();

    // call giftcard service selled func: set tokens to selled, remove tokens from availible token for subproducts
    const { finalGiftcards: giftcards, subProduct: subProduct_id } = order;
    await giftcardService.setPendingGiftcardsToSelled({
        orderId,
        giftcards,
        subProduct_id,
        userId,
    });

    sendService.sendGiftcards({ order, user });
};

module.exports.rejectOrder = async orderId => {
    console.log('Order rejected: ' + orderId);

    const order = await Order.findById(orderId);
    giftcardService.setGiftcardsFree(order.subProduct, order.pendingGiftcards);

    order.isRejected = true;
    await order.save();
};

//* call when user want to buy product, return Dargah url
router.post('/', userAuth, async (req, res) => {
    const user_id = req.user;
    // router.post('/', async (req, res) => {
    // const user_id = req.body.user;

    const { error } = validateOder(req.body);
    if (error)
        return res.status(400).send({
            error: { message: 'سفارش ثبت شده دارای فرمت اشتباه است' },
        });

    const { count } = req.body;
    if (count <= 0)
        return res
            .status(400)
            .send({ error: { message: 'حداقل تعداد خرید یک عدد میباشد.' } });

    const subProduct = await SubProduct.findById(req.body.subProduct);
    if (!subProduct)
        return res
            .status(400)
            .send({ error: { message: 'محصول مورد نظر یافت نشد' } });

    const availibleGiftcards = await giftcardService.getFreeTokensCount(
        subProduct
    );
    if (count > availibleGiftcards)
        return res.status(400).send({
            error: {
                message: 'تعداد گیفت کارت درخواستی بیشتر از موجودی است.',
                giftCardCount: availibleGiftcards,
            },
        });

    const user = await User.findById(user_id);
    if (!user)
        return res.status(400).send({ error: { message: 'کاربر یافت نشد' } });

    const totalPrice = subProduct.localPrice * count;

    if (totalPrice <= 0)
        return res.status(400).send({
            error: {
                message: 'خطایی پیش آمد. مجموع قیمت ها باید بیشتر از صفر باشد.',
            },
        });

    //check target
    var targetType = null;
    var target = null;
    console.log(req.query);

    const { error: queryError } = validateOrderTarget(req.query);
    if (!queryError) {
        var { targetType: _targetType, target: _target } = req.query;
        if (_targetType == 'sms') {
            targetType = 'sms';
        } else {
            targetType = 'email';
        }

        if (_target) {
            target = _target;
        }
    }

    console.log(queryError);

    var orderSchema = {
        user: user._id,
        subProduct: subProduct._id,
        product: subProduct.product,

        time: Date.now(),

        price: subProduct.price,
        localPrice: subProduct.localPrice,
        title: subProduct.title,
        description: subProduct.description,

        totalPrice,
        count,
    };
    targetType ? (orderSchema.targetType = targetType) : null;
    target ? (orderSchema.target = target) : null;

    const _order = new Order(orderSchema);
    const order = await _order.save();

    // send user to Dargah Pardakht
    try {
        const { url, payment_id } = await getDargahURLAfterCreatingOrder(
            user_id,
            order,
            totalPrice,
            `${BASE_URL}/payment`,
            user.phoneNumber,
            'خرید گیفت کارت'
        );

        // add payment to user payments
        if (!user.payments) user.payments = [];
        user.payments.push(payment_id);
        await user.save();

        // add payment id to order
        order.payment = payment_id;
        await order.save();

        // add pending giftcard tokens to order Pending tokens
        const tokens = await giftcardService.getGiftcardAndSetToPending(
            subProduct,
            count,
            order._id
        );
        for (const token of tokens) order.pendingGiftcards.push(token._id);
        await order.save();

        return res.status(200).send({ url: url, order_id: order._id });
    } catch (error) {
        console.log(error);

        return res.status(400).send({
            error: { message: 'خطا هنگام ایجاد درگاه بانکی', dev: error },
        });
    }
});

router.get('/one/:order_id', userAuth, async (req, res) => {
    const order_id = req.params.order_id;

    const order = await Order.findById(order_id)
        .select(
            'user payment subProduct product title price localPrice count totalPrice finalGiftcards time isPayed isRejected target targetType'
        )
        .populate('finalGiftcards', '-isSelled -isPending');
    if (!order)
        return res
            .status(404)
            .send({ error: { message: 'گزارش خرید مورد نظر یافت نشد!' } });

    for (const giftcard of order.finalGiftcards) {
        giftcard.code = giftcardService.decryptToken(giftcard.code);
    }

    return res.status(200).send(order);
});

// if user: user orders, admin: all orders
router.get('/all', userAuth, async (req, res) => {
    const result = await Order.find({
        user: req.user,
        isPayed: true,
    })
        .setOptions({
            limit: parseInt(req.query.limit),
            skip: parseInt(req.query.skip),
        })
        .select(
            'user payment subProduct product title price localPrice count totalPrice finalGiftcards time isPayed isRejected target targetType'
        )
        .populate('finalGiftcards', '-isSelled -isPending');
    // .populate('subProduct', '-tokens -selledTokens')

    for (const order of result) {
        for (const giftcard of order.finalGiftcards) {
            giftcard.code = giftcardService.decryptToken(giftcard.code);
        }
    }
    res.send(result);
});

router.get('/admin/all', adminAuth, async (req, res) => {
    var conditions = {};
    // var isPayed = true;
    if (req.query.isPayed != null) {
        if (String(req.query.isPayed).toLowerCase() == 'false')
            conditions.isPayed = false;
        if (String(req.query.isPayed).toLowerCase() == 'true')
            conditions.isPayed = true;
    }

    const result = await Order.find(conditions).setOptions({
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
    });
    // .populate('finalGiftcards', '-isSelled -isPending');
    // .populate('subProduct', '-tokens -selledTokens')

    // for (const order of result) {
    //     for (const giftcard of order.finalGiftcards) {
    //         giftcard.code = giftcardService.decryptToken(giftcard.code);
    //     }
    // }
    res.send(result);
});

router.get('/user/:id', adminAuth, validateId, async (req, res) => {
    const result = await Order.find({
        user: req.params.id,
        isPayed: true,
    })
        .setOptions({
            limit: parseInt(req.query.limit),
            skip: parseInt(req.query.skip),
        })
        .select(
            'user payment subProduct product title price localPrice count totalPrice finalGiftcards time isPayed isRejected'
        )
        .populate('finalGiftcards', '-isSelled -isPending');
    // .populate('subProduct', '-tokens -selledTokens')

    // for (const order of result) {
    //     for (const giftcard of order.finalGiftcards) {
    //         giftcard.code = giftcardService.deCryptToken(giftcard.code)
    //     }
    // }
    res.send(result);
});

router.get('/date/:year/:month/:day', adminAuth, async (req, res) => {
    let { year, month, day } = req.params;
    year = parseInt(year);
    month = parseInt(month);
    day = parseInt(day);

    if (year <= 0 || month <= 0 || day <= 0)
        return res
            .status(400)
            .send({ error: { message: 'تاریخ ها باید بزرگتر از صفر باشد' } });

    var startDate = new Date(`${year}-${month}-${day}`);
    var endDate = new Date(`${year}-${month}-${day}`).setDate(day + 1);

    if (startDate == 'Invalid Date' || endDate == 'Invalid Date')
        return res.status(400).send({ error: { message: 'تاریخ اشتباه است' } });

    var orders = await Order.find({
        $or: [{ isPayed: true }, { isRejected: true }],
    });
    orders = orders.filter(order => {
        return order.isPayed && order.time >= startDate && order.time < endDate;
    });

    return res.send(orders);
});

function validateOder(order) {
    return joi.validate(order, {
        subProduct: joi
            .string()
            .length(24)
            .required(),
        count: joi
            .number()
            .max(100)
            .required(),
        target: joi.string().max(12),
    });
}

function validateOrderTarget(query) {
    if (query.targetType == 'sms') {
        return joi.validate(query, {
            target: joi
                .string()
                .regex(/^[0-9]+$/)
                .length(11),
            targetType: joi.string(),
        });
    } else if (query.targetType == 'email') {
        return joi.validate(query, {
            target: joi.string().email(),
            targetType: joi.string(),
        });
    } else {
        return { error: true };
    }
    return {};
}

module.exports.router = router;
