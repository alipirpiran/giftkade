const router = require('express').Router();
const ZarinpalCheckout = require('zarinpal-checkout');
const Payment = require('../models/payment');

const CALLBACK_URL = process.env.PAYMENT_CALLBACK_URL;
const SANDBOX = process.env.SANDBOX != 'false';
const zarinPalApiKey = process.env.ZARIN_KEY;

const zarinpal = ZarinpalCheckout.create(zarinPalApiKey, SANDBOX);

var rejectOrder, verifyOrder;
exports.set = (_verifyOrder, _rejectOrder) => {
    rejectOrder = _rejectOrder;
    verifyOrder = _verifyOrder;
};

module.exports.getDargahURLAfterCreatingOrder = async function ({
    user_id,
    order,
    amount,
    mobile,
    description,
    email,
}) {
    // creating payment: save: user, order, authority, totalAmount
    try {
        const response = await paymentReq(
            amount,
            CALLBACK_URL,
            description,
            mobile,
            email
        );
        if (response.status === 100) {
            const payment = new Payment({
                user: user_id,
                order: order._id,
                authority: response.authority,
                amount: String(amount),
                timeCreated: Date.now(),
            });
            await payment.save();

            return {
                url: response.url + '/ZarinGate',
                payment_id: payment._id,
            };
            return response.url + '/ZarinGate';
        } else
            throw {
                error: {
                    message: 'خطا در هنگام ایجاد درگاه پرداخت',
                    dev: response,
                },
            };
    } catch (error) {
        throw {
            error: { message: 'خطا در هنگام ایجاد درگاه پرداخت', dev: error },
        };
    }
};

// cal this function after creating order
function paymentReq(Amount, CallbackURL, Description, Mobile, Email) {
    return zarinpal.PaymentRequest({
        Amount,
        CallbackURL,
        Description,
        Email,
        Mobile,
    });
}

// handle callbacks
router.get('/', async (req, res) => {
    const { Status, Authority } = req.query;
    const payment = await Payment.findOne({ authority: Authority });

    if (!payment) return res.render('templates/fail');

    if (Status == 'OK') {
        zarinpal
            .PaymentVerification({
                Amount: payment.amount, // In Tomans
                Authority,
            })
            .then(async (response) => {
                if (response.status !== 100) {
                    // console.log(response);
                    rejectOrder(payment.order);

                    return res.status(400).render('templates/fail');
                } else {
                    payment.refId = response.RefID;
                    payment.isPayed = true;
                    await payment.save();

                    const order = await verifyOrder(
                        payment.user,
                        payment.order,
                        payment
                    );
                    //* send verify page with refid
                    res.status(200).render('templates/success', {
                        refId: response.RefID,
                        orderId: order.orderid,
                    });
                }
            })
            .catch((err) => {
                console.error(err);
                // res.send(err);
                return res.status(400).render('templates/fail');
            });
    } else {
        rejectOrder(payment.order);

        return res.status(400).render('templates/fail');
    }
});

module.exports.router = router;
