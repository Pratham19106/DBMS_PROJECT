const express = require('express');
const { getVendor, getAllVendors, getAllVendorsForUser, addNewVendor, updateVendor, deleteVendor } = require("../Controller/vendors");
const authMiddleware = require('../middlewares/authMiddleware');
const validateUser = require('../middlewares/validateUser')
const router = express.Router();
router.use(express.json());
router.get("/vendors", getAllVendors)
router.get("/users/:userId/vendors", authMiddleware ,(req , res ,next) => validateUser(req , res , next, getAllVendorsForUser) )
router.get("/users/:userId/vendors/:id", authMiddleware , (req , res ,next) => validateUser(req , res , next, getVendor))
router.post("/vendors", addNewVendor)
router.put("/vendors/:id", updateVendor)
router.delete('/vendors/:id', deleteVendor)
module.exports = router;