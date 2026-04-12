const createPaymentQuery = `
insert into payments (user_id, vendor_id, bill_id, amount)
values ($1, $2, $3, $4)
returning id, user_id, vendor_id, bill_id, amount, payment_date
`

const getPaymentsForUserQuery = `
select id, user_id, vendor_id, bill_id, amount, payment_date
from payments
where user_id = $1
order by payment_date desc
`

const getPaymentsForVendorQuery = `
select id, user_id, vendor_id, bill_id, amount, payment_date
from payments
where user_id = $1 and vendor_id = $2
order by payment_date desc
`

const getPaymentsForBillQuery = `
select id, user_id, vendor_id, bill_id, amount, payment_date
from payments
where user_id = $1 and bill_id = $2
order by payment_date desc
`

const getBillForUpdateQuery = `
select id, total_amount, paid_amount
from bills
where id = $1 and user_id = $2 and vendor_id = $3
for update
`

const updateBillAfterPaymentQuery = `
update bills
set paid_amount = paid_amount + $1,
    status = $2,
    updated_at = current_timestamp
where id = $3 and user_id = $4
returning id, user_id, vendor_id, total_amount, paid_amount, status, updated_at
`

module.exports = {
    createPaymentQuery,
    getPaymentsForUserQuery,
    getPaymentsForVendorQuery,
    getPaymentsForBillQuery,
    getBillForUpdateQuery,
    updateBillAfterPaymentQuery
}
