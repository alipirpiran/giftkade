const fetch = require('node-fetch').default;
const BOT_PORT = process.env.BOT_PORT;

module.exports.newUserNotification = (id, mobile, date) => {
    var body = {
        id,
        mobile,
        date,
    };
    fetch(`http://localhost:${BOT_PORT}/newUser`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    }).catch(err => {});
};

module.exports.newOrder = (id, title, totalAmount, count) => {
    var body = {
        id,
        title,
        totalAmount,
        count,
    };

    fetch(`http://localhost:${BOT_PORT}/newOrder`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    }).catch(err =>{});
};
