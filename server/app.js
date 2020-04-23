var createError = require('http-errors');
var express = require('express');
var path = require('path');
const cors = require('cors');
const helmet = require('helmet');
var bodyParser = require('body-parser');
const redis = require('redis');
const redisClient = redis.createClient();
const adminAuth = require('./auth/admin');
const production = process.env.NODE_ENV == 'production';
const ejs = require('ejs')

// statistics setup
require('./services/statistics').refresh();

// Sentry log errors
const Sentry = require('@sentry/node');
Sentry.init({
    dsn: 'https://d8ac305ae9ac4da9b9d4a48e8b55e4bb@sentry.io/2381170',
});

module.exports.redisClient = redisClient;
redisClient.flushall();

// db setup
require('./db');

// set exports
const { verifyOrder, rejectOrder } = require('./routes/order');
require('./routes/zarinPayment').set(verifyOrder, rejectOrder);

// ----------------- DATADOG ----------------------------
var dd_options = {
    response_code: true,
    tags: ['app:my_app'],
};

var connect_datadog = require('connect-datadog')(dd_options);
// ----------------- DATADOG ----------------------------

const indexRouter = require('./routes/index');
const productsRouter = require('./routes/product');
const uploadsRoute = require('./routes/uploads');
const subProductTypeRoute = require('./routes/subProductTypes');
const userRoute = require('./routes/user');
const phoneValidateRoute = require('./routes/phoneValidate');
const authRoute = require('./routes/auth');
const orderRoute = require('./routes/order').router;
const tokenRoute = require('./routes/giftCardToken');
// const paymentRoute = require('./routes/payment').router
const zarinRoute = require('./routes/zarinPayment').router;
const resetPassRoute = require('./routes/resetPass');
const paymentRoute = require('./routes/payment');
const statisticsRoute = require('./routes/statistics');

var app = express();

// Status monitor
const statusMonitor = require('express-status-monitor')({
    path: 'status/',
    title: 'Giftkade Status',
    socketPath: production
        ? process.env.BASE_PATH + '/socket.io'
        : '/socket.io',
});
app.use(statusMonitor);
app.get('/status',adminAuth, statusMonitor.pageRoute);

// Sentry log errors
app.use(Sentry.Handlers.requestHandler());

app.use(helmet());
app.use(cors());

// view engine setup
// app.engine('html', ejs.Template());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(express.static('public'));

app.use(express.static(path.join(__dirname, 'public')));

// --------- DATADOG-------------
app.use(connect_datadog);
// --------- DATADOG-------------

app.use('/', indexRouter);
app.use('/products', productsRouter);
app.use('/subProducts', subProductTypeRoute);
app.use('/uploads', uploadsRoute);
app.use('/phoneValidate', phoneValidateRoute);
app.use('/users', userRoute);
app.use('/auth', authRoute);
app.use('/order', orderRoute);
// app.use('/payment', paymentRoute)
app.use('/payment', zarinRoute);
app.use('/tokens', tokenRoute);
app.use('/resetPass', resetPassRoute);
app.use('/payments', paymentRoute);
app.use('/statistics', statisticsRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
    // res.send(req.url);
});

// Sentry Error handler
app.use(Sentry.Handlers.errorHandler());

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    console.log(err);
    
    // render the error page
    res.status(err.status || 500);
    res.send({});
});

module.exports = app;
