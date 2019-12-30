const router = require('express').Router();
const joi = require('joi')
const fs = require('fs')
const multer = require('multer')
const debug = require('debug')('giftShop:Route:product')

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
        image_path: req.file.path
    };
    validateProduct(_product)
        .then(async item => {
            const product = new Product(_product);
            await product.save();
            res.status(200).send(product);
        }).catch(err => {
            res.status(500).send({ error: 'error in adding new product' });
            debug(err);
        })
})

router.get('/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const product = await Product.findById(id).select('title description');
        res.send(product)

    } catch (error) {
        res.status(404).send({ error: 'not found' })
    }
})

router.delete('/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const product = await Product.findByIdAndDelete(id);
        if (!product)
            res.status(404).send({ error: 'not found' })
        else {
            fs.unlink(product.image_path, err => { })
            res.status(200).send({ status: 'deleted' })
        }
    } catch (error) {
        res.status(500).send('server error');
    }
})

router.post('/update/:id', upload.single('image'), async (req, res) => {
    const id = req.params.id;

    let _product = {
        title: req.body.title,
        description: req.body.description
    };

    if (req.file && req.file.path) {
        _product.image_path = req.file.path

        Product.findById(id).then(product => {
            fs.unlink(product.image_path, (err) => {
                if (err)
                    debug(err);
            })
        })
    }

    validateUpdateProduct(_product)
        .then(async item => {
            const product = await Product.findByIdAndUpdate(id, _product)
            res.status(200).send(product);
        }).catch(err => {
            res.status(500).send({ error: 'error in adding new product' });
            debug(err);
        })
})

function validateProduct(product) {
    return joi.validate(product, {
        title: joi.string().max(20).required(),
        description: joi.string().max(200),
        image_path: joi.string()
    })
}

function validateUpdateProduct(product) {
    return joi.validate(product, {
        title: joi.string().max(20),
        description: joi.string().max(200),
        image_path: joi.string()
    })
}

module.exports = router;