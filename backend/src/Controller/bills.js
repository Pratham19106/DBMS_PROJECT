const pool = require('../db/db')
const {
    getBillQuery,
    getBillWithItemsQuery,
    getAllBillsForUserQuery,
    getAllBillsForVendorQuery,
    addNewBillQuery,
    updateBillQuery,
    deleteBillQuery,
    addBillCommodityQuery,
    getBillCommoditiesQuery,
    updateCommodityQuantityQuery
} = require('../services/billQueries')

const determineBillStatus = (paid_amount, total_amount) => {
    if (paid_amount <= 0) return 'unpaid'
    if (paid_amount >= total_amount) return 'paid'
    return 'partial'
}

const getBill = async (req, res, next) => {
    try {
        const billId = req.params.id;
        const result = await pool.query(getBillWithItemsQuery, [billId])

        if (result.rows.length === 0) {
            const error = new Error("Bill not found")
            error.status = 404
            return next(error)
        }

        return res.status(200).json({ bill: result.rows[0] })
    } catch (err) {
        return next(err)
    }
}

const getAllBillsForUser = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const result = await pool.query(getAllBillsForUserQuery, [userId])

        return res.status(200).json({ bills: result.rows })
    } catch (err) {
        return next(err)
    }
}

const getAllBillsForVendor = async (req, res, next) => {
    try {
        const { userId, vendorId } = req.params;
        const result = await pool.query(getAllBillsForVendorQuery, [vendorId, userId])

        return res.status(200).json({ bills: result.rows })
    } catch (err) {
        return next(err)
    }
}

const addNewBill = async (req, res, next) => {
    const client = await pool.connect()
    try {
        const userId = req.params.userId;
        const { vendor_id, total_amount, paid_amount = 0, bill_url = null, commodities } = req.body;

        if (!vendor_id || !total_amount || !commodities || !Array.isArray(commodities) || commodities.length === 0) {
            const error = new Error('vendor_id, total_amount and commodities are required')
            error.status = 400
            return next(error)
        }

        const status = determineBillStatus(paid_amount, total_amount)

        await client.query('BEGIN')

        const billResult = await client.query(addNewBillQuery, [
            vendor_id, userId, total_amount, paid_amount, status, bill_url
        ])

        const newBill = billResult.rows[0]

        const billCommodities = []
        for (const item of commodities) {
            const { commodity_id, supplied_ammount, unit, cost, name } = item

            if (!commodity_id || !supplied_ammount || !cost || !name) {
                await client.query('ROLLBACK')
                const error = new Error('Each commodity must have commodity_id, supplied_ammount, cost and name')
                error.status = 400
                return next(error)
            }

            const bcResult = await client.query(addBillCommodityQuery, [
                newBill.id, commodity_id, supplied_ammount, unit || 'kg', cost, name
            ])
            billCommodities.push(bcResult.rows[0])

            await client.query(updateCommodityQuantityQuery, [supplied_ammount, commodity_id])
        }

        await client.query('COMMIT')

        return res.status(201).json({
            success: true,
            msg: "Bill Added Successfully",
            bill: newBill,
            items: billCommodities
        })
    } catch (err) {
        await client.query('ROLLBACK')
        if (err.code === '23503') {
            const error = new Error('Vendor, user or commodity does not exist')
            error.status = 400
            return next(error)
        }
        if (err.code === '23502') {
            const error = new Error('Bad Request')
            error.status = 400
            return next(error)
        }
        return next(err)
    } finally {
        client.release()
    }
}

const updateBill = async (req, res, next) => {
    try {
        const billId = req.params.id;
        let { paid_amount, bill_url } = req.body;

        const fetchBillData = await pool.query(getBillQuery, [billId])
        if (fetchBillData.rows.length === 0) {
            const error = new Error("Bill not found")
            error.status = 404
            return next(error)
        }

        paid_amount = paid_amount ?? fetchBillData.rows[0].paid_amount
        bill_url = bill_url ?? fetchBillData.rows[0].bill_url

        const status = determineBillStatus(paid_amount, fetchBillData.rows[0].total_amount)

        const result = await pool.query(updateBillQuery, [paid_amount, status, bill_url, billId])

        return res.status(200).json({
            success: true,
            msg: "Bill Updated Successfully",
            bill: result.rows[0]
        })
    } catch (err) {
        if (err.code === '23502') {
            const error = new Error('Bad Request')
            error.status = 400
            return next(error)
        }
        return next(err)
    }
}

const deleteBill = async (req, res, next) => {
    try {
        const billId = req.params.id;
        const result = await pool.query(deleteBillQuery, [billId])

        if (result.rows.length === 0) {
            const error = new Error("Bill not found")
            error.status = 404
            return next(error)
        }

        return res.status(200).json({
            success: true,
            msg: "Bill deleted successfully"
        })
    } catch (err) {
        return next(err)
    }
}

module.exports = {
    getBill,
    getAllBillsForUser,
    getAllBillsForVendor,
    addNewBill,
    updateBill,
    deleteBill
}
