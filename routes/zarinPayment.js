const router = require('express').Router();

const zarinPalApiKey = process.env.ZARIN_KEY;

const ZarinpalCheckout = require('zarinpal-checkout');
const zarinpal = ZarinpalCheckout.create(zarinPalApiKey, true);


const Payment = require('../models/payment')
const User = require('../models/user')
const Transaction = require('../models/transaction')
const Order = require('../models/order')

const { verifyOrder } = require('./order')


module.exports.getDargahURLAfterCreatingOrder = async function (_user, order, amount, callback, mobile, description, email) {
    try {
        // get user
        const user = await User.findById(_user._id);
        if (!user) throw { error: { message: 'کاربر یافت نشد' } };

        // creating payment, its temp, just to keep authority and order, in calback get order with its details and remove it
        try {
            const response = await paymentReq(amount, callback, description, mobile, email);
            if (response.status === 100) {
                console.log(response);

                const payment = new Payment({
                    user: user._id,
                    order: order._id,
                    token: response.authority,
                    amount
                })
                await payment.save();

                // add payment to user payments
                if (!user.payments) user.payments = []
                user.payments.push(payment._id);
                await user.save();


                // return response.url;
            }

        } catch (error) {
            throw { error: { message: 'خطا در هنگام ایجاد درگاه پرداخت', dev: error } }

        }
    } catch (error) {
        console.log(error);

        throw { error: { message: 'خطا در هنگام ایجاد درگاه پرداخت', dev: error } }
    }

}

// cal this function after creating order
function paymentReq(Amount, CallbackURL, Description, Mobile, Email) {
    return zarinpal.PaymentRequest({
        Amount,
        CallbackURL,
        Description,
        Email,
        Mobile
    })
}


// handle callbacks
router.get('/', async (req, res) => {
    const { Status, Authority } = req.params;

    if (Status == 'OK') {
        const payment = await Payment.findOne({ authority: Authority });
        zarinpal.PaymentVerification({
            Amount: payment.amout, // In Tomans
            Authority,
        }).then(response => {
            if (response.status !== 100) {
                res.send('متاسفانه خطایی پیش آمد')
            } else {
                console.log(`Verified! Ref ID: ${response.RefID}`);
                console.log(response);
                res.send('درست بود')
                verifyTrans(response.RefID);

            }
        }).catch(err => {
            console.error(err);
            res.send(err)
        });
    }


    // // confirm payment
    // if (status == 'OK') {
    //     verifyTrans(api, token);
    // }
})


// calls from callback
function verifyTrans(refId) {

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