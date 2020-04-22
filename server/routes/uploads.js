const fs = require('fs');
const Product = require('../models/product');
const router = require('express').Router();
const debug = require('debug')('giftShop:Routes:Uploads');

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const product = await Product.findById(id);
        const readStream = fs.createReadStream(product.image_path);
        readStream.on('open', () => {
            readStream.pipe(res);
        });

        readStream.on('error', err => {
            res.status(404).send({ error: 'error in geting file' });
            debug(err);
        });
    } catch (error) {
        res.status(404).send({ error: 'product/image not found' });
    }
});

module.exports = router;
