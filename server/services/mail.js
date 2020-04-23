const nodemailder = require('nodemailer');
const debug = require('debug')('giftkade:mailService');
const ejs = require('ejs');

const service = process.env.MAIL_SERVICE;
const username = process.env.MAIL_USERNAME;
const password = process.env.MAIL_PASSWORD;

const BASE_URL = process.env.BASE_URL;

const transporter = nodemailder.createTransport({
    host: service,
    port: 587,
    secure: false,
    auth: {
        user: username,
        pass: password,
    },
});

module.exports.sendMail = (receiver, subject, html) => {
    var mailOptions = {
        from: `Giftkade <${username}>`,
        to: receiver,
        subject,
        html,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            debug(err);
        } else {
            // console.log('Email sent: ' + info.response);
        }
    });
};

module.exports.shopHTML = async (order, codes) => {
    var html = '';
    var product_id = order.product;
    for (const code of codes) {
        html +=
            (await giftcardHTML(
                order.title,
                order.description,
                code,
                product_id
            )) + '\n';
    }
    return _getHTML(html);
};

// TODO: design giftcard html
async function giftcardHTML(title, description, code, product_id) {
    const imageUrl = `${BASE_URL}/uploads/${product_id}`;

    return ejs.renderFile(__dirname + '/views/templates/giftcard.ejs', {
        imageUrl,
        code,
        title,
    });
}

function _getHTML(giftcardsElements) {
    return ejs.renderFile(__dirname + '/views/templates/shop.ejs', {
        giftcards: giftcardsElements,
    });
}
