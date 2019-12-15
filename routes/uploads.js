const fs = require('fs')
const Product = require('../models/product');
const router = require('express').Router()

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const product = await Product.findById(id)
        const readStream = fs.createReadStream(product.image_url)
        readStream.on('open', () => {
            readStream.pipe(res);
        })

        readStream.on('error', (err) => {
            res.status(404).send({ error: 'error in geting file' })
            console.log(err);
        })
    } catch (error) {
        res.status(404).send({ error: 'product/imageu not found' })
    }


})

module.exports = router;