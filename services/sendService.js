const Token = require('../models/token');

const mailService = require('./mail');
const giftcardService = require('./giftcardService');

async function sendGiftcards({ order, user }) {
    const codes = [];
    for (const item of order.finalGiftcards) {
        const giftcard = await Token.findById(item);
        const code = giftcardService.decryptToken(giftcard.code);
        codes.push(code);
    }

    if (order.targetType == 'email') {
        var email = order.target ? order.target : user.email;
        var html = await mailService.giftCardHTML(order, codes);
        mailService.sendMail(email, 'گیفت کارت های خریداری شده', html);
    } else if (order.targetType == 'sms') {
        var mobile = order.target ? order.target : user.phoneNumber;

        // TODO send to sms
    }
}

module.exports = {
    sendGiftcards,
};
