require('../db');

const User = require('../models/user');

const user = new User({
  email: 'alipirpiran@gmail.com',
  phoneNumber: '09010417052',
  password: '12345678',
  isAdmin: true,
  dateJoined: Date.now(),
});

user
  .save()
  .then((val) => console.log('success create User\n', user))
  .catch((err) => console.log(err))
  .finally(() => {
    process.exit(0);
  });
