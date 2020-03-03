const router = require('express').Router();
const joi = require('joi');
const tokenService = require('../services/token');

const Token = require('../models/token');
const SubProduct = require('../models/productSubType');

const adminAuth = require('../auth/admin');

router.post('/', adminAuth, async (req, res) => {
    const { error } = validateToken(req.body);
    if (error) return res.status(400).send({ error });

    const token = await tokenService.add_token(
        req.body.code,
        req.body.subProductId
    );
    if (token == null)
        return res
            .status(400)
            .send({ error: { message: 'خطا در سرور هنگام اضافه کردن توکن' } });

    return res.status(200).send(token);
});

router.get('/subProduct/:id', adminAuth, async (req, res) => {
    const result = await Token.find({
        subProduct: req.params.id,
    }).setOptions({
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
    });

    return res.status(200).send(result);
});

router.get('/token/:id', adminAuth, async (req, res) => {
    const token = await Token.findById(req.params.id);
    if (!token)
        return res
            .status(404)
            .send({ error: { message: 'گیفت کارت یافت نشد' } });

    return res.status(200).send(token);
});

// get all
router.get('/token', adminAuth, async (req, res) => {
    const result = await Token.find().setOptions({
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
    });

    return res.status(200).send(result);
});

router.get('/available/:subProductId', adminAuth, async (req, res) => {
    const subProduct = await SubProduct.findById(req.params.subProductId);
    if (!subProduct)
        return res
            .status(404)
            .send({ error: { message: 'زیر محصول مورد نظر یافت نشد' } });

    const count = await tokenService.getFreeTokensCount(subProduct);
    return res.status(200).send({ count, subProduct: subProduct._id });
});

function validateToken(item) {
    return joi.validate(item, {
        subProductId: joi
            .string()
            .required()
            .max(30),
        code: joi
            .string()
            .required()
            .max(100),
    });
}

module.exports = router;
