// ============================================
// SIMPLIFIED SQL QUERIES FOR PURCHASE MODULE
// ============================================
// All calculations happen in JavaScript (see Controller/purchase.js)
// These queries ONLY fetch raw data

// Query 1: Get low stock commodities for a user
const getLowStockCommoditiesQuery = `
    SELECT
        c.id AS commodity_id,
        c.name AS commodity_name,
        c.quantity AS current_quantity,
        c.min_quantity,
        NULL::integer AS max_quantity
    FROM commodities c
    WHERE c.user_id = $1
    AND c.quantity < c.min_quantity
    ORDER BY c.quantity ASC
`

// Query 2: Get all vendors for a specific commodity
const getVendorsForCommodityQuery = `
    SELECT
        v.id AS vendor_id,
        v.name AS vendor_name,
        v.phone_number AS contact_info,
        v.tolerance_level,
        v.tolerance_amount,
        NULL::integer AS price,
        NULL::integer AS delivery_days,
        COALESCE(SUM(CASE
            WHEN COALESCE(b.paid_amount, 0) < COALESCE(b.total_amount, 0)
                THEN (COALESCE(b.total_amount, 0) - COALESCE(b.paid_amount, 0))
            ELSE 0
        END), 0) AS pending_debt,
        MIN(CASE
            WHEN COALESCE(b.paid_amount, 0) < COALESCE(b.total_amount, 0) THEN b.date
            ELSE NULL
        END) AS oldest_unpaid_bill_date,
        MAX(b.date) AS last_purchase_date
    FROM vendors v
    JOIN vendor_commodity vc ON v.id = vc.vendor_id
    LEFT JOIN bills b ON v.id = b.vendor_id
    LEFT JOIN bill_commodity bc ON b.id = bc.bill_id AND bc.commodity_id = vc.commodity_id
    WHERE vc.commodity_id = $1
    AND v.user_id = $2
    GROUP BY v.id, v.name, v.phone_number, v.tolerance_level, v.tolerance_amount
    ORDER BY v.name
`

// Query 3: Get vendors for multiple commodities (bulk purchase)
const getVendorsForCommoditiesQuery = `
    SELECT DISTINCT
        v.id AS vendor_id,
        v.name AS vendor_name,
        v.phone_number AS contact_info,
        v.tolerance_level,
        v.tolerance_amount,
        vc.commodity_id,
        c.name AS commodity_name,
        NULL::integer AS price,
        NULL::integer AS delivery_days,
        COALESCE(SUM(CASE
            WHEN COALESCE(b.paid_amount, 0) < COALESCE(b.total_amount, 0)
                THEN (COALESCE(b.total_amount, 0) - COALESCE(b.paid_amount, 0))
            ELSE 0
        END), 0) AS pending_debt
    FROM vendors v
    JOIN vendor_commodity vc ON v.id = vc.vendor_id
    JOIN commodities c ON vc.commodity_id = c.id
    LEFT JOIN bills b ON v.id = b.vendor_id
    WHERE vc.commodity_id = ANY($1)
    AND v.user_id = $2
    GROUP BY v.id, v.name, v.phone_number, v.tolerance_level, v.tolerance_amount, vc.commodity_id, c.name
    ORDER BY v.id, vc.commodity_id
`

// Query 4: Get purchase analytics for all vendors of a user
const getPurchaseAnalyticsQuery = `
    SELECT
        v.id AS vendor_id,
        v.name AS vendor_name,
        COUNT(DISTINCT b.id) AS total_purchases,
        COALESCE(SUM(CASE
            WHEN COALESCE(b.paid_amount, 0) >= COALESCE(b.total_amount, 0)
                THEN COALESCE(b.paid_amount, 0)
            ELSE 0
        END), 0) AS total_paid,
        COALESCE(SUM(CASE
            WHEN COALESCE(b.paid_amount, 0) < COALESCE(b.total_amount, 0)
                THEN (COALESCE(b.total_amount, 0) - COALESCE(b.paid_amount, 0))
            ELSE 0
        END), 0) AS total_pending,
        COALESCE(SUM(bc.supplied_ammount), 0) AS total_quantity,
        COALESCE(SUM(b.total_amount), 0) AS total_purchased,
        MAX(b.date) AS last_purchase_date
    FROM vendors v
    LEFT JOIN bills b ON v.id = b.vendor_id
    LEFT JOIN bill_commodity bc ON b.id = bc.bill_id
    WHERE v.user_id = $1
    GROUP BY v.id, v.name
    ORDER BY v.name
`

// Query 5: Get vendors with pending bills/debt
const getVendorsWithPendingQuery = `
    SELECT
        v.id AS vendor_id,
        v.name AS vendor_name,
        v.tolerance_level,
        v.tolerance_amount,
        COALESCE(SUM(CASE
            WHEN COALESCE(b.paid_amount, 0) < COALESCE(b.total_amount, 0)
                THEN (COALESCE(b.total_amount, 0) - COALESCE(b.paid_amount, 0))
            ELSE 0
        END), 0) AS pending_debt,
        MIN(CASE
            WHEN COALESCE(b.paid_amount, 0) < COALESCE(b.total_amount, 0) THEN b.date
            ELSE NULL
        END) AS oldest_unpaid_date
    FROM vendors v
    LEFT JOIN bills b ON v.id = b.vendor_id
    WHERE v.user_id = $1
    GROUP BY v.id, v.name, v.tolerance_level, v.tolerance_amount
    HAVING COALESCE(SUM(CASE
        WHEN COALESCE(b.paid_amount, 0) < COALESCE(b.total_amount, 0)
            THEN (COALESCE(b.total_amount, 0) - COALESCE(b.paid_amount, 0))
        ELSE 0
    END), 0) > 0
    ORDER BY pending_debt DESC
`

// Query 6: Get payment details for priority calculation
const getPaymentDetailsQuery = `
    SELECT
        v.id AS vendor_id,
        v.name AS vendor_name,
        v.tolerance_level,
        v.tolerance_amount,
        COALESCE(SUM(CASE
            WHEN COALESCE(b.paid_amount, 0) < COALESCE(b.total_amount, 0)
                THEN (COALESCE(b.total_amount, 0) - COALESCE(b.paid_amount, 0))
            ELSE 0
        END), 0) AS pending_amount,
        MIN(CASE
            WHEN COALESCE(b.paid_amount, 0) < COALESCE(b.total_amount, 0) THEN b.date
            ELSE NULL
        END) AS oldest_bill_date
    FROM vendors v
    LEFT JOIN bills b ON v.id = b.vendor_id
    WHERE v.user_id = $1
    AND COALESCE(b.paid_amount, 0) < COALESCE(b.total_amount, 0)
    GROUP BY v.id, v.name, v.tolerance_level, v.tolerance_amount
    HAVING COALESCE(SUM(CASE
        WHEN COALESCE(b.paid_amount, 0) < COALESCE(b.total_amount, 0)
            THEN (COALESCE(b.total_amount, 0) - COALESCE(b.paid_amount, 0))
        ELSE 0
    END), 0) > 0
    ORDER BY oldest_bill_date ASC
`

module.exports = {
    getLowStockCommoditiesQuery,
    getVendorsForCommodityQuery,
    getVendorsForCommoditiesQuery,
    getPurchaseAnalyticsQuery,
    getVendorsWithPendingQuery,
    getPaymentDetailsQuery
}