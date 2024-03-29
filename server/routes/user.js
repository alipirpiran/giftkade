const router = require('express').Router();
const joi = require('joi');
const Errors = require('../templates/error');
// const bcrypt = require('bcryptjs');
const _ = require('lodash');

const userAuth = require('../auth/user');
const adminAuth = require('../auth/admin');

const User = require('../models/user');

router.get('/user/:id', adminAuth, async (req, res) => {
    const id = req.params.id;

    // if (req.user != id) return res.status(403).send({ error: { message: 'Access denied' } })

    let user = await User.findById(id).select('-password -payments');
    if (!user)
        return res.status(404).send({ error: { message: 'کاربر یافت نشد!' } });

    user.ordersCount = user.orders.length;
    user = user.toObject();
    delete user.orders;

    return res.status(200).send(user);
});

router.get('/user/', userAuth, async (req, res, next) => {
    const user = await User.findById(req.user).select(
        '-password -payments -isAdmin'
    );

    if (!user) return next(Errors.userNotFound());

    return res.status(200).send(user);
});

// * create user
router.post('/', adminAuth, async (req, res, next) => {
    const _user = req.body;

    // validate user data
    const { error } = validateAdminAddUser(req.body);
    if (error) return next(Errors.controllInputs());

    // check if user exists and phone number is validated
    const found = await User.findOne({ phoneNumber: _user.phoneNumber });
    if (found) return next(Errors.sameUserExists());

    let user = new User(_user);
    user.toObject();
    delete user.password;

    await user.save();

    return res.status(200).send({ user });
});

router.get('/all', adminAuth, async (req, res) => {
    let _users = await User.find()
        .setOptions({
            limit: parseInt(req.query.limit),
            skip: parseInt(req.query.skip),
        })
        .select('-password -payments');

    const users = [];

    // set orders count and delete orders
    for (let user of _users) {
        user.ordersCount = user.orders.length;
        user = user.toObject();
        delete user.orders;
        users.push(user);
    }

    return res.status(200).send(users.reverse());
});

router.get('/admin/', adminAuth, async (req, res) => {
    const { phoneNumber, isAdmin } = req.query;
    let conditions = {};

    phoneNumber ? (conditions.phoneNumber = phoneNumber) : null;
    isAdmin
        ? (conditions.isAdmin = String(isAdmin).toLocaleLowerCase() == 'true')
        : null;

    const _users = await User.find(conditions).select('-payments -password');

    const users = [];
    for (let user of _users) {
        user.ordersCount = user.orders.length;
        user = user.toObject();
        delete user.orders;
        users.push(user);
    }

    return res.send(users);
});

router.delete('/:id', adminAuth, async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(Errors.userNotFound());

    // await user.remove();
    user.isActive = false;
    await user.save();

    return res.status(200).send(user);
});

router.put('/user', userAuth, async (req, res, next) => {
    const { error } = validateUpdateUser(req.body);
    if (error) return next(Errors.controllInputs());

    const { email, password } = req.body;
    if (!email && !password) return next(Errors.controllInputs());

    const user = await User.findById(req.user);
    if (!user) return next(Errors.forbidden());

    if (email) {
        user.email = email;
    }

    if (password) {
        // hash password
        //! moved to user model
        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(password, salt);

        user.password = password;
    }
    await user.save();
    return res.status(200).send({ status: 1 });
});

router.put('/user/:id', adminAuth, async (req, res, next) => {
    const { error } = validateAdminUpdateUser(req.body);
    if (error) return next(Errors.controllInputs());

    let user = await User.findById(req.params.id);
    if (!user) return next(Errors.userNotFound());

    await user.updateOne(req.body);

    // await user.save()
    return res.status(200).send(user);
});

router.get('/count', adminAuth, async (req, res) => {
    const users = await User.find();
    return res.send({ count: users.length });
});

function validateUser(user) {
    return joi.validate(user, {
        email: joi.string().email(),
        phoneNumber: joi
            .string()
            .regex(/^[0-9]+$/)
            .length(11)
            .required(),
        password: joi.string().min(8).required(),
    });
}

function validateAdminAddUser(user) {
    return joi.validate(user, {
        email: joi.string().email(),
        phoneNumber: joi
            .string()
            .regex(/^[0-9]+$/)
            .length(11)
            .required(),
        password: joi.string().min(8).required(),
        isAdmin: joi.bool(),
        isPhoneNumberValidated: joi.bool(),
    });
}

function validateUpdateUser(user) {
    return joi.validate(user, {
        email: joi.string().email(),
        password: joi.string().min(8).max(120),
    });
}

function validateAdminUpdateUser(user) {
    return joi.validate(user, {
        email: joi.string().email(),
        phoneNumber: joi.string().regex(/^[0-9]+$/),
        password: joi.string().min(8),
        isPhoneNumberValidated: joi.bool(),
        isAdmin: joi.bool(),
    });
}

module.exports = router;
