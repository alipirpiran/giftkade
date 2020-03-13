const router = require('express').Router();
const joi = require('joi');
const bcrypt = require('bcryptjs');
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

router.get('/user/', userAuth, async (req, res) => {
    const user = await User.findById(req.user).select(
        '-password -payments -isAdmin'
    );

    if (!user)
        return res.status(404).send({ error: { message: 'کاربر یافت نشد!' } });

    return res.status(200).send(user);
});

// * create user
router.post('/', adminAuth, async (req, res) => {
    const _user = req.body;

    // validate user data
    const { error } = validateAdminAddUser(req.body);
    if (error)
        return res.status(400).send({
            error: {
                message: 'ورودی هارا کنترل کنید.',
                dev: error.message,
            },
        });

    // check if user exists and phone number is validated
    const found = await User.findOne({ phoneNumber: _user.phoneNumber });
    if (found) {
        return res.status(422).send({
            status: 0,
            error: { message: 'کاربری با مشخصات مشابه وجود دارد.' },
        });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(_user.password, salt);
    _user.password = hashedPassword;

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
        .select('-password -payments -orders');

    const users = [];

    // set orders count and delete orders
    for (let user of _users) {
        user.ordersCount = user.orders.length;
        user = user.toObject();
        delete user.orders;
        users.push(user);
    }

    return res.status(200).send(users);
});

router.delete('/:id', adminAuth, async (req, res) => {
    const user = await User.findById(req.params.id);
    if(!user) return res.status(400).send({ error: { message: 'کاربر یافت نشد' } });
    
    await user.remove()

    return res.status(200).send(user);
});

router.put('/user', userAuth, async (req, res) => {
    const { error } = validateUpdateUser(req.body);
    if (error)
        return res
            .status(400)
            .send({ error: { message: 'ورودی هارا کنترل کنید' } });

    const { email, password } = req.body;
    if (!email && !password)
        return res
            .status(400)
            .send({ error: { message: 'لطفا مقادیر خود را کنترل کنید' } });

    const user = await User.findById(req.user);
    if (!user)
        return res
            .status(403)
            .send({ error: { message: 'شما دسترسی ندارید' } });

    if (email) {
        user.email = email;
    }

    if (password) {
        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
    }
    await user.save();
    return res.status(200).send({ status: 1 });
});

router.put('/user/:id', adminAuth, async (req, res) => {
    const { error } = validateAdminUpdateUser(req.body);
    if (error)
        return res
            .status(400)
            .send({ error: { message: 'ورودی هارا کنترل کنید' } });

    let user = await User.findById(req.params.id);
    if (!user)
        return res.status(403).send({ error: { message: 'کاربر یاقت نشد' } });

    if (req.body.password) {
        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        req.body.password = hashedPassword;
    }

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
        password: joi
            .string()
            .min(8)
            .required(),
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
        password: joi
            .string()
            .min(8)
            .required(),
        isAdmin: joi.bool(),
        isPhoneNumberValidated: joi.bool(),
    });
}

function validateUpdateUser(user) {
    return joi.validate(user, {
        email: joi.string().email(),
        password: joi
            .string()
            .min(8)
            .max(120),
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
