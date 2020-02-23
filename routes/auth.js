const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const joi = require('joi')
const _ = require('lodash');
const router = require('express').Router();

const User = require('../models/user')

const mobileService = require('../services/mobileService')

// TODO: add limit for users to call this api 3 time in our(by ip)
// login with phonenumber and send verfication code
router.post('/login', async (req, res) => {
    const info = req.body;

    const { error } = validateLogin(info);
    if (error) return res.status(400).send({ error: { message: 'ورودی هارا کنترل کنید.', dev: error } })

    // const user = await User.findOne({ phoneNumber: info.phoneNumber })

    // *if dont have user-> create one

    //* send code to user
    const result = await mobileService.sendAuthCode(info.phoneNumber)

    if (result.error) return res.status(401).send({ error: { message: result.message } })
    else if (result.tryLater) return res.status(201).send({ error: { message: result.message } })
    return res.status(200).send({ status: 1 })
    // if (!user) return res.status(400).send({ error: { message: 'موبایل یا رمز عبور اشتباه است.' } })
    // if (!user.isPhoneNumberValidated) return res.status(400).send({ error: { message: 'موبایل یا رمز عبور اشتباه است.' } })

    // const isValidPass = await bcrypt.compare(info.password, user.password);
    // if (!isValidPass) return res.status(400).send({ error: { message: 'موبایل یا رمز عبور اشتباه است.' } });

    // create and assign a token
    // const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
    // res.header('auth-token', token).send(_.omit(user.toObject(), ['password', 'orders', 'payments']));
});

router.post('/validate', async (req, res) => {
    const { error } = validateLoginResponse(req.body)
    if (error) return res.status(400).send({ error: { message: 'ورودی هارا کنترل کنید.', dev: error } })

    const { phoneNumber, code } = req.body
    const result = await mobileService.validateAuthCode(phoneNumber, code)

    if (result.error) return res.status(400).send({ error: { message: result.message } })

    if (result.validated) {
        let user = await User.findOne({ phoneNumber })
        if (!user) {
            user = new User({
                phoneNumber,
                isPhoneNumberValidated: true
            })
            await user.save()
        } else if (!user.isPhoneNumberValidated) {
            user.isPhoneNumberValidated = true;
            await user.save()
        }

        const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
        res.header('auth-token', token).send(_.omit(user.toObject(), ['password', 'orders', 'payments']));

    } else {
        return res.status(400).send({ error: { message: 'کد ارسالی اشتباه است' } })
    }
})

function validateLogin(data) {
    return joi.validate(data, {
        phoneNumber: joi.string().regex(/^[0-9]+$/).required(),
        // password: joi.string().min(8).required()
    })
}

function validateLoginResponse(data) {
    return joi.validate(data, {
        phoneNumber: joi.string().regex(/^[0-9]+$/).required(),
        code: joi.string().length(5).required()
    });
}

module.exports = router;