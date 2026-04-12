const getAllCommoditiesForVendorQuery = `
SELECT * FROM vendor_commodity
WHERE vendor_id = $1
`

const addNewVendorCommodityQuery = `
INSERT INTO vendor_commodity(vendor_id,commodity_id)
VALUES($1,$2)
RETURNING *
`

const deleteVendorCommodityQuery = `
DELETE FROM vendor_commodity WHERE vendor_id = $1 and commodity_id = $2
RETURNING  *
`
module.exports = {
    getAllCommoditiesForVendorQuery,
    addNewVendorCommodityQuery,
    deleteVendorCommodityQuery
}