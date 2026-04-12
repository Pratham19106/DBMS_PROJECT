const express = require("express")
const router = express.Router()
const {
    getLowStockCommodities,
    getSmartVendorRecommendation,
    getBulkPurchaseOptimization,
    getPurchaseAnalytics,
    getVendorHealthScore,
    getPaymentPriority
} = require('../Controller/purchase')

router.get('/users/:userId/purchase/low-stock-alerts', getLowStockCommodities)
router.get('/users/:userId/purchase/vendor-recommendation/:commodityId', getSmartVendorRecommendation)
router.post('/users/:userId/purchase/bulk-plan', getBulkPurchaseOptimization)
router.get('/users/:userId/purchase/analytics', getPurchaseAnalytics)
router.get('/users/:userId/purchase/vendor-health', getVendorHealthScore)
router.get('/users/:userId/purchase/payment-priority', getPaymentPriority)

module.exports = router

