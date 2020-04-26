const fs = require('fs')
const mailService = require('../../services/mail');
const order = require('../data/order');
const codes = ['asdfasdf'];
const payment = require('../data/payment');

async function main() {
    const result = await mailService.shopHTML(order, codes, payment);
    // console.log(result);
    fs.writeFileSync('./output.html', result);
}

main()
