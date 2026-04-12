const getAllBillsQuery = `
SELECT * from bills
where user_id = $1
order by date desc
`

const getAllBillsOfVendorsQuery = `
select * from bills
where user_id = $1 and vendor_id = $2
order by date desc
`


const getSingleBillQuery = `
select b.*, bc.*
from bills b
inner join bill_commodity bc on bc.bill_id = b.id
where b.user_id = $1 and b.vendor_id = $2 and b.id = $3
`

const addNewBillQuery = `
insert into bills(user_id , vendor_id , total_amount )
values ($1 , $2 , $3 )
returning *
`

const addNewBillCommodityQuery = `
insert into bill_commodity(bill_id , commodity_id , supplied_ammount, unit, cost, name)
values ($1 , $2 , $3 , $4, $5, $6)
RETURNING *
`
const updateBillQuery = `
UPDATE bills 
set paid_amount = $1
where id = $2
returning *
`

module.exports = {
    getAllBillsQuery,
    getAllBillsOfVendorsQuery,
    getSingleBillQuery,
    addNewBillQuery,
    addNewBillCommodityQuery,
    updateBillQuery
}