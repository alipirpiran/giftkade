const Kavenegar = require('kavenegar');
const message_api_key = process.env.MESSAGE_SERVICE_API_KEY;
const messageApi = Kavenegar.KavenegarApi({ apikey: message_api_key });

const User = require('../models/user');

const router = require('express').Router();

const joi = require('joi');

const verifyList = [];

// todo limit this function for one every one minute for each user: Redis
router.post('/', async (req, res) => {
    // todo call api to send verification code to the phone number
    const { error } = await validatePhoneNumber(req.body);
    if (error) return res.status(400).send({ error: { message: 'موبایل ارسالی دارای فرمت اشتباه است' } })

    const mobile = req.body.phoneNumber;

    // rand num : 5 digit
    const randNum = Math.floor(Math.random() * 90000) + 10000;

    let index;
    const found = verifyList.find((value, i) => { value.phoneNumber == mobile; index = i; })
    if (found)
        verifyList.splice(index, 1);

    // send phone to api
    // messageApi.Send({ message: messageText(randNum), receptor: mobile },
    //     (response, status) => {
    //         // res.status(200).send(response);
    //     }
    // );
    messageApi.VerifyLookup({
        receptor: mobile,
        token: randNum,
        type: 'sms'
    })
    verifyList.push(new UserVerify(mobile, randNum));

    // return res.status(200).send([{ "messageid": 1672065109, "message": "گیفت کده\nکد تایید عضویت شما :\n44675", "status": 1, "statustext": "در صف ارسال", "sender": "1000596446", "receptor": "09010417052", "date": 1577384269, "cost": 168 }])
    return res.status(200).send({})

})

router.post('/validate', async (req, res) => {

    const { error } = await validateResponse(req.body);
    if (error) return res.status(400).send({ error: { message: 'کد ارسالی دارای فرمت اشتباه است' } })

    for (const index in verifyList) {
        const item = verifyList[index];
        if (item.phoneNumber == req.body.phoneNumber)
            if (item.code == req.body.code) {
                // verified
                verifyList.splice(index, 1);

                await User.findOneAndUpdate({ phoneNumber: item.phoneNumber }, { isPhoneNumberValidated: true })
                return res.status(200).send({ status: 1, message: 'verified' })
            } else break;
    }

    return res.status(400).send({ error: { message: 'کد ارسالی اشتباه است' } })
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