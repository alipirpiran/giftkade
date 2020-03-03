const nodemailder = require('nodemailer');

const service = process.env.MAIL_SERVICE || 'gmail';
const username = process.env.MAIL_USERNAME;
const password = process.env.MAIL_PASSWORD;

// TODO: complete send mail: sourceMail: info@giftkade.com
const transporter = nodemailder.createTransport({
    service,
    auth: {
        user: username,
        pass: password,
    },
});

module.exports.sendMail = (receiver, subject, html) => {
    var mailOptions = {
        from: username,
        to: receiver,
        subject,
        html,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

module.exports.giftCardHTML = () => {};
