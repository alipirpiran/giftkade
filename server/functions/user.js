function addOrder(user, orderId) {
    if (!user.orders) user.orders = [];
    user.orders.push(orderId);
}

module.exports = {
    addOrder,
};
