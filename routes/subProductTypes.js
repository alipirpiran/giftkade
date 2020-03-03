const joi = require('joi');
const router = require('express').Router();
const debug = require('debug')('giftShop:Route:SubProduct');

const adminAuth = require('../auth/admin');
const userAuth = require('../auth/user');

const SubProducts = require('../models/productSubType');
const Product = require('../models/product');

router.get('/', (req, res) => {
    res.send({ route: '/subProducts' });
});

// id : the product id
router.get('/all/:productId', async (req, res) => {
    const id = req.params.productId;
    try {
        // const subTypes = await Product.findById(id).populate('types', 'price title product localPrice').select('types')
        const subProducts = await SubProducts.find({
            product: id,
        }).select('price title product localPrice');
        return res.status(200).send({ types: subProducts });
    } catch (error) {
        return res.status(404).send({ error: 'product not found' });
    }
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const subType = await SubProducts.findById(id);
        return res.status(200).send(subType);
    } catch (error) {}
});

router.post('/:id', adminAuth, async (req, res) => {
    const productId = req.params.id;

    const { error } = validateProductSubType(req.body);
    if (error) return res.status(400).send({ error });

    const _subType = req.body;
    _subType.product = productId;

    const productSubType = new SubProducts(_subType);
    const subType = await productSubType.save();

    const product = await Product.findById(productId);
    product.types.push(subType);
    await product.save();

    return res.status(200).send(subType);
});

router.delete('/:id', adminAuth, async (req, res) => {
    const id = req.params.id;
    try {
        const subProduct = await SubProducts.findByIdAndDelete(id);
        const product = await Product.findById(subProduct.product);

        product.types.splice(product.types.indexOf(subProduct._id), 1);
        await product.save();
    } catch (error) {
        res.status(404).send({ error });
    }
});

router.put('/:id', adminAuth, async (req, res) => {
    const id = req.params.id;

    try {
        const subProduct = await validateUpdateProductSubType(req.body);
        const updated = await SubProducts.findByIdAndUpdate(id, subProduct);

        return res.status(200).send(updated);
    } catch (error) {
        return res.status(404).send(error);
    }
});

function validateProductSubType(subType) {
    return joi.validate(subType, {
        price: joi.string().required(),
        title: joi.string().required(),
        localPrice: joi.number().required(),
    });
}

function validateUpdateProductSubType(subType) {
    return joi.validate(subType, {
        price: joi.string(),
        title: joi.string(),
        localPrice: joi.number(),
    });
}

module.exports = router;
