const router = require('express').Router()
const statisticService = require('../services/statistics')

const adminAuth = require('../auth/admin')
router.use(adminAuth)

router.get('/all/', async (req, res) => {
    const statistic = await statisticService.getStatistic()
    return res.send(statistic)
})

module.exports = router