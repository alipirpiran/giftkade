const Kavenegar = require('kavenegar');
const message_api_key = process.env.MESSAGE_SERVICE_API_KEY;
const messageApi = Kavenegar.KavenegarApi({ apikey: message_api_key });

const { redisClient } = require('../app');

const CODE_TYPES = Object.freeze({
    SIGNUP: 'signup',
    AUTH: 'auth',
    RESET_PASSWORD: 'resetpassword',
});

// limits for 50 sec
exports.sendSignupCode = async phoneNumber => {
    var result = {
        error: false,
        message: '',
    };

    return new Promise(async (resolve, reject) => {
        const obj = await getObject(phoneNumber, 'signup');
        if (obj != null) {
            let difSecs = Math.floor((Date.now() - obj.time) / 1000);
            if (difSecs < 50) {
                result.error = true;
                result.message = `پس از ${60 -
                    difSecs} ثانیه دوباره درخواست دهید.`;
                return resolve(result);
            }
        }

        // rand num : 5 digit
        const randNum = Math.floor(Math.random() * 90000) + 10000;

        redisClient.hmset(
            `${phoneNumber}:signup`,
            'time',
            Date.now(),
            'code',
            randNum,
            (err, ok) => {
                if (err) {
                    result.error = true;
                    result.message = 'خطایی پیش آمد. لطفا دوباره تلاش کنید';
                    return resolve(result);
                }
                messageApi.VerifyLookup(
                    {
                        template: 'verify',
                        receptor: phoneNumber,
                        token: randNum,
                        type: 'sms',
                    },
                    () => {
                        return resolve(result);
                    }
                );
            }
        );
    });
};

exports.validateSignupCode = async (phoneNumber, code) => {
    var result = {
        error: false,
        message: '',
        validated: false,
    };
    const obj = await getObject(phoneNumber, CODE_TYPES.SIGNUP);
    if (obj == null) {
        result.error = true;
        result.message = 'شماره شما ثبت نشده است. لطفا ابتدا ثبت نام کنید.';
        return result;
    }

    if (obj.code == code) {
        result.validated = true;
        redisClient.del(`${phoneNumber}:${CODE_TYPES.SIGNUP}`);
        return result;
    } else return result;
};

exports.sendAuthCode = async phoneNumber => {
    var result = {
        error: false,
        tryLater: false,
        message: '',
    };

    return new Promise(async (resolve, reject) => {
        const obj = await getObject(phoneNumber, CODE_TYPES.AUTH);
        if (obj != null) {
            let difSecs = Math.floor((Date.now() - obj.time) / 1000);
            if (difSecs < 50) {
                result.tryLater = true;
                result.message = `پس از ${60 -
                    difSecs} ثانیه دوباره درخواست دهید.`;
                return resolve(result);
            }
        }

        // rand num : 5 digit
        const randNum = Math.floor(Math.random() * 90000) + 10000;

        redisClient.hmset(
            `${phoneNumber}:${CODE_TYPES.AUTH}`,
            'time',
            Date.now(),
            'code',
            randNum,
            (err, ok) => {
                if (err) {
                    result.error = true;
                    result.message = 'خطایی پیش آمد. لطفا دوباره تلاش کنید';
                    return resolve(result);
                }
                messageApi.VerifyLookup(
                    {
                        template: 'auth',
                        receptor: phoneNumber,
                        token: randNum,
                        type: 'sms',
                    },
                    () => {
                        return resolve(result);
                    }
                );
            }
        );
    });
};

exports.validateAuthCode = async (phoneNumber, code) => {
    var result = {
        error: false,
        message: '',
        validated: false,
    };
    const obj = await getObject(phoneNumber, CODE_TYPES.AUTH);
    if (obj == null) {
        result.error = true;
        result.message =
            'شماره شما ثبت نشده است. لطفا ابتدا درخواست ورود ارسال کنید.';
        return result;
    }

    if (obj.code == code) {
        result.validated = true;
        redisClient.del(`${phoneNumber}:${CODE_TYPES.AUTH}`);
        return result;
    } else return result;
};

exports.sendResetPassCode = async phoneNumber => {
    var result = {
        error: false,
        message: '',
    };

    return new Promise(async (resolve, reject) => {
        const obj = await getObject(phoneNumber, CODE_TYPES.RESET_PASSWORD);
        if (obj != null) {
            let difSecs = Math.floor((Date.now() - obj.time) / 1000);
            if (difSecs < 50) {
                result.error = true;
                result.message = `پس از ${60 -
                    difSecs} ثانیه دوباره درخواست دهید.`;
                return resolve(result);
            }
        }

        // rand num : 5 digit
        const randNum = Math.floor(Math.random() * 90000) + 10000;

        redisClient.hmset(
            `${phoneNumber}:${CODE_TYPES.RESET_PASSWORD}`,
            'time',
            Date.now(),
            'code',
            randNum,
            (err, ok) => {
                if (err) {
                    result.error = true;
                    result.message = 'خطایی پیش آمد. لطفا دوباره تلاش کنید';
                    return resolve(result);
                }
                messageApi.VerifyLookup(
                    {
                        template: 'resetpass',
                        receptor: phoneNumber,
                        token: randNum,
                        type: 'sms',
                    },
                    () => {
                        return resolve(result);
                    }
                );
            }
        );
    });
};

exports.validateResetCode = async (phoneNumber, code) => {
    var result = {
        error: false,
        message: '',
        validated: false,
    };
    const obj = await getObject(phoneNumber, CODE_TYPES.RESET_PASSWORD);
    if (obj == null) {
        result.error = true;
        result.message =
            'شماره شما ثبت نشده است. لطفا ابتدا درخواست بازنشانی رمزعبور را ارسال کنید.';
        return result;
    }

    if (obj.code == code) {
        result.validated = true;
        redisClient.del(`${phoneNumber}:${CODE_TYPES.RESET_PASSWORD}`);
        return result;
    }
    return result;
};

function getObject(phoneNumber, type) {
    return new Promise((res, rej) => {
        redisClient.hgetall(`${phoneNumber}:${type}`, (err, obj) => {
            if (err) return rej();
            return res(obj);
        });
    });
}

exports.sendMessage = async (phoneNumber, text) => {
    messageApi.Send(
        { message: text, sender: '100065995', receptor: phoneNumber },
    );
};
