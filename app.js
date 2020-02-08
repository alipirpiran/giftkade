var createError = require('http-errors');
var express = require('express');
var path = require('path');
const cors = require('cors')
const helmet = require('helmet');
var bodyParser = require('body-parser');
const redis = require('redis')
const redisClient = redis.createClient();
module.exports.redisClient = redisClient;

redisClient.flushall()

// redisClient.hgetall('asdf', (err, ))

// db setup
require('./db')

const indexRouter = require('./routes/index');
const productsRouter = require('./routes/product')
const uploadsRoute = require('./routes/uploads')
const subProductTypeRoute = require('./routes/subProductTypes')
const userRoute = require('./routes/user')
const phoneValidateRoute = require('./routes/phoneValidate');
const authRoute = require('./routes/auth');
const orderRoute = require('./routes/order').router
const tokenRoute = require('./routes/giftCardToken')
// const paymentRoute = require('./routes/payment').router
const zarinRoute = require('./routes/zarinPayment').router

var app = express();

app.use(helmet());
app.use(cors())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(express.static('public'));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/products', productsRouter);
app.use('/subProducts', subProductTypeRoute)
app.use('/uploads', uploadsRoute)
app.use('/phoneValidate', phoneValidateRoute)
app.use('/users', userRoute)
app.use('/auth', authRoute)
app.use('/order', orderRoute)
// app.use('/payment', paymentRoute)
app.use('/payment', zarinRoute)
app.use('/tokens', tokenRoute)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
  // res.send(req.url);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
