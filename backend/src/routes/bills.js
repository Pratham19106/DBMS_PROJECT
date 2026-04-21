
const express = require('express')
const router = express.Router()
const { getBill, getAllBillsForUser, getAllBillsForVendor, addNewBill, updateBill, deleteBill } = require('../Controller/bills')

router.get('/users/:userId/bills', getAllBillsForUser)
router.get('/users/:userId/bills/:id', getBill)
router.get('/users/:userId/vendors/:vendorId/bills', getAllBillsForVendor)
router.post('/users/:userId/bills', addNewBill)
router.put('/users/:userId/bills/:id', updateBill)
router.delete('/users/:userId/bills/:id', deleteBill)

module.exports = router
