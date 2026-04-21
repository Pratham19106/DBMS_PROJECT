const express = require('express')
const router = express.Router()
const {
    getDailyLogsForUser,
    createDailyLog,
    deleteDailyLog,
    getDailyLogAnalytics,
} = require('../Controller/dailyLogs')

router.get('/users/:userId/daily-logs', getDailyLogsForUser)
router.get('/users/:userId/daily-logs/analytics', getDailyLogAnalytics)
router.post('/users/:userId/daily-logs', createDailyLog)
router.delete('/users/:userId/daily-logs/:logId', deleteDailyLog)

module.exports = router
