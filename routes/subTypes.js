const router = require('express').Router();

const ProductSubType = require('../models/productSubType')

router.get('/:id', async     (req, res) => {
    const id = req.params.id;
    const productSubType = await ProductSubType.findById(id);
})