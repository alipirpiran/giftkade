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