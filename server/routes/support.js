const router = require('express').Router();
const Errors = require('../templates/error');
const adminAuth = require('../auth/admin');
const joi = require('joi');

const Support = require('../models/support');
const Message = require('../models/message');

router.get('/info', async (req, res) => {
    const support = await Support.getSupport();
    return res.send(support);
});

router.put('/info', adminAuth, async (req, res, next) => {
    const { error } = validateUpdateInfo(req.body);
    if (error) return next(Errors.controllInputs());

    let support = await Support.getSupport();
    support =  support.set(req.body);
    await support.save()
    return res.send(support);
});

// TODO limit
router.post('/message', async (req, res, next) => {
    const { error } = validateMessage(req.body);
    if (error) return next(Errors.controllInputs());

    const message = new Message({
        message: req.body.message,
        date: Date.now(),
        senderEmail: req.body.email,
        senderPhoneNumber: req.body.phoneNumber,
    });
    await message.save();
    return res.send(message);
});

router.get('/message', adminAuth, async (req, res, next) => {
    const messages = await Message.find();
    return res.send(messages);
});

function validateUpdateInfo(info) {
    return joi.validate(info, {
        email: joi.string().email().max(100),
        phoneNumber: joi
            .string()
            .regex(/^[0-9]+$/)
            .length(11),
        terms: joi.string(),
    });
}

function validateMessage(val) {
    return joi.validate(val, {
        message: joi.string().max(1000).required(),
        email: joi.string().email().required(),
        phoneNumber: joi
            .string()
            .regex(/^[0-9]+$/)
            .length(11)
            .required(),
    });
}

module.exports = router;
