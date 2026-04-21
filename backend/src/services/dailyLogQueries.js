const getDailyLogsForUserQuery = `
select id, user_id, log_type, amount, log_date, note, created_at, updated_at
from daily_logs
where user_id = $1
  and ($2::text is null or log_type = $2)
  and ($3::timestamp is null or log_date >= $3)
  and ($4::timestamp is null or log_date <= $4)
order by log_date desc, created_at desc
limit $5
`

const createDailyLogQuery = `
insert into daily_logs (user_id, log_type, amount, log_date, note)
values ($1, $2, $3, $4, $5)
returning id, user_id, log_type, amount, log_date, note, created_at, updated_at
`

const deleteDailyLogQuery = `
delete from daily_logs
where id = $1 and user_id = $2
returning id
`

const getUnifiedFinancialLogsForRangeQuery = `
select
  concat('payment-', p.id::text) as id,
  p.user_id,
  'paid'::text as log_type,
  p.amount::integer as amount,
  p.payment_date as log_date,
  null::text as note,
  'payments'::text as source,
  p.vendor_id,
  v.name as vendor_name,
  p.bill_id,
  p.payment_mode::text as payment_mode,
  p.payment_date as created_at
from payments p
left join vendors v on v.id = p.vendor_id
where p.user_id = $1
  and p.payment_date >= $2
  and p.payment_date < $3

union all

select
  concat('daily-', d.id::text) as id,
  d.user_id,
  d.log_type,
  d.amount::integer as amount,
  d.log_date,
  d.note,
  'daily_logs'::text as source,
  null::uuid as vendor_id,
  null::text as vendor_name,
  null::uuid as bill_id,
  null::text as payment_mode,
  d.created_at
from daily_logs d
where d.user_id = $1
  and d.log_type in ('received', 'paid')
  and d.log_date >= $2
  and d.log_date < $3

order by log_date desc, created_at desc
limit $4
`

module.exports = {
    getDailyLogsForUserQuery,
    createDailyLogQuery,
    deleteDailyLogQuery,
    getUnifiedFinancialLogsForRangeQuery,
}
