const pool = require('../db/db')
const {
    getAllPaymentLogsForUserQuery,
    getPaymentLogsForVendorQuery,
    getPaymentLogsForBillQuery,
    addPaymentLogQuery,
    updateBillAfterPaymentQuery,
    getPaymentSuggestionQuery
} = require('../services/paymentLogQueries')
const { resolveBillStatusByAmounts } = require('../utils/billStatus')

const getAllPaymentLogsForUser = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const result = await pool.query(getAllPaymentLogsForUserQuery, [userId])

        return res.status(200).json({ payment_logs: result.rows })
    } catch (err) {
        return next(err)
    }
}

const getPaymentLogsForVendor = async (req, res, next) => {
    try {
        const { userId, vendorId } = req.params;
        const result = await pool.query(getPaymentLogsForVendorQuery, [vendorId, userId])

        return res.status(200).json({ payment_logs: result.rows })
    } catch (err) {
        return next(err)
    }
}

const getPaymentLogsForBill = async (req, res, next) => {
    try {
        const billId = req.params.billId;
        const result = await pool.query(getPaymentLogsForBillQuery, [billId])

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

        if (!vendor_id || !bill_id || amount_paid == null || amount_paid <= 0 || !payment_mode) {
            const error = new Error('vendor_id, bill_id, amount_paid and payment_mode are required')
            error.status = 400
            return next(error)
        }

        await client.query('BEGIN')

        const fetchBillData = await client.query(
            'select * from bills where id = $1 for update',
            [bill_id]
        )
        if (fetchBillData.rows.length === 0) {
            throw Object.assign(new Error('Bill not found'), { status: 404 })
        }

        const bill = fetchBillData.rows[0]
        const paidAmount = Number(amount_paid)
        if (Number.isNaN(paidAmount)) {
            throw Object.assign(new Error('amount_paid must be a valid number'), { status: 400 })
        }

        const newPaidAmount = Number(bill.paid_amount) + paidAmount
        const newStatus = await resolveBillStatusByAmounts(newPaidAmount, Number(bill.total_amount))

        const logResult = await client.query(addPaymentLogQuery, [
            userId, vendor_id, bill_id, paidAmount, payment_mode
        ])

        const updatedBill = await client.query(updateBillAfterPaymentQuery, [
            paidAmount, newStatus, bill_id
        ])

        await client.query('COMMIT')

        return res.status(201).json({
            success: true,
            msg: "Payment logged successfully",
            payment_log: logResult.rows[0],
            bill: updatedBill.rows[0]
        })
    } catch (err) {
        await client.query('ROLLBACK').catch(() => { })
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
