const pool = require('../db/db')
const { getVendorQuery, getAllVendorsQuery, getAllVendorsForUserQuery, addNewVendorQuery, updateVendorQuery, deleteVendorQuery } = require('../services/vendorQueries')
const getVendor = async (req, res, next) => {
    try {
        const vendorId = req.params.id;
        const result = await pool.query(getVendorQuery, [vendorId])
        if (result.rows.length === 0) {
            const err = new Error("Vendor not found")
            err.status = 404
            return next(err)
        }
        return res.status(200).json({ vendor: result.rows[0] })
    } catch (err) {
        return next(err)
    }
}

const getAllVendors = async (req, res, next) => {
    try {
        const result = await pool.query(getAllVendorsQuery)

        if (!result || result.rows.length == 0) {
            const err = new Error("No Vendors found")
            err.status = 404
            return next(err)
        }

        return res.status(200).json({
            vendors: result.rows
        })
    } catch (err) {
        return next(err)
    }
}
const getAllVendorsForUser = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const result = await pool.query(getAllVendorsForUserQuery, [userId])

        if (!result || result.rows.length == 0) {
            const err = new Error("No Vendors found for this user")
            err.status = 404
            return next(err)
        }
        return res.status(200).json({
            vendors: result.rows
        })
    } catch (err) {
        return next(err)
    }
}
const addNewVendor = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const { name, phone_number } = req.body;

        if (!userId || !name || !phone_number) {
            const error = new Error('userId, name and phone_number are required');
            error.status = 400;
            return next(error);
        }

        const result = await pool.query(addNewVendorQuery, [userId, name, phone_number])

        return res.status(201).json({
            success: true,
            msg: "Vendor Added Successfully",
            vendor: result.rows[0]
        })
    } catch (err) {
        if (err.code === '23503') {
            const error = new Error('User Does not exist')
            error.status = 400
            return next(error)
        }
        if (err.code === '23502') {
            const error = new Error(err.detail || 'Bad Request')
            error.status = 400
            return next(error)
        }

        return next(err)
    }
}

const updateVendor = async (req, res, next) => {
    try {
        const vendorId = req.params.id;
        let { name, phone_number } = req.body;
        const fetchVendorData = await pool.query(getVendorQuery, [vendorId])
        if (!fetchVendorData || fetchVendorData.rows.length == 0) {
            const err = new Error("Vendor not found")
            err.status = 404
            return next(err)
        }
        name = name ?? fetchVendorData.rows[0].name
        phone_number = phone_number ?? fetchVendorData.rows[0].phone_number

        const result = await pool.query
            (updateVendorQuery, [name, phone_number, vendorId])

        if (result.rows.length === 0) {
            const err = new Error("Vendor not found")
            err.status = 404
            return next(err)
        }

        return res.status(200).json({
            success: true,
            msg: "Vendor Updated Successfully",
            vendor: result.rows[0]
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

const deleteVendor = async (req, res, next) => {
    try {
        const vendorId = req.params.id;
        const result = await pool.query(deleteVendorQuery, [vendorId])
        if (result.rows.length === 0) {
            const err = new Error("Vendor not found")
            err.status = 404
            return next(err)
        }
        return res.status(200).json({
            success: true,
            msg: "Vendor Deleted Successfully",
            vendor: result.rows[0]
        })
    } catch (err) {
        return next(err)
    }
}

module.exports = { getVendor, getAllVendors, getAllVendorsForUser, addNewVendor, updateVendor, deleteVendor }