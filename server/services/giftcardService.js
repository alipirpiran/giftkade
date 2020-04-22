const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.CRYPTR_SECRET);
const _ = require('lodash');

const Token = require('../models/token');
const SubProduct = require('../models/productSubType');

exports.add_token = async (token_string, subProduct_id) => {
    const encrypted_token = cryptr.encrypt(token_string);

    const subProduct = await SubProduct.findById(subProduct_id).populate(
        'product',
        '-types'
    );
    if (!subProduct) return null;

    const token = new Token({
        code: encrypted_token,
        subProduct: subProduct_id,
        info: {
            subProduct: _.omit(subProduct.toJSON(), ['tokens', 'selledTokens', 'product']),
            product: subProduct.product,
        },
    });
    await token.save();

    subProduct.tokens.push(token._id);
    await subProduct.save();

    return token;
};

exports.decryptToken = (token_string) => {
    return cryptr.decrypt(token_string);
};

exports.getGiftcardAndSetToPending = async (subProduct, count, orderId) => {
    // const subProduct = await SubProduct.findById(subProduct_id)
    if (!subProduct) return null;
    var tokens = [];
    var i = 0;
    for (const item of subProduct.tokens) {
        const token = await Token.findById(item);

        if (!token.isSelled && !token.isPending) {
            tokens.push(token);
            i++;

            token.isPending = true;
            token.order = orderId;
            token.pendingStartDate = Date.now();
            await token.save();
        }
        if (i == count) break;
    }

    return tokens;
};

exports.setPendingGiftcardsToSelled = async ({
    subProduct_id,
    giftcards,
    orderId,
    userId,
}) => {
    const subProduct = await SubProduct.findById(subProduct_id);
    if (!subProduct) return null;

    for (const giftcardId of giftcards) {
        const giftcard = await Token.findById(giftcardId);
        var index = subProduct.tokens.indexOf(giftcardId);

        subProduct.tokens.splice(index, 1);
        subProduct.selledTokens.push(giftcard);

        giftcard.isSelled = true;
        giftcard.selledDate = Date.now();
        giftcard.order = orderId;
        giftcard.user = userId;
        await giftcard.save();
    }

    await subProduct.save();
};

exports.setGiftcardsFree = async (subProduct_id, giftcards) => {
    const subProduct = await SubProduct.findById(subProduct_id);
    if (!subProduct) return null;

    var setted = 0;
    for (var i = 0; i < subProduct.tokens.length; i++) {
        const item = subProduct.tokens[i];
        if (giftcards.includes(item)) {
            const token = await Token.findById(item);
            token.isSelled = false;
            token.isPending = false;
            await token.save();

            setted++;
        }
        if (setted == giftcards.length) break;
    }
};

// return tokens that are Not: selled, pending
exports.getFreeTokensCount = async (subProduct) => {
    // const subProduct = await SubProduct.findById(subProduct_id)
    if (!subProduct) return null;

    let count = 0;

    for (const item of subProduct.tokens) {
        const token = await Token.findById(item);
        if (!token.isSelled && !token.isPending) count++;
    }

    return count;
};
