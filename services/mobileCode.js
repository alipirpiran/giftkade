const Kavenegar = require('kavenegar');
const message_api_key = process.env.MESSAGE_SERVICE_API_KEY;
const messageApi = Kavenegar.KavenegarApi({ apikey: message_api_key });

const { redisClient } = require('../app')

const CODE_TYPES = Object.freeze({
    SIGNUP: 'signup',

})

// limits for 50 sec
exports.sendSignupCode = async (phoneNumber) => {
    var result = {
        error: false,
        message: ''
    }

    return new Promise(async (resolve, reject) => {
        const obj = await getObject(phoneNumber, 'signup');
        if (obj != null) {
            let difSecs = Math.floor(((Date.now() - obj.time) / 1000));
            if (difSecs < 50) {
                result.error = true;
                result.message = `پس از ${60 - difSecs} ثانیه دوباره درخواست دهید.`
                return resolve(result);
            }
        }

        // rand num : 5 digit
        const randNum = Math.floor(Math.random() * 90000) + 10000;

        redisClient.hmset(`${phoneNumber}:signup`, 'time', Date.now(), 'code', randNum, (err, ok) => {
            if (err) {
                result.error = true;
                result.message = 'خطایی پیش آمد. لطفا دوباره تلاش کنید'
                return resolve(result);
            }
            messageApi.VerifyLookup({
                template: 'verify',
                receptor: phoneNumber,
                token: randNum,
                type: 'sms'
            }, () => {
                return resolve(result)
            })

        })
    })
}

exports.validateSignupCode = async (phoneNumber, code) => {
    var result = {
        error: false,
        message: '',
        validated: false,
    }
    const obj = await getObject(phoneNumber, CODE_TYPES.SIGNUP);
    if (obj == null) {
        result.error = true;
        result.message = 'شماره شما ثبت نشده است. لطفا ابتده ثبت نام کنید.';
        return result;
    }

    if (obj.code == code) {
        result.validated = true;
        redisClient.del(`${phoneNumber}:${CODE_TYPES.SIGNUP}`);
        return result;
    } else return result;

}

function getObject(phoneNumber, type) {
    return new Promise((res, rej) => {
        redisClient.hgetall(`${phoneNumber}:${type}`, (err, obj) => {
            if (err) return rej();
            return res(obj);
        })
    })
}



