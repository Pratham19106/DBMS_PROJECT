const express = require('express')
const router = express.Router()
const {
    createPayment,
    getPaymentsForUser,
    getPaymentsForVendor,
    getPaymentsForBill
} = require('../Controller/payments')

router.post('/users/:userId/payments', createPayment)
router.get('/users/:userId/payments', getPaymentsForUser)
router.get('/users/:userId/vendors/:vendorId/payments', getPaymentsForVendor)
router.get('/users/:userId/bills/:billId/payments', getPaymentsForBill)

module.exports = router
