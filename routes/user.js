const router = require('express').Router();
const joi = require('joi');

const User = require('../models/user')

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const user = User.findById(id).select('-password');
    return res.status(200).send(user);
})

router.post('/', async (req, res) => {
    try {
        const _user = await validateUser(req.body);

        const found = await User.findOne({ $or: [{ email: _user.email }, { phoneNumber: _user.phoneNumber }] })
        if (found) {
            return res.status(422).send({ status: 0, error: { message: 'کاربری با مشخصات مشابه وجود دارد.' } });
        }

        let user = new User(_user);
        user = await user.save();
        return res.status(200).send(user);
    } catch (err) {
        return res.status(400).send({ hasError: 1, message: err, error: { message: 'لطفا ورودی هارا کنترل کنید.' } })
    }

})

function validateUser(user) {
    return joi.validate(user, {
        email: joi.string().email().required(),
        phoneNumber: joi.string().regex(/^[0-9]+$/).required(),
        password: joi.string().min(8).required()
    })
}

module.exports = router;