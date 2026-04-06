const pool = require("../db/db")
const { getAllBillsQuery, getAllBillsOfVendorsQuery, getSingleBillQuery, addNewBillCommodityQuery, addNewBillQuery } = require("../services/billQuery")
const getAllBills = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const result = await pool.query(getAllBillsQuery, [userId])
        if (!result || result.rows.length == 0) {
            const error = new Error("No Bills Found")
            error.status = 404
            next(err)
        }

        return res.status(200).json({ bills: result.rows })
    } catch (err) {
        next(err);
    }

}


const getAllBillsOfVendor = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const vendorId = req.params.vendorId;
        const result = await pool.query(getAllBillsOfVendorsQuery, [userId, vendoId])
        if (!result || result.rows.length == 0) {
            const error = new Error("No Bills Found")
            error.status = 404
            next(err)
        }

        return res.status(200).json({ bills: result.rows })
    } catch (error) {
        next(error)
    }
}


const getBill = async (req, res, next) => {
    try {
        const billId = req.params.billId
        const result = await pool.query(getSingleBillQuery, [billId]);
        if (result.rows.length === 0) {
            const err = new Error("Bill Not Found")
            err.status = 404
            next(err)
        }
        return result.rows[0]
    } catch (err) {
        next(err)
    }
}


const addNewBill = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const { vendorId, totalAmount, commodities } = req.body;
        const billResult = await pool.query(addNewBillQuery, [userId, vendorId, totalAmount])
        const commodityResult = []
        for (let commodity of commodities) {
            const { commodityId, name, quantity, amount } = commodity;
            commodityResult.push(await pool.query(addNewBillCommodityQuery, [billResult.rows[0].id, commodityId, amount, quantity, name]))
        }
        return res.status(201).json({ bill: billResult.rows[0], commodities: commodityResult.map(result => result.rows[0]) })
    } catch (err) {
        if (err.code === '23502') {
            const error = new Error('Bad Request')
            error.status = 400
            return next(error)
        }

        return next(err)

    }
}
const updateBill = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const billId = req.params.bilId
        const { amount } = req.body;
        const result = await pool.query(updateBillQuery, [amount, billId])
        if (result.rows === 0) {
            const err = new Error("Bill Not Found")
            err.status = 404
            next(err)
        }
        return res.status(200).json({
            success: true,
            message: "Bill Updated Successfully"
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


module.exports = { getAllBills, getAllBillsOfVendor, getBill, addNewBill, updateBill }