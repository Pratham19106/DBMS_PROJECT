const getVendorQuery = `
select * from vendors
where id = $1
`
const getAllVendorsQuery = `
select * from vendors
`
const getAllVendorsForUserQuery = `
select * from vendors
where user_id = $1
`

const addNewVendorQuery = `
insert into vendors(user_id,name,phone_number,tolerance_amount,tolerance_level)
values($1,$2,$3,$4,$5)
returning *
`
const updateVendorQuery = `
update vendors
set name =$1,
phone_number =$2,
tolerance_amount = $3,
tolerance_level = $4
where id = $5
returning *
`
const deleteVendorQuery = `
delete from vendors
where id = $1
returning *
`
module.exports = { getVendorQuery, getAllVendorsQuery, getAllVendorsForUserQuery, addNewVendorQuery, updateVendorQuery, deleteVendorQuery }