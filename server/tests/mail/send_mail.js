const path = require('path');
require('dotenv').config({
  path: path.join(process.cwd(), '../../.env'),
});
const mail_service = require('../../services/mail');

const order = require('../data/order');
const codes = ['asdfasdf'];
const payment = require('../data/payment');

async function send_shop_HTML_mail() {
  const result = await mail_service.shopHTML(order, codes, payment);
  mail_service.sendMail('alipirpiran@gmail.com', 'test', result);
}

send_shop_HTML_mail()
