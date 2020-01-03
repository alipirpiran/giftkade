const router = require('express').Router();
const joi = require('joi');
const bcrypt = require('bcryptjs');

const userAuth = require('../auth/user')

const User = require('../models/user')

router.get('/:id', userAuth, async (req, res) => {
    const id = req.params.id;

    if (req.user != id) return res.status(403).send({ error: { message: 'Access denied' } })

    const user = await User.findById(id).select('-password');

    if (!user) return res.status(404).send({ error: { message: 'کاربر یافت نشد!' } });

    return res.status(200).send(user);
})

router.post('/', async (req, res) => {
    const _user = req.body;

    // validate user data
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send({ error: { message: 'ورودی هارا کنترل کنید.' } })

    // check if user exists and phone number is validated
    const found = await User.findOne({ $or: [{ email: _user.email }, { phoneNumber: _user.phoneNumber }] })
    if (found && found.isPhoneNumberValidated) {
        return res.status(422).send({ status: 0, error: { message: 'کاربری با مشخصات مشابه وجود دارد.' } });
    }
    if (found && !found.isPhoneNumberValidated) {
        await found.remove();
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(_user.password, salt);

    let user = new User({
        email: _user.email,
        phoneNumber: _user.phoneNumber,
        password: hashedPassword,
    });

    user = await user.save();
    return res.status(200).send({ user: user._id });


})

function validateUser(user) {
    return joi.validate(user, {
        email: joi.string().email().required(),
        phoneNumber: joi.string().regex(/^[0-9]+$/).required(),
        password: joi.string().min(8).required()
    })
}

module.exports = router;