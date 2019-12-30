const joi = require('joi')
const router = require('express').Router();
const debug = require('debug')('giftShop:Route:SubProduct')


const ProductSubType = require('../models/productSubType')
const Product = require('../models/product')

router.get('/', (req, res) => {
    res.send({ route: '/subProducts' })
})

// id : the product id
router.get('/all/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const subTypes = await Product.findById(id).populate('types', 'price title product').select('types')
        return res.status(200).send(subTypes);
    } catch (error) {
        return res.status(404).send({ error: 'product not found' })
    }
})

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const subType = await ProductSubType.findById(id);
        return res.status(200).send(subType)
    } catch (error) {

    }
})

router.post('/:id', async (req, res) => {
    const id = req.params.id;

    validateProductSubType(req.body)
        .then(async _subType => {
            _subType.product = id;
            const productSubType = new ProductSubType(_subType);
            const subType = await productSubType.save()

            const product = await Product.findById(id);
            product.types.push(subType);
            await product.save()

            return res.status(200).send(subType);
        }).catch(err => {
            return res.status(400).send({ error: err })
        })
})

router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const subProduct = await ProductSubType.findByIdAndDelete(id);
        const product = await Product.findById(subProduct.product);

        product.types.splice(product.types.indexOf(subProduct._id), 1)
        await product.save()
    } catch (error) {
        res.status(404).send({ error })
    }
})

router.put('/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const subProduct = await validateUpdateProductSubType(req.body);
        const updated = await ProductSubType.findByIdAndUpdate(id, subProduct);

        return res.status(200).send(updated)
    } catch (error) {
        return res.status(404).send(error)
    }

})

function validateProductSubType(subType) {
    return joi.validate(subType, {
        price: joi.number().required(),
        title: joi.string().required(),
    })
}

function validateUpdateProductSubType(subType) {
    return joi.validate(subType, {
        price: joi.number(),
        title: joi.string(),
    })
}


module.exports = router;
