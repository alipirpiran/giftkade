// require('dotenv').config()
const mongoose = require('mongoose');
const debug = require('debug')('giftShop:DB');

const URL = process.env.DB_URL || 'mongodb://localhost/giftShop';

const options = {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
if (process.env.NODE_ENV == 'production') {
    options.user = process.env.DB_USER;
    options.pass = process.env.DB_PASS;
}

mongoose
    .connect(URL, options)
    .then(() => debug('connected to mongodb'))
    .catch((err) => debug(err));
