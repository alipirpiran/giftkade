// require('dotenv').config()
const mongoose = require('mongoose');
const debug = require('debug')('giftShop:DB');

const URL = process.env.DB_URL || 'mongodb://localhost/giftShop';

mongoose
    .connect(URL, {
        useFindAndModify: false,
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => debug('connected to mongodb'))
    .catch(err => debug(err));
