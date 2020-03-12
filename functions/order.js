function addFinalGiftcards(order) {
    for (const item of order.pendingGiftcards) {
        order.finalGiftcards.push(item);
    }
}

module.exports = {
    addFinalGiftcards
}