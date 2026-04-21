const pool = require('../db/db')
const {
    createPaymentQuery,
    getPaymentsForUserQuery,
    getPaymentsForVendorQuery,
    getPaymentsForBillQuery,
    getPaymentSuggestionQuery,
    getBillForUpdateQuery,
    updateBillAfterPaymentQuery
} = require('../services/paymentQueries')
const { resolveBillStatusByAmounts } = require('../utils/billStatus')

const createPayment = async (req, res, next) => {
    const client = await pool.connect()
    try {
        const userId = req.params.userId
        const { vendorId, billId, amount, paymentMode } = req.body

        if (!vendorId || !billId || amount == null || !paymentMode) {
            const error = new Error('vendorId, billId, amount and paymentMode are required')
            error.status = 400
            return next(error)
        }

        const normalizedPaymentMode = String(paymentMode).toLowerCase()
        if (normalizedPaymentMode !== 'cash' && normalizedPaymentMode !== 'upi') {
            const error = new Error('paymentMode must be one of: cash, upi')
            error.status = 400
            return next(error)
        }

        const numericAmount = Number(amount)
        if (Number.isNaN(numericAmount) || numericAmount <= 0) {
            const error = new Error('amount must be a positive number')
            error.status = 400
            return next(error)
        }

        await client.query('BEGIN')

        const billResult = await client.query(getBillForUpdateQuery, [billId, userId, vendorId])
        if (billResult.rows.length === 0) {
            throw Object.assign(new Error('Bill not found for this user/vendor'), { status: 404 })
        }

        const bill = billResult.rows[0]
        const currentPaidAmount = Number(bill.paid_amount)
        const totalBillAmount = Number(bill.total_amount)
        const pendingAmount = Math.max(totalBillAmount - currentPaidAmount, 0)

        if (numericAmount > pendingAmount) {
            const error = new Error(`Amount exceeds pending bill amount. Pending amount is ${pendingAmount}.`)
            error.status = 400
            throw error
        }

        const nextPaidAmount = Number(bill.paid_amount) + numericAmount
        const nextStatus = await resolveBillStatusByAmounts(nextPaidAmount, Number(bill.total_amount))

        const paymentResult = await client.query(createPaymentQuery, [
            userId,
            vendorId,
            billId,
            numericAmount,
            normalizedPaymentMode
        ])

        const updatedBillResult = await client.query(updateBillAfterPaymentQuery, [
            numericAmount,
            nextStatus,
            billId,
            userId
        ])

        await client.query('COMMIT')

        return res.status(201).json({
            msg: 'Payment created successfully',
            payment: paymentResult.rows[0],
            bill: updatedBillResult.rows[0]
        })
    } catch (err) {
        await client.query('ROLLBACK').catch(() => { })
        if (err.code === '23503') {
            const error = new Error('Invalid userId, vendorId or billId')
            error.status = 400
            return next(error)
        }
        return next(err)
    } finally {
        client.release()
    }
}

const getPaymentsForUser = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const result = await pool.query(getPaymentsForUserQuery, [userId])
        return res.status(200).json({ payments: result.rows })
    } catch (err) {
        return next(err)
    }
}

const getPaymentsForVendor = async (req, res, next) => {
    try {
        const { userId, vendorId } = req.params
        const result = await pool.query(getPaymentsForVendorQuery, [userId, vendorId])
        return res.status(200).json({ payments: result.rows })
    } catch (err) {
        return next(err)
    }
}

const getPaymentsForBill = async (req, res, next) => {
    try {
        const { userId, billId } = req.params
        const result = await pool.query(getPaymentsForBillQuery, [userId, billId])
        return res.status(200).json({ payments: result.rows })
    } catch (err) {
        return next(err)
    }
}

const getPaymentSuggestion = async (req, res, next) => {
    try {
        const userId = req.params.userId
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
    createPayment,
    getPaymentsForUser,
    getPaymentsForVendor,
    getPaymentsForBill,
    getPaymentSuggestion
}
