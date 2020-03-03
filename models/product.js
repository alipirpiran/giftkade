const mongoose = require('mongoose');
const statistic = require('../services/statistics');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        maxlength: 20,
        required: true,
    },
    description: {
        type: String,
        maxlength: 200,
    },
    image_path: {
        type: String,
        required: false,
    },

    types: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'ProductSubType' }],
    },
});

productSchema.pre('save', async function(next) {
    if (this.isNew) await statistic.addProduct();
    next();
});

productSchema.pre('remove', async function(next) {
    await statistic.delProduct();
    next();
});

module.exports = mongoose.model('Product', productSchema);
