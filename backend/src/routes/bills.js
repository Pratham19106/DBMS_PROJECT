const express = require("express")
const authMiddleware = require('../middlewares/authMiddleware')
const validateUser = require('../middlewares/validateUser')
const router = express.Router()
const { getAllBills, getAllBillsOfVendor, getBill, addNewBill, updateBill } = require("../Controller/bills")
router.get("/users/:userId/bills", authMiddleware, (req, res, next) => validateUser(req, res, next, getAllBills))
router.get("/users/:userId/vendors/:vendorId/bills", authMiddleware, (req, res, next) => validateUser(req, res, next, getAllBillsOfVendor))
router.get("/users/:userId/bills/:billId", authMiddleware, (req, res, next) => validateUser(req, res, next, getBill))
router.post("/users/:userId/bills", addNewBill)
router.put("/users/:userId/bills/:billId", authMiddleware, (req, res, next) => validateUser(req, res, next, updateBill))

module.exports = router;