const router = require('express').Router()
const statisticService = require('../services/statistics')

const Order = require('../models/order')

const adminAuth = require('../auth/admin')
router.use(adminAuth)

router.get('/all/', async (req, res) => {
    const statistic = await statisticService.getStatistic()
    return res.send(statistic)
})

router.get('/order/:year/:month/:day', async (req, res) => {
    let { year, month, day } = req.params;
    year = parseInt(year)
    month = parseInt(month)
    day = parseInt(day)

    if (year <= 0 || month <= 0 || day <= 0) {
        return res.status(400).send({ error: { message: 'تاریخ ها باید بزرگتر از صفر باشد' } })
    }

    var startDate = new Date(`${year}-${month}-${day}`);
    var endDate = new Date(`${year}-${month}-${day}`).setDate(day + 1);

    if (startDate == 'Invalid Date' || endDate == 'Invalid Date') {
        return res.status(400).send({ error: { message: 'تاریخ اشتباه است' } })

    }

    var orders = await Order.find({ isPayed: true })
    orders = orders.filter(order => {
        return order.isPayed && order.time >= startDate && order.time < endDate;
    })
    return res.send(orders)
})

module.exports = router