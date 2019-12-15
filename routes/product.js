const router = require('express').Router();
const joi = require('joi')
const multer = require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
})

const upload = multer({ storage })

const Product = require('../models/product')
// router.use(upload.array())
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).send(products);
    } catch (error) {
        res.status(500).send({ error: 'server error' })
    }
});

router.post('/', upload.single('image'), (req, res) => {
    const _product = {
        title: req.body.title,
        description: req.body.description,
        image_url: req.file.path
    };
    validateProduct(_product)
        .then(async item => {
            const product = new Product(_product);
            await product.save();
            res.status(200).send(product);
        }).catch(err => {
            res.status(500).send({ error: 'error in adding new product' });
            console.log(err);
        })
})

router.get('/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const product = await Product.findById(id).select('title description image_url');
        res.send(product)

    } catch (error) {
        res.status(404).send({ error: 'not found' })
    }
})

function validateProduct(product) {
    return joi.validate(product, {
        title: joi.string().max(20).required(),
        description: joi.string().max(200),
        image_url: joi.string()
    })
}

module.exports = router;