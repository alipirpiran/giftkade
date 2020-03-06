const nodemailder = require('nodemailer');
require('dotenv').config();
const fs = require('fs')

const service = process.env.MAIL_SERVICE;
const username = process.env.MAIL_USERNAME;
const password = process.env.MAIL_PASSWORD;

// TODO: complete send mail: sourceMail: info@giftkade.com
const transporter = nodemailder.createTransport({
    // service,
    host: service,
    port: 587,
    secure: false,
    auth: {
        user: username,
        pass: password,
    },
});

var htmlstream = fs.createReadStream("./email/beefree-6uo4hdht6dd.html");

module.exports.sendMail = (receiver, subject, html) => {
    var mailOptions = {
        from: `Giftkade <${username}>`,
        to: receiver,
        subject,
        html: htmlstream,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
            htmlstream.close()
        } else {
            console.log('Email sent: ' + info.response);
            htmlstream.close()
        }
    });
};

this.sendMail('Iirfansardivand@gmail.com, alipirpiran@gmail.com', 'گیفت کارت های خریداری شده', '👍🏼 بیا');

'Iirfansardivand@gmail.com,'