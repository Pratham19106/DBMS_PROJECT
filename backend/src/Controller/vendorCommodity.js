const pool = require('../db/db');
const { getAllCommoditiesForVendorQuery, addNewVendorCommodityQuery, deleteVendorCommodityQuery } = require('../services/commodityVendorQuery');



const getAllCommoditiesForVendor = async (req, res, next) => {
    try {
        const vendorId = req.params.id;
        const result = await pool.query(getAllCommoditiesForVendorQuery, [vendorId])
        if (!result && result.rows.length === 0) {
            const err = "No commodities for "
            err.status = 404
            return next(err)
        }
        return res.status(200).json({
            commodities: result.rows
        })
    } catch (err) {
        return next(err)
    }
}

const addNewCommodityVendor = async (req, res, next) => {
    try {
        const vendorId = req.params.vendorId
        const commodityId = req.params.id

        const result = await pool.query(addNewVendorCommodityQuery, [vendorId, commodityId])

        return res.status(201).json({
            success: true,
            msg: "Mapping Added  Successfully"
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
const deleteCommodityVendor = async (req, res, next) => {
    try {
        const vendorId = req.params.vendorId;
        const commodityId = req.params.id
        const result = await pool.query(deleteVendorCommodityQuery, [vendorId, commodityId])
        if (result.rows.length === 0) {
            const err = new Error("Mapping not found")
            err.status = 404
            return next(err)
        }
        return res.status(200).json({
            success: true,
            msg: "Mapping Deleted Successfully"
        })
    } catch (err) {
        return next(err)
    }
}

module.exports = {
    getAllCommoditiesForVendor,
    addNewCommodityVendor,
    deleteCommodityVendor
}
