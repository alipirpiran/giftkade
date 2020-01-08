const request = require('request')
const router = require('express').Router();

const ZarinpalCheckout = require('zarinpal-checkout');
const zarinpal = ZarinpalCheckout.create('0a8d6c6e-31a2-11ea-850e-000c295eb8fc', true);


const Payment = require('../models/payment')
const User = require('../models/user')
const Transaction = require('../models/transaction')
const Order = require('../models/order')

const { verifyOrder } = require('./order')

const PAYMENT_URL = 'https://pay.ir/pg'
const api = process.env.PAYMENT_API;

module.exports.getDargahURLAfterCreatingOrder = async function (_user, order, api, amount, redirect, mobile) {
    try {
        // send request for creating token for transaction
        const pgRes = await requestPG(api, amount, redirect, mobile);
        const { token, status } = pgRes.body;

        // check if there is error in creating token
        if (status != 1) {
            throw { error: { message: 'خطا در هنگام ایجاد درگاه پرداخت' } };
        }

        // get user
        const user = await User.findById(_user._id);
        if (!user) throw { error: { message: 'کاربر یافت نشد' } };

        // creating payment, its temp, just to keep token and order, in calback get order with its details and remove it
        const payment = new Payment({
            user: user._id,
            order: order._id,
            token,
        })
        await payment.save();

        // add payment to user payments
        if (!user.payments) user.payments = []
        user.payments.push(payment._id);
        await user.save();

        // return Dargah Pardakht URL
        return getDargahURL(token)
    } catch (error) {
        throw { error: { message: 'خطا در هنگام ایجاد درگاه پرداخت' } }
    }

}

// cal this function after creating order
function requestPG(api, amount, redirect, mobile) {
    return new Promise((resolve, reject) => {
        request.post(`${PAYMENT_URL}/send`, async (err, res, body) => {
            if (err) reject(err);

            resolve(res);
        })
            .json({
                api,
                amount,
                redirect,
                mobile
            });
    })

}

function getDargahURL(token) {
    return `${PAYMENT_URL}/${token}`;
}

// handle callbacks
router.get('/:status:token', (req, res) => {
    const { status, token } = req.params;

    // confirm payment
    if (status == 1) {
        verifyTrans(api, token);
    }
})


// calls from callback
function verifyTrans(api, token) {
    request.post(`${PAYMENT_URL}/verify`, async (err, res) => {
        if (err) return;
        if (res.statusCode == 200) {
            if (res.body.status == 1) {
                // check for fuplicate transid
                const foundTrans = await Transaction.findOne({ transId: req.body.transId })
                if (foundTrans) return;

                const transaction = new Transaction(req.body);
                await transaction.save()

                const payment = await Payment.findOne({ token });
                const { order, user } = payment.order;

                verifyOrder(user, order, transaction);

                await payment.remove()
            }
        } else {
            if (res.statusCode == 422) {
                return;
            }
        }

    }).json({ api, token })
}

module.exports.router = router;