const Kavenegar = require('kavenegar');
const message_api_key = process.env.MESSAGE_API_KEY;
const messageApi = Kavenegar.KavenegarApi({ apikey: message_api_key });

const User = require('../models/user');

const router = require('express').Router();

const joi = require('joi');

const verifyList = [];

router.post('/', async (req, res) => {
    // todo call api to send verification code to the phone number
    try {
        const _number = await validatePhoneNumber(req.body);
        const number = _number.phoneNumber;

        // send phone to api
        // return token for the requested user

        // messageApi.Send({ message: messageText(44675), sender: "1000596446", receptor: number },
        //     (response, status) => {
        //         res.status(200).send(response);
        //     });

        let index;
        const found = verifyList.find((value, i) => { value.phoneNumber == number; index = i; })
        if (found)
            verifyList.splice(index, 1);
        verifyList.push(new UserVerify(number, '12345'));

        // return res.status(200).send([{ "messageid": 1672065109, "message": "گیفت کده\nکد تایید عضویت شما :\n44675", "status": 1, "statustext": "در صف ارسال", "sender": "1000596446", "receptor": "09010417052", "date": 1577384269, "cost": 168 }])
        return res.status(200).send({})

    } catch (error) {
        return res.status(400).send(error)
    }


})

router.post('/validate', async (req, res) => {
    try {
        const response = await validateResponse(req.body);
        for (const index in verifyList) {
            const item = verifyList[index];
            if (item.phoneNumber == response.phoneNumber)
                if (item.code == response.code) {
                    // verified
                    verifyList.splice(index, 1);

                    await User.findOneAndUpdate({ phoneNumber: item.phoneNumber }, { isPhoneNumberValidated: true })
                    return res.status(200).send({ status: 1, message: 'verified' })
                }
        }

        return res.status(400).send({ error: { message: 'کد ارسالی اشتباه است' } })
    } catch (error) {
        return res.status(400).send({ error: { message: 'کد ارسالی دارای فرمت اشتباه است' } })
    }

})

function validatePhoneNumber(phone) {
    return joi.validate(phone, {
        phoneNumber: joi.string().length(11).alphanum().regex(/^[0-9]+$/).required()
    })
}

function validateResponse(code) {
    return joi.validate(code, {
        code: joi.string().length(5).required(),
        phoneNumber: joi.string().length(11).alphanum().regex(/^[0-9]+$/).required()
    })
}

function messageText(code) {
    return `گیفت کده
کد تایید عضویت شما :
${code}`
}

class UserVerify {
    constructor(phoneNumber, code) {
        this.phoneNumber = phoneNumber;
        this.code = code;
    }
}

module.exports = router;