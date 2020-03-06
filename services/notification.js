const fetch = require('node-fetch').default;
const BOT_PORT = process.env.BOT_PORT;

module.exports.newUserNotification = (id, mobile, date) => {
    fetch(`http://localhost:${BOT_PORT}/newUser`, {
        method: 'POST',
        body: {
            id,
            mobile,
            date,
        },
    });
};

module.exports.newOrder = (id, title, totalAmount, count) => {
    fetch(`http://localhost:${BOT_PORT}/newOrder`, {
        method: 'POST',
        body: {
            id,
            title,
            totalAmount,
            count,
        },
    });
};
