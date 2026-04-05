const express = require('express')
const router = express.Router()
const {getCommoditiesForVendor,getVendorsForCommodity,getVendorSuggestionForCommodity,linkCommodityToVendor,unlinkCommodityFromVendor} = require('../Controller/vendorCommodity')

router.get('/users/:userId/vendors/:vendorId/commodities', getCommoditiesForVendor)
router.get('/users/:userId/commodities/:commodityId/vendors', getVendorsForCommodity)
router.get('/users/:userId/commodities/:commodityId/vendor-suggestion', getVendorSuggestionForCommodity)
router.post('/users/:userId/vendors/:vendorId/commodities', linkCommodityToVendor)
router.delete('/users/:userId/vendors/:vendorId/commodities/:commodityId', unlinkCommodityFromVendor)

module.exports = router
