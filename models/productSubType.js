const mongoose = require('mongoose')

module.exports = mongoose.model('ProductSubType', new mongoose.Schema({
    product: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Product',
        required: true
    },

    price: {
        type: mongoose.SchemaTypes.Number,
        required: true
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