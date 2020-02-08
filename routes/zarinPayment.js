const router = require('express').Router();

const zarinPalApiKey = process.env.ZARIN_KEY;

const ZarinpalCheckout = require('zarinpal-checkout');
const zarinpal = ZarinpalCheckout.create(zarinPalApiKey, true);

const Payment = require('../models/payment')

var rejectOrder, verifyOrder;
exports.set = (_verifyOrder,_rejectOrder ) => {
    rejectOrder = _rejectOrder;
    verifyOrder = _verifyOrder;
}


module.exports.getDargahURLAfterCreatingOrder = async function (user_id, order, amount, callback, mobile, description, email) {
    try {
        // creating payment: save: user, order, payToken, totalAmount
        try {
            const response = await paymentReq(amount, callback, description, mobile, email);
            if (response.status === 100) {
                const payment = new Payment({
                    user: user_id,
                    order: order._id,
                    token: response.authority,
                    amount: String(amount)
                })
                console.log(user_id);
                
                await payment.save();

                return {
                    url: response.url + '/ZarinGate',
                    payment_id: payment._id
                }
                return response.url + '/ZarinGate';
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
    const { Status, Authority } = req.query;

    if (Status == 'OK') {
        const payment = await Payment.findOne({ token: Authority });
        if (!payment) return res.send('متاسفانه خطایی پیش آمد')

        zarinpal.PaymentVerification({
            Amount: payment.amount, // In Tomans
            Authority,
        }).then(async response => {
            if (response.status !== 100) {
                // console.log(response);
                rejectOrder(payment.order);
                return res.send('متاسفانه خطایی پیش آمد')

            } else {
                // res.send('درست بود')
                payment.refId = response.RefID;
                await payment.save()
                res.status(200).send(payment);
                return await verifyOrder(payment.user, payment.order, payment);
            }
        }).catch(err => {
            console.error(err);
            res.send(err)
        });
    } else {
        return res.send('پرداخت با خطا مواجه شد')
    }
})


module.exports.router = router;