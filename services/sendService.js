const Token = require('../models/token');

const mailService = require('./mail');
const giftcardService = require('./giftcardService');
const mobileService = require('./mobileService');

async function sendGiftcards({ order, user }) {
    const codes = [];
    for (const item of order.finalGiftcards) {
        const giftcard = await Token.findById(item);
        const code = giftcardService.decryptToken(giftcard.code);
        codes.push(code);
    }

    if (order.targetType == 'email') {
        let email = order.target ? order.target : user.email;
        let html = await mailService.giftCardHTML(order, codes);
        mailService.sendMail(email, 'گیفت کارت های خریداری شده', html);
    } else if (order.targetType == 'sms') {
        let mobile = order.target ? order.target : user.phoneNumber;
        let text = `* گیفت کده *\nخرید شما با موفقیت انجام شد\n\n`;
        text += `محصول: ${order.producTtitle} ${order.title}\n`;
        let index = 1;
        for (const code of codes) {
            text += `${index} - کد گیفت کارت: \n${code}\n`;
        }
        text += '\nبا تشکر از خرید شما';
        mobileService.sendMessage(mobile, text);
    }
}

module.exports = {
    sendGiftcards,
};
