const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const joi = require('joi')
const crypto = require('crypto')
const _ = require('lodash');
const router = require('express').Router();

const User = require('../models/user')
const Reset = require('../models/resetPass')

const router = require('express').Router();
const mobileService = require('../services/mobileCode')

const limitSecs = 10 * 60; // time reset password token is reliable

//TODO each user can change pass once a day
// if user exists send a code to user phoneNumber
router.post('/', async (req, res) => {
    const { error } = validateReset(req.body);
    if (error) return res.status(400).send({ error: { message: 'لطفا ورودی هارا کنترل کنید' } })
    const { phoneNumber } = req.body;

    const user = await User.findOne({ phoneNumber })
    if (!user) return res.status(400).send({ error: { message: 'شما ثبت نام نکرده اید' } })

    const result = await mobileService.sendResetPassCode(phoneNumber);
    if (result.error) return res.status(400).send({ error: { message: result.message } })
    return res.status(200).send({ status: 1 })
})

router.post('/validate', async (req, res) => {
    const { error } = validateResetResponse(req.body)
    if (error) return res.status(400).send({ error: { message: 'لطفا ورودی هارا کنترل کنید', dev: error } })

    const { phoneNumber, code } = req.body;
    const result = await mobileService.validateResetCode(phoneNumber, code)
    if (result.error) return res.status(400).send({ error: { message: error } })

    if (!result.validated) return res.status(400).send({ error: { message: 'کد ارسالی اشتباه است' } })

    const user = await User.findOne({ phoneNumber })
    if (!user) return res.status(400).send({ error: { message: 'کاربری با این شماره موبایل یافت نشد' } })

    const token = randomString(128);
    // Hash token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const reset = new Reset({
        token: hashedToken,
        date: Date.now(),
        user: user._id

    })
    await reset.save()

    return res.send({ status: 1, token })
})

router.post('/change/:token', async (req, res) => {
    const { error } = validateChange(req.body)
    if (error) return res.status(400).send({ error: { message: 'ورودی هارا کنترل کنید', dev: error } })

    const { newPassword } = req.body;
    const _token = req.params.token;
    const hashedToken = crypto.createHash('sha256').update(_token).digest('hex');

    const token = await Reset.findOne({ token: hashedToken })
    if (!token) return res.status(400).send({ error: { message: 'بازنشانی مورد نظر یافت نشد' } })

    if (token.isUsed) return res.status(400).send({ error: { message: 'رمزعبور تغیر کرده است' } })

    let difSecs = (Date.now() - token.date) / 1000;
    if (difSecs > limitSecs) return res.status(400).send({ error: { message: 'زمان اعتبار بازنشانی رمزعبور به اتمام رسیده است' } })

    const user = await User.findById(token.user)
    if (!user) return res.status(400).send({ error: { message: 'کاربری با این شماره موبایل یافت نشد' } })

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save()

    token.isUsed = true;
    await token.save()

    return res.status(200).send({ status: 1, message: 'رمزعبور با موفقیت تغییر کرد' })

})

function validateReset(data) {
    return joi.validate(data, {
        phoneNumber: joi.string().regex(/^[0-9]+$/).required(),

    })
}
function validateResetResponse(data) {
    return joi.validate(data, {
        phoneNumber: joi.string().regex(/^[0-9]+$/).required(),
        code: joi.string().min(8).required()
    })
}

function validateChange(data) {
    return joi.validate(data, {
        newPassword: joi.string().min(8).required()
    })
}

function randomString(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = router;