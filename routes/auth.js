const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const joi = require('joi')
const _ = require('lodash');
const router = require('express').Router();

const User = require('../models/user')

router.post('/login', async (req, res) => {
    const info = req.body;

    const { error } = validateLogin(info);
    if (error) return res.status(400).send({ error: { message: 'ورودی هارا کنترل کنید.' , dev: error} })

    const user = await User.findOne({ phoneNumber: info.phoneNumber })
    if (!user) return res.status(400).send({ error: { message: 'موبایل یا رمز عبور اشتباه است.' } })
    if (!user.isPhoneNumberValidated) return res.status(400).send({ error: { message: 'موبایل یا رمز عبور اشتباه است.' } })

    const isValidPass = await bcrypt.compare(info.password, user.password);
    if (!isValidPass) return res.status(400).send({ error: { message: 'موبایل یا رمز عبور اشتباه است.' } });

    // create and assign a token
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
    res.header('auth-token', token).send(_.omit(user.toObject(), ['password', 'orders', 'payments']));
});

function validateLogin(data) {
    return joi.validate(data, {
        phoneNumber: joi.string().regex(/^[0-9]+$/).required(),
        password: joi.string().min(8).required()
    })
}

module.exports = router;