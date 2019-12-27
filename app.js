var createError = require('http-errors');
var express = require('express');
var path = require('path');
const cors = require('cors')
const helmet = require('helmet');
var bodyParser = require('body-parser');

// db setup
require('./db')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const productsRouter = require('./routes/product')
const uploadsRoute = require('./routes/uploads')
const subProductTypeRoute = require('./routes/subProductTypes')
const userRoute = require('./routes/user')
const phoneValidateRoute = require('./routes/phoneValidate')

var app = express();

app.use(helmet());

// const corsOptions = {
//   origin: true,
//   credentials: true
// }
// app.options('*', cors(corsOptions));
app.use(cors())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(express.static('public'));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/products', productsRouter);
app.use('/subProducts', subProductTypeRoute)
app.use('/uploads', uploadsRoute)
app.use('/phoneValidate', phoneValidateRoute)
app.use('/user', userRoute)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
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
