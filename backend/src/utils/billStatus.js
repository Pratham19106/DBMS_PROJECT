const pool = require("../db/db")

let cachedStatuses = null

const getBillStatusValuesQuery = `
select e.enumlabel
from pg_type t
join pg_enum e on t.oid = e.enumtypid
where t.typname = 'bill_status'
order by e.enumsortorder
`

const normalize = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "_")

const chooseCandidate = (values, candidates) => {
  for (const candidate of candidates) {
    if (values.includes(candidate)) {
      return candidate
    }
  }
  return null
}

async function getBillStatusMap() {
  if (cachedStatuses) {
    return cachedStatuses
  }

  const result = await pool.query(getBillStatusValuesQuery)
  const labels = result.rows.map((row) => normalize(row.enumlabel))

  const unpaid =
    chooseCandidate(labels, ["unpaid", "pending", "due", "open"]) ||
    labels[0] ||
    "unpaid"

  const partial =
    chooseCandidate(labels, ["partial", "partially_paid", "partial_paid", "in_progress"]) ||
    unpaid

  const paid =
    chooseCandidate(labels, ["paid", "fully_paid", "complete", "completed", "settled", "closed"]) ||
    partial

  cachedStatuses = { unpaid, partial, paid }
  return cachedStatuses
}

async function resolveBillStatusByAmounts(paidAmount, totalAmount) {
  const statusMap = await getBillStatusMap()

  if (Number(paidAmount) <= 0) {
    return statusMap.unpaid
  }

  if (Number(paidAmount) >= Number(totalAmount)) {
    return statusMap.paid
  }

  return statusMap.partial
}

module.exports = {
  getBillStatusMap,
  resolveBillStatusByAmounts,
}
