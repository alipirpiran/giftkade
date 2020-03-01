const router = require('express').Router();
const joi = require('joi');
const bcrypt = require('bcryptjs');
const _ = require('lodash')

const userAuth = require('../auth/user')
const adminAuth = require('../auth/admin')


const User = require('../models/user')

// TODO: add admin auth for delete, put, get all

router.get('/user/:id', adminAuth, async (req, res) => {
    const id = req.params.id;

    // if (req.user != id) return res.status(403).send({ error: { message: 'Access denied' } })

    const user = await User.findById(id).select('-password -orders -payments');

    if (!user) return res.status(404).send({ error: { message: 'کاربر یافت نشد!' } });

    return res.status(200).send(user);
})

router.get('/user/', userAuth, async (req, res) => {
    const user = await User.findById(req.user).select('-password -payments -isAdmin');

    if (!user) return res.status(404).send({ error: { message: 'کاربر یافت نشد!' } });

    return res.status(200).send(user);
})

// router.post('/', async (req, res) => {
//     const _user = req.body;

//     // validate user data
//     const { error } = validateUser(req.body);
//     if (error) return res.status(400).send({ error: { message: 'ورودی هارا کنترل کنید.' } })

//     // check if user exists and phone number is validated
//     const found = await User.findOne({ phoneNumber: _user.phoneNumber })
//     if (found && found.isPhoneNumberValidated) {
//         return res.status(422).send({ status: 0, error: { message: 'کاربری با مشخصات مشابه وجود دارد.' } });
//     }
//     if (found && !found.isPhoneNumberValidated) {
//         await found.remove();
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(_user.password, salt);

//     let user = new User({
//         email: _user.email,
//         phoneNumber: _user.phoneNumber,
//         password: hashedPassword,
//     });

//     user = await user.save();
//     return res.status(200).send({ user: user._id });
// })

router.get('/all', adminAuth, async (req, res) => {
    let _users = await User.find().select('-password -payments');

    const users = []

    // set orders count and delete orders
    for (let user of _users) {
        user.ordersCount = user.orders.length;
        user = user.toObject();
        delete user.orders
        users.push(user)
        
    }
    
    return res.status(200).send(users);
})

router.delete('/:id', adminAuth, async (req, res) => {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (deleted) return res.status(200).send(deleted)
    return res.status(400).send({ error: { message: 'کاربر یافت نشد' } })
})

router.put('/user', userAuth, async (req, res) => {
    const { error } = validateUpdateUser(req.body);
    if (error) return res.status(400).send({ error: { message: 'ورودی هارا کنترل کنید' } })

    const { email, password } = req.body;
    if (!email && !password) return res.status(400).send({ error: { message: 'لطفا مقادیر خود را کنترل کنید' } })

    const user = await User.findById(req.user);
    if (!user) return res.status(403).send({ error: { message: 'شما دسترسی ندارید' } })

    if (email) {
        user.email = email;
    }

    if (password) {
        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        user.password = hashedPassword;
    }
    // TODO: complete for password update

    await user.save()
    return res.status(200).send({ status: 1 })
})


// TODO add admin auth 
// TODO add more details for updating for admins
// email ,passwrod, isAdmin, isPhoneNumberVAliudated, phoneNumber

router.put('/user:id', adminAuth, async (req, res) => {
    const { error } = validateUpdateUser(req.body);
    if (error) return res.status(400).send({ error: { message: 'ورودی هارا کنترل کنید' } })

    const { email, password } = req.body;
    if (!email && !password) return res.status(400).send({ error: { message: 'لطفا مقادیر خود را کنترل کنید' } })

    const user = await User.findById(req.params.id);
    if (!user) return res.status(403).send({ error: { message: 'کاربر یاقت نشد' } })

    if (email) {
        user.email = email;
    }

    if (password) {
        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        user.password = hashedPassword;
    }
    // TODO: complete for password update

    await user.save()
    return res.status(200).send({ status: 1, user: user })
})

function validateUser(user) {
    return joi.validate(user, {
        email: joi.string().email().required(),
        phoneNumber: joi.string().regex(/^[0-9]+$/).required(),
        password: joi.string().min(8).required()
    })
}

function validateUpdateUser(user) {
    return joi.validate(user, {
        email: joi.string().email(),
        password: joi.string().min(8).max(120),
    })
}

module.exports = router;