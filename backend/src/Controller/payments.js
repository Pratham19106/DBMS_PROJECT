const pool = require('../db/db')
const {
    createPaymentQuery,
    getPaymentsForUserQuery,
    getPaymentsForVendorQuery,
    getPaymentsForBillQuery,
    getBillForUpdateQuery,
    updateBillAfterPaymentQuery
} = require('../services/paymentQueries')

const determineBillStatus = (paidAmount, totalAmount) => {
    if (paidAmount <= 0) return 'unpaid'
    if (paidAmount >= totalAmount) return 'paid'
    return 'partial'
}

const createPayment = async (req, res, next) => {
    const client = await pool.connect()
    try {
        const userId = req.params.userId
        const { vendorId, billId, amount } = req.body

        if (!vendorId || !billId || amount == null) {
            const error = new Error('vendorId, billId and amount are required')
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
        const nextPaidAmount = Number(bill.paid_amount) + numericAmount
        const nextStatus = determineBillStatus(nextPaidAmount, Number(bill.total_amount))

        const paymentResult = await client.query(createPaymentQuery, [
            userId,
            vendorId,
            billId,
            numericAmount
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
        await client.query('ROLLBACK').catch(() => {})
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

module.exports = {
    createPayment,
    getPaymentsForUser,
    getPaymentsForVendor,
    getPaymentsForBill
}
