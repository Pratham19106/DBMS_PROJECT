const pool = require('../db/db')
const {
    getCommoditiesForVendorQuery,
    getVendorsForCommodityQuery,
    getVendorSuggestionForCommodityQuery,
    linkCommodityToVendorQuery,
    unlinkCommodityFromVendorQuery
} = require('../services/vendorCommodityQueries')

const getCommoditiesForVendor = async (req, res, next) => {
    try {
        const vendorId = req.params.vendorId;
        const result = await pool.query(getCommoditiesForVendorQuery, [vendorId])

        if (result.rows.length === 0) {
            const error = new Error("No commodities found for this vendor")
            error.status = 404
            return next(error)
        }

        return res.status(200).json({ commodities: result.rows })
    } catch (err) {
        return next(err)
    }
}

const getVendorsForCommodity = async (req, res, next) => {
    try {
        const commodityId = req.params.commodityId;
        const result = await pool.query(getVendorsForCommodityQuery, [commodityId])

        if (result.rows.length === 0) {
            const error = new Error("No vendors found for this commodity")
            error.status = 404
            return next(error)
        }

        return res.status(200).json({ vendors: result.rows })
    } catch (err) {
        return next(err)
    }
}

const getVendorSuggestionForCommodity = async (req, res, next) => {
    try {
        const { userId, commodityId } = req.params;
        const result = await pool.query(getVendorSuggestionForCommodityQuery, [commodityId, userId])

        if (result.rows.length === 0) {
            const error = new Error("No vendors found for this commodity")
            error.status = 404
            return next(error)
        }

        return res.status(200).json({
            suggested_vendor: result.rows[0],
            all_vendors: result.rows
        })
    } catch (err) {
        return next(err)
    }
}

const linkCommodityToVendor = async (req, res, next) => {
    try {
        const vendorId = req.params.vendorId;
        const { commodity_id } = req.body;

        if (!commodity_id) {
            const error = new Error('commodity_id is required')
            error.status = 400
            return next(error)
        }

        await pool.query(linkCommodityToVendorQuery, [vendorId, commodity_id])

        return res.status(201).json({
            success: true,
            msg: "Commodity linked to vendor successfully"
        })
    } catch (err) {
        if (err.code === '23505') {
            const error = new Error('Commodity already linked to this vendor')
            error.status = 409
            return next(error)
        }
        if (err.code === '23503') {
            const error = new Error('Vendor or commodity does not exist')
            error.status = 400
            return next(error)
        }
        return next(err)
    }
}

const unlinkCommodityFromVendor = async (req, res, next) => {
    try {
        const { vendorId, commodityId } = req.params;
        const result = await pool.query(unlinkCommodityFromVendorQuery, [vendorId, commodityId])

        if (result.rowCount === 0) {
            const error = new Error("Link not found")
            error.status = 404
            return next(error)
        }

        return res.status(200).json({
            success: true,
            msg: "Commodity unlinked from vendor successfully"
        })
    } catch (err) {
        return next(err)
    }
}

module.exports = {
    getCommoditiesForVendor,
    getVendorsForCommodity,
    getVendorSuggestionForCommodity,
    linkCommodityToVendor,
    unlinkCommodityFromVendor
}
