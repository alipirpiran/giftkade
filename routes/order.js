const router = require('express').Router();
const joi = require('joi');

const SubProduct = require('../models/productSubType');

const Order = require('../models/order')
const User = require('../models/user')

const userAuth = require('../auth/user')

const giftcardService = require('../services/token')

// const { getDargahURLAfterCreatingOrder } = require('./payment')
const { getDargahURLAfterCreatingOrder } = require('./zarinPayment')

const BASE_URL = process.env.PAYMENT_CALLBACK_URL;

// TODO: add function after verifing order, add codes to order
module.exports.verifyOrder = async (userId, orderId, payment) => {
    const order = await Order.findById(orderId);

    // complete order details, ispayed: true, add giftcards to final, add paymentid
    order.isPayed = true;
    order.payment = payment._id;
    // add pending gift card token to order final giftcards
    for (const item of order.pendingGiftcards)
        order.finalGiftcards.push(item);
    await order.save();

    // add order to user orders
    const user = await User.findById(userId)
    if (!user.orders) user.orders = []
    user.orders.push(order._id)
    await user.save()

    // call giftcard service selled func: set tokens to selled, remove tokens from availible token for subproducts
    await giftcardService.setPendingGiftcardsToSelled(order.subProduct, order.finalGiftcards)
}

// TODO add function for rejected orders, delete order, delete order from user
module.exports.rejectOrder = async (orderId) => {
    console.log("Order rejected: " + orderId);

    const order = await Order.findById(orderId);
    giftcardService.setGiftcardsFree(order.subProduct, order.pendingGiftcards);

    order.isRejected = true;
    await order.save()
}

//* call when user want to buy product, return Dargah url
router.post('/', userAuth, async (req, res) => {
    const user_id = req.user;
    // router.post('/', async (req, res) => {
    // const user_id = req.body.user;

    const { error } = validateOder(req.body);
    if (error) return res.status(400).send({ error: { message: 'سفارش ثبت شده دارای فرمت اشتباه است' } });

    const { count } = req.body;
    if (count <= 0) return res.status(400).send({ error: { message: 'حداقل تعداد خرید یک عدد میباشد.' } })

    const subProduct = await SubProduct.findById(req.body.subProduct);
    if (!subProduct) return res.status(400).send({ error: { message: 'محصول مورد نظر یافت نشد' } });

    const availibleGiftcards = await giftcardService.getFreeTokensCount(subProduct)
    if (count > availibleGiftcards) return res.status(400).send({ error: { message: 'تعداد گیفت کارت درخواستی بیشتر از موجودی است.', giftCardCount: availibleGiftcards } })

    const user = await User.findById(user_id)
    if (!user) return res.status(400).send({ error: { message: 'کاربر یافت نشد' } });

    const totalPrice = subProduct.localPrice * count

    if (totalPrice <= 0) return res.status(400).send({ error: { message: 'خطایی پیش آمد. مجموع قیمت ها باید بیشتر از صفر باشد.' } })


    const _order = new Order({
        user: user_id,
        subProduct: subProduct._id,
        product: subProduct.product,

        price: subProduct.price,
        localPrice: subProduct.localPrice,
        title: subProduct.title,
        description: subProduct.description,

        totalPrice,
        count,
    });
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
        if (!user.payments) user.payments = []
        user.payments.push(payment_id);
        await user.save();

        // add pending giftcard tokens to order Pending tokens
        const tokens = await giftcardService.getGiftcardAndSetToPending(subProduct, count)
        for (const token of tokens)
            order.pendingGiftcards.push(token._id);
        await order.save()

        return res.status(200).send({ url: url, order_id: order._id });
    } catch (error) {
        console.log(error);

        return res.status(400).send({ error: { message: 'خطا هنگام ایجاد درگاه بانکی', dev: error } });
    }
})

router.get('/one/:order_id', userAuth, async (req, res) => {
    const order_id = req.params.order_id;

    const order = await Order.findById(order_id);
    if (!order) return res.status(404).send({ error: { message: 'گزارش خرید مورد نظر یافت نشد!' } });

    return res.status(200).send(order);
})

// if user: user orders, admin: all orders
router.get('/all', userAuth, async (req, res) => {
    const result = await Order.find({
        user: req.user,
        isPayed: true
    }).setOptions({
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip)
    }).select('title price localPrice count totalPrice finalGiftcards subProduct product')
        .populate('finalGiftcards', '-isSelled -isPending')
        // .populate('subProduct', '-tokens -selledTokens')

    for (const order of result) {
        for (const giftcard of order.finalGiftcards) {
            giftcard.code = giftcardService.deCryptToken(giftcard.code)
        }
    }
    res.send(result)
})

function validateOder(order) {
    return joi.validate(order, {
        subProduct: joi.string().length(24).required(),
        count: joi.number().max(100).required(),
    })
}

module.exports.router = router;