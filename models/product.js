const mongoose = require('mongoose');

module.exports = mongoose.model('Product', new mongoose.Schema({
    title: {
        type: String,
        maxlength: 20,
        required: true
    },
    description: {
        type: String,
        maxlength: 200,
    },
    image_path: {
        type: String,
        required: false
    },

    types: {
        type: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'ProductSubType' }],

    }
}));