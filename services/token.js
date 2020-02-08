const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.CRYPTR_SECRET);

const Token = require('../models/token');
const SubProduct = require('../models/productSubType')

exports.add_token = async (token_string, subProduct_id) => {
    const encrypted_token = cryptr.encrypt(token_string);

    const subProduct = await SubProduct.findById(subProduct_id)
    if (!subProduct) return null;

    const token = new Token({
        code: encrypted_token,
        subProduct: subProduct_id,
    })
    await token.save();

    subProduct.tokens.push(token._id);
    await subProduct.save()

    return token;

}
// * get token and add token to selled tokens
exports.get_token = async (subProduct_id) => {
    const subProduct = await SubProduct.findById(subProduct_id)
    if (!subProduct) return null;

    var token = null;
    var i = 0;
    for (const item of subProduct.tokens) {
        var temp_token = await Token.findById(item);

        if (!temp_token.isSelled) {
            token = temp_token;

            // remove token from not selled tokens
            subProduct.tokens.splice(i, 1);

            // add token to selled tokens
            subProduct.selledTokens.push(token);

            // mark token as selled and save token
            temp_token.isSelled = true;

            await temp_token.save()
            await subProduct.save()
            break;
        }
        i++;
    }

    return token;
}

exports.getGiftcardAndSetToPending = async (subProduct, count) => {
    // const subProduct = await SubProduct.findById(subProduct_id)
    if (!subProduct) return null;
    var tokens = [];
    var i = 0;
    for (const item of subProduct.tokens) {
        const token = await Token.findById(item)

        if (!token.isSelled && !token.isPending) {
            tokens.push(token);
            i++;

            token.isPending = true;
            await token.save()
        }
        if (i == count) break;
    }

    return tokens;
}

exports.setPendingGiftcardsToSelled = async (subProduct_id, giftcards) => {
    const subProduct = await SubProduct.findById(subProduct_id)
    if (!subProduct) return null;

    for (const item of giftcards) {
        const token = await Token.findById(item);
        var index = subProduct.tokens.indexOf(item);
        
        subProduct.tokens.splice(index, 1)
        subProduct.selledTokens.push(token);

        token.isSelled = true;
        await token.save()
    }

    await subProduct.save()
}

exports.setGiftcardsFree = async (subProduct_id, giftcards) => {
    const subProduct = await SubProduct.findById(subProduct_id)
    if (!subProduct) return null;

    var setted = 0;
    for (var i = 0; i < subProduct.tokens.length; i++) {
        const item = subProduct.tokens[i]
        if (giftcards.includes(item)) {
            const token = await Token.findById(item);
            token.isSelled = false;
            token.isPending = false;
            await token.save()

            setted++;
        }
        if (setted == giftcards.length) break;
    }
}


// return tokens that are Not: selled, pending
exports.getFreeTokensCount = async (subProduct) => {
    // const subProduct = await SubProduct.findById(subProduct_id)
    if (!subProduct) return null;

    let count = 0;

    for (const item of subProduct.tokens) {
        const token = Token.findById(item);
        if (!token.isSelled && !token.isPending) count++;
    }

    return count;
}