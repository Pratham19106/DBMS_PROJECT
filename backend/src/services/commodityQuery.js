const getCommodityQuery = `
select * from commodities
where id = $1
`
const getAllCommoditiesQuery = `
select * from commodities
where user_id = $1
`
const addNewCommodityQuery =
    `
insert into commodities(name,quantity,unit,user_id)
values($1,$2,$3,$4)
returning *
`
const updateCommodityQuery = `
update commodities
set quantity = $1
where id = $2
returning *
`
const deleteCommodityQuery = `
delete from commodities
where id = $1
`
module.exports = {
    getCommodityQuery,
    getAllCommoditiesQuery,
    addNewCommodityQuery,
    updateCommodityQuery,
    deleteCommodityQuery
}