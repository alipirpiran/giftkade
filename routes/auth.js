const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const joi = require('joi');
const _ = require('lodash');
const router = require('express').Router();
const User = require('../models/user');
const mobileService = require('../services/mobileService');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    max: 3,
    windowMs: 2 * 60 * 1000, // 1 minute
    message: {
        error: {
            message: 'تعداد درخواست ها بیش از حد مجاز است',
        },
    },
});

router.post('/login', limiter, async (req, res) => {
    const info = req.body;

    const { error } = validateLogin(info);
    if (error)
        return res
            .status(400)
            .send({ error: { message: 'ورودی هارا کنترل کنید.', dev: error } });

    //* send code to user
    const result = await mobileService.sendAuthCode(info.phoneNumber);

    if (result.error)
        return res.status(401).send({ error: { message: result.message } });
    else if (result.tryLater)
        return res.status(201).send({ error: { message: result.message } });
    return res.status(200).send({ status: 1 });
});

router.post('/validate', async (req, res) => {
    const { error } = validateLoginResponse(req.body);
    if (error)
        return res
            .status(400)
            .send({ error: { message: 'ورودی هارا کنترل کنید.', dev: error } });

    const { phoneNumber, code } = req.body;
    const result = await mobileService.validateAuthCode(phoneNumber, code);

    if (result.error)
        return res.status(400).send({ error: { message: result.message } });

    if (result.validated) {
        let user = await User.findOne({ phoneNumber });
        if (!user) {
            user = new User({
                phoneNumber,
                isPhoneNumberValidated: true,
            });
            await user.save();
        } else if (!user.isPhoneNumberValidated) {
            user.isPhoneNumberValidated = true;
            await user.save();
        }

        const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
        res.header('auth-token', token).send(
            _.omit(user.toObject(), ['password', 'orders', 'payments'])
        );
    } else {
        return res
            .status(400)
            .send({ error: { message: 'کد ارسالی اشتباه است' } });
    }
});

router.post('/loginWithPass', async (req, res) => {
    const { error } = validateLoginWithPass(req.body);
    if (error)
        return res
            .status(400)
            .send({ error: { message: 'ورودی هارا کنترل کنید' } });

    const { phoneNumber, password } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user || !user.password)
        return res
            .status(400)
            .send({ error: { message: 'موبایل یا رمزعبور اشتباه است' } });

    const result = await bcrypt.compare(password, user.password);

    if (result) {
        const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
        res.header('auth-token', token).send(
            _.omit(user.toObject(), ['password', 'orders', 'payments'])
        );
        return;
    } else {
        return res
            .status(400)
            .send({ error: { message: 'موبایل یا رمزعبور اشتباه است' } });
    }
});

function validateLogin(data) {
    return joi.validate(data, {
        phoneNumber: joi
            .string()
            .regex(/^[0-9]+$/)
            .required()
            .length(11),
        // password: joi.string().min(8).required()
    });
}

function validateLoginResponse(data) {
    return joi.validate(data, {
        phoneNumber: joi
            .string()
            .regex(/^[0-9]+$/)
            .required(),
        code: joi.string().length(5).required(),
    });
}

function validateLoginWithPass(data) {
    return joi.validate(data, {
        phoneNumber: joi
            .string()
            .length(11)
            .regex(/^[0-9]+$/)
            .required(),
        password: joi.string().required(),
    });
}

module.exports = router;
