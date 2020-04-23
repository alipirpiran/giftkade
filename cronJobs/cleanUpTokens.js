// const Payment = require('../server/models/payment');
require('dotenv').config();
const fetch = require('node-fetch').default;

const LOCAL_AUTH_TOKEN = process.env.LOCAL_AUTH_TOKEN;
const BASE_PORT = process.env.MAIN_SERVER_PORT;

// const rejectOrder = require('../server/routes/order').rejectOrder;
const expireTime = 20 * 60 * 1000;

const func = async function () {
    const now = Date.now();
    const payments = await getRemainingPayments();

    for (const payment of payments) {
        if (now - payment.timeCreated < expireTime) continue;

        await rejectOrder(payment.order);
    }
};

async function getRemainingPayments() {
    const payments = await (
        await fetch(
            `http://localhost:${BASE_PORT}/payments?isPayed=false&isRejected=false`,
            {
                headers: {
                    'auth-token': LOCAL_AUTH_TOKEN,
                },
            }
        )
    ).json();

    return payments;
}

// async function updatePayment(id, update) {
//     const res = await fetch(
//         `http://localhost:${BASE_PORT}/payments/update/${id}`,
//         {
//             headers: {
//                 'auth-token': LOCAL_AUTH_TOKEN,
//                 'content-type': 'application/json',
//             },
//             method: 'POST',
//             body: JSON.stringify(update),
//         }
//     );
//     return res.json();
// }
async function rejectOrder(orderId) {
    const res = await fetch(
        `http://localhost:${BASE_PORT}/order/reject/${orderId}`,
        {
            headers: {
                'auth-token': LOCAL_AUTH_TOKEN,
            },
            method: 'POST',
        }
    );
    return res.json();
}

module.exports = func;
