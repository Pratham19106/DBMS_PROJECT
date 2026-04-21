const createPaymentQuery = `
insert into payments (user_id, vendor_id, bill_id, amount, payment_mode, payment_date)
values ($1, $2, $3, $4, $5, timezone('Asia/Kolkata', now()))
returning id, user_id, vendor_id, bill_id, amount, payment_mode, payment_date
`

const getPaymentsForUserQuery = `
select id, user_id, vendor_id, bill_id, amount, payment_mode, payment_date
from payments
where user_id = $1
order by payment_date desc
`

const getPaymentsForVendorQuery = `
select id, user_id, vendor_id, bill_id, amount, payment_mode, payment_date
from payments
where user_id = $1 and vendor_id = $2
order by payment_date desc
`

const getPaymentsForBillQuery = `
select id, user_id, vendor_id, bill_id, amount, payment_mode, payment_date
from payments
where user_id = $1 and bill_id = $2
order by payment_date desc
`

const getPaymentSuggestionQuery = `
select v.id, v.name, v.phone_number,
    coalesce(sum(b.total_amount - b.paid_amount), 0) as pending_amount,
    min(b.date) as oldest_bill_date,
    count(b.id) as unpaid_bill_count
from vendors v
join bills b on b.vendor_id = v.id
where b.user_id = $1
    and coalesce(b.total_amount, 0) - coalesce(b.paid_amount, 0) > 0
group by v.id, v.name, v.phone_number
having coalesce(sum(b.total_amount - b.paid_amount), 0) > 0
order by oldest_bill_date asc, pending_amount desc
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
    getPaymentSuggestionQuery,
    getBillForUpdateQuery,
    updateBillAfterPaymentQuery
}
