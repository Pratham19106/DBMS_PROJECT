const pool = require('../db/db');
const { getAllCommoditiesQuery, getCommodityQuery, addNewCommodityQuery, deleteCommodityQuery } = require('../services/commodityQuery');


const getAllCommodies = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const result = await pool.query(getAllCommoditiesQuery, [userId])

        if (result.rows.length === 0) {
            const error = new Error("No commodities found for this user")
            error.status = 404
            return next(error)
        }

        return res.status(200).json({
            commodities: result.rows
        })

    } catch (err) {
        return next(err)
    }
}

const getCommodity = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await pool.query(getCommodityQuery, [id])

        if (!result || result.rows.length === 0) {
            const error = new Error("Commodity not found")
            error.status = 404
            return next(error)
        }
        return res.status(200).json({
            commodity: result.rows[0]
        })
    } catch (err) {
        return next(err)
    }
}
const addNewCommodity = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const { name, quantity, unit } = req.body

        const normalizedName = name.toLowerCase();

        const ifExist = await pool.query(
         'select id from commodities where name = $1 and user_id = $2',
         [normalizedName, userId]
         );

         if (ifExist.rows.length > 0) {
         const error = new Error("Commodity already exist");
           error.status = 409;
          return next(error);
         }

       const result = await pool.query(addNewCommodityQuery, [normalizedName, quantity, unit, userId]);
        if (result.rows.length === 0) {
            const error = new Error("Failed to add commodity")
            error.status = 500
            return next(error)
        }
        return res.status(201).json({
            success: true,
            commodity: result.rows[0]
        })

    } catch (err) {
        next(err)
    }
}
const deleteCommodity = async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await pool.query(deleteCommodityQuery, [id])
        if (result.rowCount === 0) {
            const error = new Error("Commodity not found")
            error.status = 404
            return next(error)
        }
        return res.status(200).json({
            success: true,
            msg: "Commodity deleted successfully"
        })
    } catch (err) {
        return next(err)
    }
}

const updateCommodity = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { quantity } = req.body
        const result = await pool.query(updateCommodityQuery, [quantity, id])
        if (result.rowCount === 0) {
            const error = new Error("Commodity not found")
            error.status = 404
            return next(error)
        }
        return res.status(200).json({
            success: true,
            msg: "Commodity updated successfully",
            commodity: result.rows[0]
        })
    } catch (err) {
        return next(err)
    }

}
module.exports = { getAllCommodies, getCommodity, addNewCommodity, deleteCommodity, updateCommodity }