const pool = require('../db/db')
const {
    getLowStockCommoditiesQuery,
    getVendorsForCommodityQuery,
    getVendorsForCommoditiesQuery,
    getPurchaseAnalyticsQuery,
    getVendorsWithPendingQuery,
    getPaymentDetailsQuery
} = require('../features/purchase')

// ============================================
// HELPER FUNCTIONS - Business Logic
// ============================================

// Calculate how many days between two dates
const getDaysDifference = (date1, date2 = new Date()) => {
    if (!date1) return null
    const diff = date2 - new Date(date1)
    return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// Score based on tolerance compliance (0-100)
const calculateToleranceScore = (pendingDebt, toleranceAmount, toleranceLevel) => {
    if (pendingDebt === 0) return 100
    if (pendingDebt <= toleranceAmount) return 80

    // Exceeded tolerance - score based on flexibility
    if (toleranceLevel === 'high') return 60
    if (toleranceLevel === 'medium') return 40
    return 20 // low tolerance
}

// Score based on debt amount (0-100)
const calculateDebtScore = (pendingDebt) => {
    if (pendingDebt === 0) return 100
    if (pendingDebt < 1000) return 80
    if (pendingDebt < 5000) return 60
    if (pendingDebt < 10000) return 40
    return 20
}

// Score based on last purchase date (0-100)
const calculateRecencyScore = (lastPurchaseDate) => {
    if (!lastPurchaseDate) return 100 // Never purchased - best to distribute

    const daysSinceLastPurchase = getDaysDifference(lastPurchaseDate)

    if (daysSinceLastPurchase > 30) return 100
    if (daysSinceLastPurchase > 15) return 70
    if (daysSinceLastPurchase > 7) return 50
    return 30
}

// Score based on how long vendor is waiting for payment (0-100)
const calculateUrgencyScore = (oldestUnpaidDate) => {
    if (!oldestUnpaidDate) return 100 // No pending payment

    const daysWaiting = getDaysDifference(oldestUnpaidDate)

    if (daysWaiting > 60) return 0 // Critical - too long
    if (daysWaiting > 30) return 30
    if (daysWaiting > 15) return 60
    return 100
}

// Calculate overall vendor score with weighted factors
const calculateOverallScore = (vendor) => {
    const toleranceScore = calculateToleranceScore(
        parseInt(vendor.pending_debt),
        parseInt(vendor.tolerance_amount || 0),
        vendor.tolerance_level
    )

    const debtScore = calculateDebtScore(parseInt(vendor.pending_debt))

    const recencyScore = calculateRecencyScore(vendor.last_purchase_date)

    const urgencyScore = calculateUrgencyScore(vendor.oldest_unpaid_bill_date)

    // Weighted calculation
    const overallScore = (
        toleranceScore * 0.35 +  // 35% weight to tolerance compliance
        debtScore * 0.30 +        // 30% weight to debt level
        recencyScore * 0.20 +      // 20% weight to purchase recency
        urgencyScore * 0.15        // 15% weight to payment urgency
    )

    return {
        tolerance_score: toleranceScore,
        debt_score: debtScore,
        recency_score: recencyScore,
        urgency_score: urgencyScore,
        overall_score: Math.round(overallScore * 10) / 10 // Round to 1 decimal
    }
}

// Determine vendor relationship health
const determineRelationshipHealth = (pendingDebt, toleranceAmount, toleranceLevel) => {
    if (pendingDebt === 0) return 'excellent'
    if (pendingDebt <= toleranceAmount) return 'good'
    if (toleranceLevel === 'high') return 'moderate'
    return 'critical'
}

// Determine payment priority
const determinePaymentPriority = (pendingAmount, toleranceAmount, toleranceLevel, daysWaiting) => {
    // Exceeded tolerance with strict vendor = URGENT
    if (pendingAmount > toleranceAmount && toleranceLevel === 'low') {
        return { priority: 'urgent', rank: 1 }
    }

    // Exceeded tolerance with medium flexibility = HIGH
    if (pendingAmount > toleranceAmount && toleranceLevel === 'medium') {
        return { priority: 'high', rank: 2 }
    }

    // Exceeded tolerance with high flexibility = HIGH
    if (pendingAmount > toleranceAmount && toleranceLevel === 'high') {
        return { priority: 'high', rank: 3 }
    }

    // Waiting too long
    if (daysWaiting > 60) return { priority: 'medium', rank: 4 }
    if (daysWaiting > 30) return { priority: 'medium', rank: 5 }

    return { priority: 'low', rank: 6 }
}

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

const getLowStockCommodities = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const result = await pool.query(getLowStockCommoditiesQuery, [userId])

        if (result.rows.length === 0) {
            return res.status(200).json({
                msg: "All commodities are well-stocked",
                low_stock_items: []
            })
        }

        // Add shortage calculation in JavaScript
        const lowStockItems = result.rows.map(item => ({
            ...item,
            shortage: item.min_quantity - item.current_quantity
        }))

        // Sort by shortage (highest first)
        lowStockItems.sort((a, b) => b.shortage - a.shortage)

        return res.status(200).json({
            msg: "Low stock alert",
            low_stock_items: lowStockItems,
            total_items: lowStockItems.length
        })
    } catch (err) {
        return next(err)
    }
}

const getSmartVendorRecommendation = async (req, res, next) => {
    try {
        const { userId, commodityId } = req.params
        const result = await pool.query(getVendorsForCommodityQuery, [commodityId, userId])

        if (result.rows.length === 0) {
            const error = new Error("No vendors found for this commodity")
            error.status = 404
            return next(error)
        }

        // Calculate scores for each vendor in JavaScript
        const vendorsWithScores = result.rows.map(vendor => {
            const scores = calculateOverallScore(vendor)
            return {
                ...vendor,
                ...scores
            }
        })

        // Sort by overall score (highest first), then by pending debt (lowest first)
        vendorsWithScores.sort((a, b) => {
            if (b.overall_score !== a.overall_score) {
                return b.overall_score - a.overall_score
            }
            return parseInt(a.pending_debt) - parseInt(b.pending_debt)
        })

        const recommended = vendorsWithScores[0]
        const explanation = generateRecommendationExplanation(recommended)

        return res.status(200).json({
            recommended_vendor: {
                ...recommended,
                recommendation_reason: explanation
            },
            all_vendors: vendorsWithScores,
            analysis: {
                total_vendors_available: vendorsWithScores.length,
                scoring_factors: {
                    tolerance_compliance: "35%",
                    debt_level: "30%",
                    purchase_recency: "20%",
                    payment_urgency: "15%"
                }
            }
        })
    } catch (err) {
        return next(err)
    }
}

const generateRecommendationExplanation = (vendor) => {
    const reasons = []
    const pendingDebt = parseInt(vendor.pending_debt)
    const toleranceAmount = parseInt(vendor.tolerance_amount || 0)

    if (pendingDebt === 0) {
        reasons.push("No pending debt - excellent relationship")
    } else if (pendingDebt <= toleranceAmount) {
        reasons.push("Debt within tolerance limit")
    }

    if (vendor.tolerance_level === 'high') {
        reasons.push("Vendor has high payment flexibility")
    }

    if (vendor.recency_score >= 70) {
        reasons.push("Haven't purchased recently - good to distribute orders")
    }

    if (vendor.urgency_score >= 60) {
        reasons.push("Not waiting too long for payments")
    }

    return reasons.length > 0 ? reasons.join("; ") : "Best overall score based on multiple factors"
}

const getBulkPurchaseOptimization = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const { commodity_ids } = req.body

        if (!commodity_ids || !Array.isArray(commodity_ids) || commodity_ids.length === 0) {
            const error = new Error('commodity_ids array is required')
            error.status = 400
            return next(error)
        }

        const result = await pool.query(getVendorsForCommoditiesQuery, [commodity_ids, userId])

        if (result.rows.length === 0) {
            const error = new Error("No vendors found for the specified commodities")
            error.status = 404
            return next(error)
        }

        const optimizedPlan = optimizeBulkPurchase(result.rows, commodity_ids)

        return res.status(200).json({
            purchase_plan: optimizedPlan.recommendations,
            strategy: optimizedPlan.strategy,
            total_commodities: commodity_ids.length,
            vendors_involved: optimizedPlan.vendorsCount
        })
    } catch (err) {
        return next(err)
    }
}

const optimizeBulkPurchase = (vendorData, commodityIds) => {
    const recommendations = []
    const vendorLoadMap = new Map() // Track how many commodities per vendor

    // Group vendors by commodity
    const groupedByCommodity = {}
    vendorData.forEach(row => {
        if (!groupedByCommodity[row.commodity_id]) {
            groupedByCommodity[row.commodity_id] = []
        }
        groupedByCommodity[row.commodity_id].push(row)
    })

    // For each commodity, pick the best vendor
    for (const commodityId of commodityIds) {
        const vendors = groupedByCommodity[commodityId]

        if (!vendors || vendors.length === 0) {
            recommendations.push({
                commodity_id: commodityId,
                commodity_name: "Unknown",
                recommended_vendor: null,
                reason: "No vendors available for this commodity"
            })
            continue
        }

        // Sort vendors by: 1) current load, 2) pending debt, 3) tolerance
        const sortedVendors = vendors.sort((a, b) => {
            const aLoad = vendorLoadMap.get(a.vendor_id) || 0
            const bLoad = vendorLoadMap.get(b.vendor_id) || 0

            // First: Balance load - prefer vendors with fewer assigned commodities
            if (aLoad !== bLoad) {
                return aLoad - bLoad
            }

            // Second: Lower debt is better
            const aDebt = parseInt(a.pending_debt) || 0
            const bDebt = parseInt(b.pending_debt) || 0
            if (aDebt !== bDebt) {
                return aDebt - bDebt
            }

            // Third: Higher tolerance is better
            const aTolerance = parseInt(a.tolerance_amount) || 0
            const bTolerance = parseInt(b.tolerance_amount) || 0
            return bTolerance - aTolerance
        })

        const selectedVendor = sortedVendors[0]

        // Update vendor load count
        const currentLoad = vendorLoadMap.get(selectedVendor.vendor_id) || 0
        vendorLoadMap.set(selectedVendor.vendor_id, currentLoad + 1)

        recommendations.push({
            commodity_id: selectedVendor.commodity_id,
            commodity_name: selectedVendor.commodity_name,
            recommended_vendor: {
                vendor_id: selectedVendor.vendor_id,
                vendor_name: selectedVendor.vendor_name,
                pending_debt: selectedVendor.pending_debt,
                tolerance_level: selectedVendor.tolerance_level
            },
            reason: generateBulkRecommendationReason(selectedVendor, currentLoad)
        })
    }

    return {
        recommendations,
        strategy: "Distribute purchases across vendors to minimize debt concentration and maintain good relationships",
        vendorsCount: vendorLoadMap.size
    }
}

const generateBulkRecommendationReason = (vendor, currentLoad) => {
    const reasons = []
    const debt = parseInt(vendor.pending_debt) || 0
    const tolerance = parseInt(vendor.tolerance_amount) || 0

    if (currentLoad === 0) {
        reasons.push("Load balancing - not overloading any single vendor")
    }

    if (debt === 0) {
        reasons.push("Zero pending debt")
    } else if (debt <= tolerance) {
        reasons.push("Within tolerance")
    }

    return reasons.join("; ") || "Optimal choice for this commodity"
}

const getPurchaseAnalytics = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const result = await pool.query(getPurchaseAnalyticsQuery, [userId])

        if (result.rows.length === 0) {
            return res.status(200).json({
                msg: "No purchase history found",
                analytics: {
                    total_vendors: 0,
                    total_pending: 0,
                    total_purchased: 0,
                    total_paid: 0,
                    vendors: []
                }
            })
        }

        // Calculate totals in JavaScript
        const totalPending = result.rows.reduce((sum, v) => sum + parseInt(v.total_pending || 0), 0)
        const totalPurchased = result.rows.reduce((sum, v) => sum + parseInt(v.total_purchased || 0), 0)
        const totalPaid = result.rows.reduce((sum, v) => sum + parseInt(v.total_paid || 0), 0)

        return res.status(200).json({
            analytics: {
                total_vendors: result.rows.length,
                total_pending: totalPending,
                total_purchased: totalPurchased,
                total_paid: totalPaid,
                payment_completion_rate: totalPurchased > 0
                    ? ((totalPaid / totalPurchased) * 100).toFixed(2) + '%'
                    : '0%',
                vendors: result.rows
            }
        })
    } catch (err) {
        return next(err)
    }
}

const getVendorHealthScore = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const result = await pool.query(getVendorsWithPendingQuery, [userId])

        if (result.rows.length === 0) {
            return res.status(200).json({
                msg: "All vendor relationships are in excellent health",
                vendors_at_risk: []
            })
        }

        // Calculate health and add days pending in JavaScript
        const vendorsWithHealth = result.rows.map(vendor => {
            const pendingDebt = parseInt(vendor.pending_debt)
            const toleranceAmount = parseInt(vendor.tolerance_amount || 0)

            // Determine relationship health
            const relationshipHealth = determineRelationshipHealth(
                pendingDebt,
                toleranceAmount,
                vendor.tolerance_level
            )

            // Calculate days oldest pending is outstanding
            const daysOldestPending = getDaysDifference(vendor.oldest_unpaid_date)

            return {
                ...vendor,
                relationship_health: relationshipHealth,
                days_oldest_pending: daysOldestPending
            }
        })

        // Sort vendors: critical first, then by debt amount
        vendorsWithHealth.sort((a, b) => {
            const healthPriority = { 'critical': 1, 'moderate': 2, 'good': 3, 'excellent': 4 }
            const aPriority = healthPriority[a.relationship_health] || 5
            const bPriority = healthPriority[b.relationship_health] || 5

            if (aPriority !== bPriority) {
                return aPriority - bPriority
            }

            return parseInt(b.pending_debt) - parseInt(a.pending_debt)
        })

        const critical = vendorsWithHealth.filter(v => v.relationship_health === 'critical')
        const moderate = vendorsWithHealth.filter(v => v.relationship_health === 'moderate')

        return res.status(200).json({
            summary: {
                total_vendors_with_pending: vendorsWithHealth.length,
                critical_relationships: critical.length,
                moderate_relationships: moderate.length
            },
            vendors_at_risk: vendorsWithHealth,
            recommendation: critical.length > 0
                ? "URGENT: Some vendors are beyond tolerance limits. Prioritize payments immediately."
                : moderate.length > 0
                ? "Monitor payment timelines to maintain good relationships."
                : "All relationships are healthy. Continue current payment practices."
        })
    } catch (err) {
        return next(err)
    }
}

const getPaymentPriority = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const result = await pool.query(getPaymentDetailsQuery, [userId])

        if (result.rows.length === 0) {
            return res.status(200).json({
                msg: "No pending payments",
                payment_priorities: []
            })
        }

        // Calculate priority and days waiting in JavaScript
        const vendorsWithPriority = result.rows.map(vendor => {
            const pendingAmount = parseInt(vendor.pending_amount)
            const toleranceAmount = parseInt(vendor.tolerance_amount || 0)
            const daysWaiting = getDaysDifference(vendor.oldest_bill_date)

            const { priority, rank } = determinePaymentPriority(
                pendingAmount,
                toleranceAmount,
                vendor.tolerance_level,
                daysWaiting
            )

            return {
                ...vendor,
                days_waiting: daysWaiting,
                priority: priority,
                priority_rank: rank
            }
        })

        // Sort by priority rank (lowest rank = highest priority)
        vendorsWithPriority.sort((a, b) => {
            if (a.priority_rank !== b.priority_rank) {
                return a.priority_rank - b.priority_rank
            }
            return parseInt(b.pending_amount) - parseInt(a.pending_amount)
        })

        const urgent = vendorsWithPriority.filter(v => v.priority === 'urgent')
        const high = vendorsWithPriority.filter(v => v.priority === 'high')

        return res.status(200).json({
            summary: {
                total_vendors_pending: vendorsWithPriority.length,
                urgent_count: urgent.length,
                high_priority_count: high.length,
                top_priority_vendor: vendorsWithPriority[0]
            },
            payment_priorities: vendorsWithPriority,
            recommendation: urgent.length > 0
                ? `URGENT: Pay ${urgent[0].vendor_name} immediately - exceeded tolerance with low flexibility`
                : high.length > 0
                ? `High Priority: Focus on ${high[0].vendor_name} - approaching tolerance limits`
                : "Continue with normal payment schedule"
        })
    } catch (err) {
        return next(err)
    }
}

module.exports = {
    getLowStockCommodities,
    getSmartVendorRecommendation,
    getBulkPurchaseOptimization,
    getPurchaseAnalytics,
    getVendorHealthScore,
    getPaymentPriority
}