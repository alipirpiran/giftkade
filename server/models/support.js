const mongoose = require('mongoose');
const supportId = 'support';

const Support = mongoose.model(
    'Support',
    new mongoose.Schema({
        _id: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            maxlength: 100,
        },
        phoneNumber: {
            type: String,
            maxlength: 11,
        },
    })
);

exports.getSupport = async () => {
    let support = await Support.findById(supportId);
    if (!support) {
        support = new Support({ _id: supportId });
    }
    return support;
};
