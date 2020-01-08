const router = require('express').Router();
const joi = require('joi');

const SubProduct = require('../models/productSubType');

const Order = require('../models/order')
const User = require('../models/user')

const userAuth = require('../auth/user')

// const { getDargahURLAfterCreatingOrder } = require('./payment')
const { getDargahURLAfterCreatingOrder } = require('./zarinPayment')

const BASE_URL = process.env.PAYMENT_CALLBACK_URL;

// TODO: add function after verifing order, add codes to order
module.exports.verifyOrder = async (userId, orderId, transaction) => {
    const order = await Order.findById(orderId);

    order.payed = true;
    order.transaction = transaction._id;
    await order.save();

    const user = await User.findById(userId)
    if (!user.orders) user.orders = []
    user.orders.push(order._id)
    await user.save()
}

// TODO add function for rejected orders, delete order, delete order from user

// call when user want to buy product, return Dargah url
router.post('/', userAuth, async (req, res) => {
    console.log('here');
    
    const user_id = req.user;
    // router.post('/', async (req, res) => {
    // const user_id = req.body.user;

    const { error } = validateOder(req.body);
    if (error) return res.status(400).send({ error: { message: 'سفارش ثبت شده دارای فرمت اشتباه است' } });

    const { count } = req.body;

    const subProduct = await SubProduct.findById(req.body.subProduct);

    if (!subProduct) return res.status(400).send({ error: { message: 'محصول مورد نظر یافت نشد' } });

    const user = await User.findById(user_id)
    if (!user) return res.status(400).send({ error: { message: 'کاربر یافت نشد' } });

    const totalPrice = subProduct.localPrice * count

    console.log(totalPrice);
    
    const _order = new Order({
        user: user_id,

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
        const dargahURL = await getDargahURLAfterCreatingOrder(
            user,
            order,
            totalPrice,
            `${BASE_URL}/payment`,
            user.mobile,
            'خرید گیفت کارت'
        
        );

        return res.status(200).send({ url: dargahURL, order_id: order._id });
    } catch (error) {
        return res.status(400).send({ error: { message: 'خطا هنگام ایجاد درگاه بانکی' } });
    }
})

router.get('/:order_id', userAuth, async (req, res) => {
    const order_id = req.params.order_id;

    const order = await Order.findById(order_id);
    if (!order) return res.status(404).send({ error: { message: 'گزارش خرید مورد نظر یافت نشد!' } });

    return res.status(200).send(order);
})

function validateOder(order) {
    return joi.validate(order, {
        subProduct: joi.string().length(24).required(),
        count: joi.number().max(100).required(),
    })
}

module.exports.router = router;