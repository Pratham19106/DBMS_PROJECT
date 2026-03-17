const getBillQuery = `
select * from bills
where id = $1
`

const getBillWithItemsQuery = `
select
    b.*,
    json_agg(
        json_build_object(
            'commodity_id', bc.commodity_id,
            'name', bc.name,
            'supplied_ammount', bc.supplied_ammount,
            'unit', bc.unit,
            'cost', bc.cost
        )
    ) as items
from bills b
left join bill_commodity bc on b.id = bc.bill_id
where b.id = $1
group by b.id
`

const getAllBillsForUserQuery = `
select * from bills
where user_id = $1
order by date desc
`

const getAllBillsForVendorQuery = `
select * from bills
where vendor_id = $1 and user_id = $2
order by date desc
`

const addNewBillQuery = `
insert into bills(vendor_id, user_id, total_amount, paid_amount, status, bill_url)
values($1, $2, $3, $4, $5, $6)
returning *
`

const updateBillQuery = `
update bills
set paid_amount = $1,
    status = $2,
    bill_url = $3,
    updated_at = current_timestamp
where id = $4
returning *
`

const deleteBillQuery = `
delete from bills
where id = $1
returning *
`

const addBillCommodityQuery = `
insert into bill_commodity(bill_id, commodity_id, supplied_ammount, unit, cost, name)
values($1, $2, $3, $4, $5, $6)
returning *
`

const getBillCommoditiesQuery = `
select * from bill_commodity
where bill_id = $1
`

const updateCommodityQuantityQuery = `
update commodities
set quantity = quantity + $1
where id = $2
`

module.exports = {
    getBillQuery,
    getBillWithItemsQuery,
    getAllBillsForUserQuery,
    getAllBillsForVendorQuery,
    addNewBillQuery,
    updateBillQuery,
    deleteBillQuery,
    addBillCommodityQuery,
    getBillCommoditiesQuery,
    updateCommodityQuantityQuery
}
