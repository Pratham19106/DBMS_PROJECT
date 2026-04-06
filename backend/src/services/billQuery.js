const getAllBillsQuery = `
SELECT * from bills
where user_id = $1
order by created_at decs
`

const getAllBillsOfVendorsQuery = `
select * from bills
where user_id = $1 and vendor_id = $2,
order by created_at desc`


const getSingleBillQuery = `
select * from bills,
inner join bill_commodity,
on bill_commodity.bill_id = bills.bill_id,
where user_id = $1 and vendor_id = $2 and bill_id = $3`

const addNewBillQuery = `
insert into bills(user_id , vendor_id , total_amount )
values ($1 , $2 , $3 ) `

const addNewBillCommodityQuery = `
insert into bill_commodity(bill_id , commodity_id ,amount, quantity , name)
values ($1 , $2 , $3 , $4, $5),
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