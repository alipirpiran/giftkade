const mongoose = require('mongoose')

module.exports = mongoose.model('Token', new mongoose.Schema({
    code: {
        type: String,
        required: true
    },

    isSelled: {
        type: Boolean,
        default: false,
    },
    isPending: {
        type: Boolean,
        default: false,
    },

    subProduct: {
        type: mongoose.Types.ObjectId,
        ref: 'ProductSubType',
        required: true
    }
}))