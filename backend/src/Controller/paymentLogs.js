const pool = require('../db/db')
const { getBillQuery } = require('../services/billQueries')
const {
    getAllPaymentLogsForUserQuery,
    getPaymentLogsForVendorQuery,
    getPaymentLogsForBillQuery,
    addPaymentLogQuery,
    updateBillAfterPaymentQuery,
    getPaymentSuggestionQuery
} = require('../services/paymentLogQueries')

const determineBillStatus = (paid_amount, total_amount) => {
    if (paid_amount <= 0) return 'unpaid'
    if (paid_amount >= total_amount) return 'paid'
    return 'partial'
}

const getAllPaymentLogsForUser = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const result = await pool.query(getAllPaymentLogsForUserQuery, [userId])

        if (result.rows.length === 0) {
            const error = new Error("No payment logs found for this user")
            error.status = 404
            return next(error)
        }

        return res.status(200).json({ payment_logs: result.rows })
    } catch (err) {
        return next(err)
    }
}

const getPaymentLogsForVendor = async (req, res, next) => {
    try {
        const { userId, vendorId } = req.params;
        const result = await pool.query(getPaymentLogsForVendorQuery, [vendorId, userId])

        if (result.rows.length === 0) {
            const error = new Error("No payment logs found for this vendor")
            error.status = 404
            return next(error)
        }

        return res.status(200).json({ payment_logs: result.rows })
    } catch (err) {
        return next(err)
    }
}

const getPaymentLogsForBill = async (req, res, next) => {
    try {
        const billId = req.params.billId;
        const result = await pool.query(getPaymentLogsForBillQuery, [billId])

        if (result.rows.length === 0) {
            const error = new Error("No payment logs found for this bill")
            error.status = 404
            return next(error)
        }

        return res.status(200).json({ payment_logs: result.rows })
    } catch (err) {
        return next(err)
    }
}

const addPaymentLog = async (req, res, next) => {
    const client = await pool.connect()
    try {
        const userId = req.params.userId;
        const { vendor_id, bill_id, amount_paid, payment_mode } = req.body;

        if (!vendor_id || !bill_id || !amount_paid || !payment_mode) {
            const error = new Error('vendor_id, bill_id, amount_paid and payment_mode are required')
            error.status = 400
            return next(error)
        }

        const fetchBillData = await client.query(getBillQuery, [bill_id])
        if (fetchBillData.rows.length === 0) {
            const error = new Error("Bill not found")
            error.status = 404
            return next(error)
        }

        const bill = fetchBillData.rows[0]
        const newPaidAmount = bill.paid_amount + amount_paid
        const newStatus = determineBillStatus(newPaidAmount, bill.total_amount)

        await client.query('BEGIN')

        const logResult = await client.query(addPaymentLogQuery, [
            userId, vendor_id, bill_id, amount_paid, payment_mode
        ])

        const updatedBill = await client.query(updateBillAfterPaymentQuery, [
            amount_paid, newStatus, bill_id
        ])

        await client.query('COMMIT')

        return res.status(201).json({
            success: true,
            msg: "Payment logged successfully",
            payment_log: logResult.rows[0],
            bill: updatedBill.rows[0]
        })
    } catch (err) {
        await client.query('ROLLBACK')
        if (err.code === '23503') {
            const error = new Error('User, vendor or bill does not exist')
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

const getPaymentSuggestion = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const result = await pool.query(getPaymentSuggestionQuery, [userId])

        if (result.rows.length === 0) {
            return res.status(200).json({
                msg: "No pending payments",
                vendors: []
            })
        }

        return res.status(200).json({
            suggested_vendor: result.rows[0],
            all_pending_vendors: result.rows
        })
    } catch (err) {
        return next(err)
    }
}

module.exports = {
    getAllPaymentLogsForUser,
    getPaymentLogsForVendor,
    getPaymentLogsForBill,
    addPaymentLog,
    getPaymentSuggestion
}
