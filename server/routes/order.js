const router = require('express').Router();
const joi = require('joi');
const debug = require('debug')('giftShop:order');
const Errors = require('../templates/error');

const SubProduct = require('../models/productSubType');
const Order = require('../models/order');
const User = require('../models/user');
const Payment = require('../models/payment');

const validateId = require('../middlewares/isObjectid');

const userAuth = require('../auth/user');
const adminAuth = require('../auth/admin');

const giftcardService = require('../services/giftcardService');
const sendService = require('../services/sendService');

const userMethods = require('../functions/user');
const orderMethods = require('../functions/order');

// const { getDargahURLAfterCreatingOrder } = require('./payment')
const { getDargahURLAfterCreatingOrder } = require('./zarinPayment');

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

    sendService.sendGiftcards({ order, user, payment });

    return order;
};

module.exports.rejectOrder = async function rejectOrder(orderId) {
    const order = await Order.findById(orderId);
    if (!order) return debug('Rejecting: Order not found: ' + orderId);

    const payment = await Payment.findById(order.payment);
    if (!payment || payment.isPayed)
        return debug(
            'Rejecting: Payment not found or isPayed, order: ' + orderId
        );

    payment.isRejected = true;
    giftcardService.setGiftcardsFree(order.subProduct, order.pendingGiftcards);

    await order.save();
    await payment.save();
    debug('Order rejected: ' + orderId);
    return order;
};

//* call when user want to buy product, return Dargah url
router.post('/', userAuth, async (req, res, next) => {
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

    const subProduct = await SubProduct.findById(req.body.subProduct).populate(
        'product'
    );
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
    if (!user) return next(Errors.userNotFound());

    const totalPrice = subProduct.localPrice * count;

    if (totalPrice <= 0)
        return res.status(400).send({
            error: {
                message: 'خطایی پیش آمد. مجموع قیمت ها باید بیشتر از صفر باشد.',
            },
        });

    //check target
    let targetType = 'email';
    let target = user.email;

    const { error: queryError } = validateOrderTarget(req.query);

    if (!queryError) {
        let { targetType: _targetType, target: _target } = req.query;
        targetType = _targetType;

        if (_target) {
            target = _target;
        } else {
            targetType == 'email'
                ? (target = user.email)
                : (target = user.phoneNumber);
        }
    } else {
        debug(queryError);
    }

    var orderSchema = {
        user: {
            phoneNumber: user.phoneNumber,
            id: user._id,
        },
        subProduct: subProduct._id,
        product: subProduct.product._id,

        time: Date.now(),

        productTitle: subProduct.product.title,
        title: subProduct.title,
        price: subProduct.price,
        localPrice: subProduct.localPrice,
        description: subProduct.description,

        totalPrice,
        count,

        targetType,
        target,
    };

    const _order = new Order(orderSchema);
    const order = await _order.save();

    // send user to Dargah Pardakht
    try {
        const { url, payment_id } = await getDargahURLAfterCreatingOrder({
            user_id,
            order,
            amount: totalPrice,
            email: user.email,
            mobile: user.phoneNumber,
            description: 'خرید گیفت کارت',
        });

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
            error: { message: 'خطا هنگام ایجاد درگاه بانکی' },
        });
    }
});

router.get('/one/:order_id', userAuth, async (req, res) => {
    const order_id = req.params.order_id;

    const order = await Order.findOne({
        _id: order_id,
        'user.id': req.user,
    })
        .select('-pendingGiftcards')
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
        .select('-pendingGiftcards')
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

    const result = await Order.find(conditions)
        .setOptions({
            limit: parseInt(req.query.limit),
            skip: parseInt(req.query.skip),
        })
        .populate('payment');
    res.send(result.reverse());
});

router.get('/admin/one/:order_id', adminAuth, async (req, res) => {
    const order_id = req.params.order_id;

    let order;
    try {
        order = await Order.findById(order_id)
            // .populate('finalGiftcards', '-isSelled -isPending');
            .populate('user.id', '-orders -payments -password')
            .populate('payment')
            .populate('subProduct', '-tokens -selledTokens')
            .populate('product', '-types');
    } catch (error) {
        return res.status(400).send({ error: { message: 'خطا پیش آمد.' } });
    }

    if (!order)
        return res
            .status(404)
            .send({ error: { message: 'گزارش خرید مورد نظر یافت نشد!' } });

    return res.status(200).send(order);
});

router.get('/admin', adminAuth, async (req, res) => {
    let {
        userId,
        orderId,
        productId,
        subProductId,
        payment,
        limit,
        skip,
        startDate,
        endDate,
        isPayed,
    } = req.query;

    let conditions = {};
    orderId ? (conditions['_id'] = orderId) : null;
    userId ? (conditions['user.id'] = userId) : null;
    productId ? (conditions['product'] = productId) : null;
    subProductId ? (conditions['subProduct'] = subProductId) : null;
    payment ? (conditions['payment'] = payment) : null;

    isPayed = String(isPayed).toLowerCase();
    if (isPayed == 'false') isPayed = false;
    else if (isPayed == 'true') isPayed = true;

    startDate = new Date(startDate);
    endDate = new Date(endDate);

    const options = {
        limit: parseInt(limit),
        skip: parseInt(skip),
    };

    try {
        let orders = Order.find(conditions).setOptions(options);
        orders.populate('payment');
        orderId
            ? orders
                  .populate('user.id', '-orders -payments -password')
                  .populate('subProduct', '-tokens -selledTokens')
                  .populate('product', '-types')
            : null;

        orders.select('-pendingGiftcards');
        orders = await orders;

        let filter = (order) => {
            let valid = true;

            startDate != 'Invalid Date'
                ? (valid = order.time >= startDate)
                : null;
            endDate != 'Invalid Date'
                ? (valid = order.time < endDate && valid)
                : null;

            if (order.payment && isPayed != '' && isPayed != 'undefined') {
                valid = valid && order.payment.isPayed == isPayed;
            }

            return valid;
        };

        orders = orders.filter(filter);
        return res.send(orders.reverse());
    } catch (error) {
        return res.send({});
    }
});

router.get('/user/:id', adminAuth, validateId, async (req, res) => {
    const result = await Order.find({
        'user.id': req.params.id,
        // isPayed: true,
    }).setOptions({
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
    });
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
    orders = orders.filter((order) => {
        return order.isPayed && order.time >= startDate && order.time < endDate;
    });

    return res.send(orders);
});

router.delete('/:id', adminAuth, async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order)
        return res.status(400).send({ error: { message: 'سفارش پیدا نشد' } });
    await order.remove();
    res.send(order);
});

// TODO complete: return error, or if success order
router.post('/reject/:id', adminAuth, async (req, res) => {
    const result = await this.rejectOrder(req.params.id);

    return res.send({ status: 1 });
});

function validateOder(order) {
    return joi.validate(order, {
        subProduct: joi.string().length(24).required(),
        count: joi.number().max(100).required(),
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
