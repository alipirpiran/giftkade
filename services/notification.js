const fetch = require('node-fetch').default;
const BOT_PORT = process.env.BOT_PORT;

module.exports.newUserNotification = (id, mobile, date) => {
    fetch(`localhost:${BOT_PORT}/newUser`, {
        body: {
            id,
            mobile,
            date,
        },
    });
};

module.exports.newOrder = (id, title, totalAmount, count) => {
    fetch(`localhost:${BOT_PORT}/newOrder`, {
        body: {
            id,
            title,
            totalAmount,
            count,
        },
    });
};
