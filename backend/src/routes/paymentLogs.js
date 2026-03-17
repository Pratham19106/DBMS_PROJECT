const express = require('express')
const router = express.Router()
const {getAllPaymentLogsForUser,getPaymentLogsForVendor,getPaymentLogsForBill,addPaymentLog,getPaymentSuggestion } = require('../Controller/paymentLogs')

router.get('/users/:userId/payment-logs', getAllPaymentLogsForUser)
router.get('/users/:userId/vendors/:vendorId/payment-logs', getPaymentLogsForVendor)
router.get('/users/:userId/bills/:billId/payment-logs', getPaymentLogsForBill)
router.get('/users/:userId/payment-suggestion', getPaymentSuggestion)
router.post('/users/:userId/payment-logs', addPaymentLog)

module.exports = router
