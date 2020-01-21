const mongoose = require('mongoose')

module.exports = mongoose.model('ProductSubType', new mongoose.Schema({
    product: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Product',
        required: true
    },

    price: {
        type: mongoose.SchemaTypes.String,
        required: true
    },

    localPrice: {
        type: mongoose.SchemaTypes.Number,
        required: true,
        default: 0
    },

    title: {
        type: String,
        required: true
    },

    tokens: {
        type: [{
            selled: '',
            key: ''
        }],
        default: []
    }
}))