const express = require("express")
const { getAllCommoditiesForVendor, addNewCommodityVendor, deleteCommodityVendor } = require("../Controller/vendorCommodity")
const router = express.Router()

router.get("/vendor-commodities/:id", getAllCommoditiesForVendor)
router.post("/vendors/:vendorId/commodities/:id", addNewCommodityVendor)
router.delete("/vendors/:vendorId/commodities/:id", deleteCommodityVendor)

module.exports = router