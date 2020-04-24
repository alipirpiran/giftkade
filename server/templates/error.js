const createError = require('http-errors');

function temple(message) {
    return { error: { message } };
}

exports.customMessage = (message) => {
    return createError.BadRequest(temple(message));
};
exports.forbidden = () => {
    return createError.Forbidden(temple('شما دسترسی ندارید'));
};
exports.userNotFound = () => {
    return createError.NotFound(temple('کاربر یافت نشد'));
};
exports.controllInputs = () => {
    return createError.BadRequest(temple('ورودی هارا کنترل کنید.'));
};
exports.sameUserExists = () => {
    return createError.BadRequest(temple('کاربری با مشخصات مشابه وجود دارد.'));
};
exports.deactivatedAccount = () => {
    return createError.BadRequest(temple('حساب شما غیرفعال شده است'));
};
exports.wrongLoginUserPass = () => {
    return createError.BadRequest(temple('موبایل یا رمزعبور اشتباه است'));
};
exports.wrongSMSCodeVerify = () => {
    return createError.BadRequest(temple('کد ارسالی اشتباه است'));
};
