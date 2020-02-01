const router = require('express').Router();
const joi = require('joi')
const tokenService = require('../services/token')

const Token = require('../models/token')

// todo : add admin auth for all routes

router.post('/', async (req, res) => {
    const { error } = validateToken(req.body)
    if (error) return res.status(400).send({ error })

    const token = await tokenService.add_token(req.body.code, req.body.subProductId);
    if (token == null) return res.status(400).send({ error: { message: 'خطا در سرور هنگام اضافه کردن توکن' } })

    return res.status(200).send(token);
})

router.get('/:subProductId', async (req, res) => {
    const result = await Token.find({
        subProduct: req.params.subProductId,
    }).setOptions({
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip)
    })

    return res.status(200).send(result);
})

router.get('/', async (req, res) => {
    const result = await Token.find().setOptions({
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip)
    })

    return res.status(200).send(result)
})

function validateToken(item) {
    return joi.validate(item, {
        subProductId: joi.string().required().max(30),
        code: joi.string().required().max(100)
    })
}

module.exports = router;