const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');

const Statistic = require('../models/statistic');

let statistic;

// set all counts by getting documents
module.exports.refresh = async () => {
    const User = require('../models/user');
    const Product = require('../models/product');
    const Order = require('../models/order');
    
    await setStatistic();
    const users = await User.find();
    statistic.userCount = users.length;

    const products = await Product.find();
    statistic.productCount = products.length;

    const orders = await Order.find();
    statistic.orderCount = orders.length;

    statistic.payedOrderCount = 0;
    orders.forEach((e) => (e.isPayed ? statistic.payedOrderCount++ : null));

    await statistic.save();
};

module.exports.getStatistic = async () => {
    return await setStatistic();
};

module.exports.addUser = async () => {
    await setStatistic();

    statistic.userCount++;
    await statistic.save();
};
module.exports.delUser = async () => {
    await setStatistic();

    statistic.userCount--;
    await statistic.save();
};

module.exports.addProduct = async () => {
    await setStatistic();

    statistic.productCount++;
    await statistic.save();
};
module.exports.delProduct = async () => {
    await setStatistic();

    statistic.productCount--;
    await statistic.save();
};

module.exports.addGiftcard = async () => {
    await setStatistic();

    statistic.giftcardCount++;
    await statistic.save();
};
module.exports.delGiftcard = async () => {
    await setStatistic();

    statistic.giftcardCount--;
    await statistic.save();
};

module.exports.addOrder = async () => {
    await setStatistic();

    statistic.orderCount++;
    await statistic.save();
};
module.exports.delOrder = async () => {
    await setStatistic();

    statistic.orderCount--;
    await statistic.save();
};

module.exports.addPayedOrder = async (order) => {
    await setStatistic();

    statistic.payedOrderCount++;
    await statistic.save();
};

async function setStatistic() {
    if (!statistic) {
        const statistics = await Statistic.find();
        if (statistics.length == 0) {
            statistic = new Statistic();
            await statistic.save();
        } else {
            statistic = statistics[0];
        }
    }
    return statistic;
}
