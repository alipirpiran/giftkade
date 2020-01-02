const router = require('express').Router();
const joi = require('joi');

const Order = require('../models/order')
const User = require('../models/user')

router.post('/', async (req, res) => {
    const { error } = validateOrder(req.body);
    if (error) return res.status(400).send({ error });

    const order = new Order(req.body);
    await order.save();

    const user = await User.findById(order.user);
    user.orders.push(order._id);
    await user.save();

    return res.status(200).send({ _id: order._id });
});

router.post('/payed:id', async(req, res) => {
    const id = req.params.id;
    const order = await Order.findById(id);

    if(!order) return res.status(404).send({error: {message: 'order not found'}});

    order.payed = true;
    await order.save()
    return res.status(200).send({_id: id});
})

function validateOrder(order) {
    return joi.validate(order, {
        user: joi.string().max(120).required(),
        title: joi.string().max(250).required(),
        price: joi.number().max(99999).required(),
        localPrice: joi.number().max(9999999999).required(),
        totalPrice: joi.number().max(9999999999).required(),
        count: joi.number().max(100).required(),
        code: joi.array().min(1).max(100).items(joi.string().max(255)),
    })
}

module.exports = router;