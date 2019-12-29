const bcrypt = require('bcryptjs')
const joi = require('joi')
const jwt = require('jsonwebtoken')
const _ = require('lodash');
const router = require('express').Router();

const User = require('../models/user')

router.post('/login', async (req, res) => {
    const info = req.body;

    const { error } = validateLogin(info);
    if (error) return res.status(400).send({ error: { message: 'ورودی هارا کنترل کنید.' } })

    const user = await User.findOne({ email: info.email })
    if (!user) return res.status(400).send({ error: { message: 'ایمیل یا رمز عبور اشتباه است.' } })
    console.log(user);

    const isValidPass = await bcrypt.compare(info.password, user.password);
    if (!isValidPass) return res.status(400).send({ error: { message: 'ایمیل یا رمز عبور اشتباه است.' } });


    // create and assign a token
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
    res.header('auth-token', token).send(_.omit(user.toObject(), ['password']));
});

function validateLogin(data) {
    return joi.validate(data, {
        email: joi.string().email().required(),
        password: joi.string().min(8).required()
    })
}

module.exports = router;