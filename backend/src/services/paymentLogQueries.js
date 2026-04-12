const getAllPaymentLogsForUserQuery = `
select * from payment_logs
where user_id = $1
order by payment_date desc
`

const getPaymentLogsForVendorQuery = `
select * from payment_logs
where vendor_id = $1 and user_id = $2
order by payment_date desc
`

const getPaymentLogsForBillQuery = `
select * from payment_logs
where bill_id = $1
order by payment_date desc
`

const addPaymentLogQuery = `
insert into payment_logs(user_id, vendor_id, bill_id, amount_paid, payment_mode)
values($1, $2, $3, $4, $5)
returning *
`

const updateBillAfterPaymentQuery = `
update bills
set paid_amount = paid_amount + $1,
    status = $2,
    updated_at = current_timestamp
where id = $3
returning *
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

module.exports = {
    getAllPaymentLogsForUserQuery,
    getPaymentLogsForVendorQuery,
    getPaymentLogsForBillQuery,
    addPaymentLogQuery,
    updateBillAfterPaymentQuery,
    getPaymentSuggestionQuery
}
