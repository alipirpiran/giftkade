const Kavenegar = require('kavenegar');
const message_api_key = process.env.MESSAGE_SERVICE_API_KEY;
const messageApi = Kavenegar.KavenegarApi({ apikey: message_api_key });

const mobileService = require('../services/mobileService')

const User = require('../models/user');

const router = require('express').Router();

const joi = require('joi');

const verifyList = [];

router.post('/', async (req, res) => {
    const { error } = validatePhoneNumber(req.body);
    if (error) return res.status(400).send({ error: { message: 'موبایل ارسالی دارای فرمت اشتباه است' } })

    const mobile = req.body.phoneNumber;

    const user = await User.findOne({ phoneNumber: mobile });
    if (!user) return res.status(400).send({ error: { message: 'شماره شما در سیستم وجود ندارد. ابتدا ثبت نام کنید.' } })
    if (user.isPhoneNumberValidated) return res.status(400).send({ error: { message: 'موبایل شما قبلا تایید شده است.' } })

    const result = await mobileService.sendSignupCode(mobile)
    if (result.error) return res.status(400).send({ error: { message: result.message } })

    // return res.status(200).send([{ "messageid": 1672065109, "message": "گیفت کده\nکد تایید عضویت شما :\n44675", "status": 1, "statustext": "در صف ارسال", "sender": "1000596446", "receptor": "09010417052", "date": 1577384269, "cost": 168 }])
    return res.status(200).send({})

})

router.post('/validate', async (req, res) => {
    const { error } = await validateResponse(req.body);
    if (error) return res.status(400).send({ error: { message: 'کد ارسالی دارای فرمت اشتباه است' } })

    const { phoneNumber, code } = req.body;
    const result = await mobileService.validateSignupCode(phoneNumber, code);

    if (result.validated) {
        await User.findOneAndUpdate({ phoneNumber: phoneNumber }, { isPhoneNumberValidated: true })
        return res.status(200).send({ status: 1, message: 'verified' })
    } else if (!result.validated && !result.error)
        return res.status(400).send({ status: 0, error: { message: 'کد ارسالی اشتباه است' } })

    if (result.error) return res.status(400).send({ error: { message: result.message } })
})

function validatePhoneNumber(phone) {
    return joi.validate(phone, {
        phoneNumber: joi.string().length(11).alphanum().regex(/^[0-9]+$/).required()
    })
}

function validateResponse(response) {
    return joi.validate(response, {
        code: joi.string().length(5).required(),
        phoneNumber: joi.string().length(11).alphanum().regex(/^[0-9]+$/).required()
    })
}


module.exports = router;