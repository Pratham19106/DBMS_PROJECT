const pool = require('../db/db')
const {
    getDailyLogsForUserQuery,
    createDailyLogQuery,
    deleteDailyLogQuery,
    getUnifiedFinancialLogsForRangeQuery,
} = require('../services/dailyLogQueries')

const normalizeLogType = (value) => String(value ?? '').trim().toLowerCase()
const IST_TIMEZONE = 'Asia/Kolkata'

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatDateInIST = (date) =>
    new Intl.DateTimeFormat('en-CA', {
        timeZone: IST_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date)

const formatMonthInIST = (date) =>
    new Intl.DateTimeFormat('en-CA', {
        timeZone: IST_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
    }).format(date)

const parseDailyDate = (rawValue) => {
    const value = String(rawValue ?? '').trim()
    if (!value) {
        return formatDateInIST(new Date())
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null
    }

    return value
}

const parseMonth = (rawValue) => {
    const value = String(rawValue ?? '').trim()
    if (!value) {
        return formatMonthInIST(new Date())
    }

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
        return null
    }

    return value
}

const parseYear = (rawValue) => {
    const value = String(rawValue ?? '').trim()
    if (!value) {
        return Number(formatDateInIST(new Date()).slice(0, 4))
    }

    const year = Number(value)
    if (!Number.isInteger(year) || year < 2000 || year > 2200) {
        return null
    }

    return year
}

const addDaysToDate = (dateText, days) => {
    const date = new Date(`${dateText}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
}

const addMonthsToMonth = (monthText, months) => {
    const [yearText, monthValueText] = monthText.split('-')
    const year = Number(yearText)
    const monthIndex = Number(monthValueText) - 1
    const date = new Date(Date.UTC(year, monthIndex + months, 1))
    const nextYear = date.getUTCFullYear()
    const nextMonth = String(date.getUTCMonth() + 1).padStart(2, '0')
    return `${nextYear}-${nextMonth}`
}

const toSafeNumber = (value) => {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : 0
}

const formatTrendDirection = (series) => {
    if (series.length < 4) {
        return 'stable'
    }

    const midpoint = Math.floor(series.length / 2)
    const firstHalf = series.slice(0, midpoint)
    const secondHalf = series.slice(midpoint)

    const firstHalfNet = firstHalf.reduce((sum, entry) => sum + entry.net, 0)
    const secondHalfNet = secondHalf.reduce((sum, entry) => sum + entry.net, 0)

    if (secondHalfNet > firstHalfNet * 1.1) {
        return 'improving'
    }

    if (secondHalfNet < firstHalfNet * 0.9) {
        return 'declining'
    }

    return 'stable'
}

const getAnalyticsSelection = (view, query) => {
    if (view === 'daily') {
        const selectedDate = parseDailyDate(query.date)
        if (!selectedDate) {
            return { error: 'date must be in YYYY-MM-DD format for daily view' }
        }

        const nextDate = addDaysToDate(selectedDate, 1)
        return {
            selection: { view, date: selectedDate },
            range: {
                from: `${selectedDate} 00:00:00`,
                to: `${nextDate} 00:00:00`,
            },
            bucketSeed: Array.from({ length: 24 }, (_, hour) => ({
                bucket_key: String(hour).padStart(2, '0'),
                bucket_label: `${String(hour).padStart(2, '0')}:00`,
                received: 0,
                paid: 0,
                net: 0,
                transactions: 0,
            })),
            getBucketKey(logDate) {
                return new Intl.DateTimeFormat('en-GB', {
                    timeZone: IST_TIMEZONE,
                    hour: '2-digit',
                    hour12: false,
                }).format(logDate)
            },
        }
    }

    if (view === 'monthly') {
        const selectedMonth = parseMonth(query.month)
        if (!selectedMonth) {
            return { error: 'month must be in YYYY-MM format for monthly view' }
        }

        const [yearText, monthText] = selectedMonth.split('-')
        const year = Number(yearText)
        const monthIndex = Number(monthText) - 1
        const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
        const nextMonth = addMonthsToMonth(selectedMonth, 1)

        return {
            selection: { view, month: selectedMonth },
            range: {
                from: `${selectedMonth}-01 00:00:00`,
                to: `${nextMonth}-01 00:00:00`,
            },
            bucketSeed: Array.from({ length: daysInMonth }, (_, index) => ({
                bucket_key: String(index + 1).padStart(2, '0'),
                bucket_label: String(index + 1),
                received: 0,
                paid: 0,
                net: 0,
                transactions: 0,
            })),
            getBucketKey(logDate) {
                return new Intl.DateTimeFormat('en-GB', {
                    timeZone: IST_TIMEZONE,
                    day: '2-digit',
                }).format(logDate)
            },
        }
    }

    const selectedYear = parseYear(query.year)
    if (!selectedYear) {
        return { error: 'year must be a number between 2000 and 2200 for yearly view' }
    }

    return {
        selection: { view, year: selectedYear },
        range: {
            from: `${selectedYear}-01-01 00:00:00`,
            to: `${selectedYear + 1}-01-01 00:00:00`,
        },
        bucketSeed: monthLabels.map((label, index) => ({
            bucket_key: String(index + 1).padStart(2, '0'),
            bucket_label: label,
            received: 0,
            paid: 0,
            net: 0,
            transactions: 0,
        })),
        getBucketKey(logDate) {
            return new Intl.DateTimeFormat('en-GB', {
                timeZone: IST_TIMEZONE,
                month: '2-digit',
            }).format(logDate)
        },
    }
}

const getDailyLogAnalytics = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const viewRaw = String(req.query.view ?? 'monthly').trim().toLowerCase()
        const view = viewRaw === 'daily' || viewRaw === 'monthly' || viewRaw === 'yearly' ? viewRaw : null
        const limitRaw = Number(req.query.limit)
        const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 5000) : 3000

        if (!view) {
            const error = new Error('view must be one of: daily, monthly, yearly')
            error.status = 400
            return next(error)
        }

        const selectionMeta = getAnalyticsSelection(view, req.query)
        if (selectionMeta.error) {
            const error = new Error(selectionMeta.error)
            error.status = 400
            return next(error)
        }

        const result = await pool.query(getUnifiedFinancialLogsForRangeQuery, [
            userId,
            selectionMeta.range.from,
            selectionMeta.range.to,
            limit,
        ])

        const bucketMap = new Map(selectionMeta.bucketSeed.map((entry) => [entry.bucket_key, { ...entry }]))
        const paidByVendor = new Map()
        const paidByMode = new Map()

        const normalizedLogs = result.rows.map((row) => {
            const amount = toSafeNumber(row.amount)
            const logType = normalizeLogType(row.log_type)
            const logDate = new Date(row.log_date)

            if (!Number.isNaN(logDate.getTime())) {
                const bucketKey = selectionMeta.getBucketKey(logDate)
                const bucket = bucketMap.get(bucketKey)
                if (bucket) {
                    if (logType === 'received') {
                        bucket.received += amount
                    } else if (logType === 'paid') {
                        bucket.paid += amount
                    }
                    bucket.transactions += 1
                    bucket.net = bucket.received - bucket.paid
                }
            }

            if (logType === 'paid') {
                const vendorName = String(row.vendor_name ?? '').trim()
                if (vendorName) {
                    paidByVendor.set(vendorName, (paidByVendor.get(vendorName) ?? 0) + amount)
                }

                const paymentMode = String(row.payment_mode ?? '').trim().toUpperCase()
                if (paymentMode) {
                    paidByMode.set(paymentMode, (paidByMode.get(paymentMode) ?? 0) + amount)
                }
            }

            return {
                id: row.id,
                source: row.source,
                log_type: logType,
                amount,
                log_date: row.log_date,
                note: row.note,
                vendor_name: row.vendor_name,
                bill_id: row.bill_id,
                payment_mode: row.payment_mode,
            }
        })

        const series = Array.from(bucketMap.values())
        const totalReceived = series.reduce((sum, entry) => sum + entry.received, 0)
        const totalPaid = series.reduce((sum, entry) => sum + entry.paid, 0)
        const netBalance = totalReceived - totalPaid
        const totalTransactions = normalizedLogs.length
        const profitableBuckets = series.filter((entry) => entry.net > 0).length
        const lossBuckets = series.filter((entry) => entry.net < 0).length

        const topVendor = Array.from(paidByVendor.entries())
            .map(([name, amount]) => ({ name, amount }))
            .sort((left, right) => right.amount - left.amount)[0] ?? null

        const paymentModeBreakdown = Array.from(paidByMode.entries())
            .map(([mode, amount]) => ({ mode, amount }))
            .sort((left, right) => right.amount - left.amount)

        const bestInflowBucket = series.reduce((best, current) =>
            current.received > best.received ? current : best
            , series[0] ?? null)

        const heaviestOutflowBucket = series.reduce((best, current) =>
            current.paid > best.paid ? current : best
            , series[0] ?? null)

        const insights = []

        if (netBalance >= 0) {
            insights.push({
                type: 'good',
                title: 'Positive cashflow in selected period',
                detail: `Inflow is ahead by Rs ${netBalance.toLocaleString('en-IN')}. Keep this cushion for upcoming bills.`,
            })
        } else {
            insights.push({
                type: 'warning',
                title: 'Outflow exceeded inflow',
                detail: `You spent Rs ${Math.abs(netBalance).toLocaleString('en-IN')} more than received. Consider spreading high-value payments.`,
            })
        }

        if (bestInflowBucket && heaviestOutflowBucket) {
            insights.push({
                type: 'neutral',
                title: 'Cash movement concentration',
                detail: `Peak inflow: ${bestInflowBucket.bucket_label} (Rs ${bestInflowBucket.received.toLocaleString('en-IN')}), peak outflow: ${heaviestOutflowBucket.bucket_label} (Rs ${heaviestOutflowBucket.paid.toLocaleString('en-IN')}).`,
            })
        }

        if (topVendor && totalPaid > 0) {
            const concentration = Math.round((topVendor.amount / totalPaid) * 100)
            insights.push({
                type: concentration >= 45 ? 'warning' : 'good',
                title: 'Vendor spend concentration',
                detail: `${topVendor.name} accounts for ${concentration}% of total paid amount in this period.`,
            })
        }

        if (paymentModeBreakdown.length > 0 && totalPaid > 0) {
            const topMode = paymentModeBreakdown[0]
            const topModeShare = Math.round((topMode.amount / totalPaid) * 100)
            insights.push({
                type: 'neutral',
                title: 'Preferred payment mode',
                detail: `${topMode.mode} contributed ${topModeShare}% of total outgoing amount.`,
            })
        }

        return res.status(200).json({
            view,
            selection: selectionMeta.selection,
            range: selectionMeta.range,
            summary: {
                total_received: totalReceived,
                total_paid: totalPaid,
                net_balance: netBalance,
                transaction_count: totalTransactions,
                profitable_buckets: profitableBuckets,
                loss_buckets: lossBuckets,
                trend_direction: formatTrendDirection(series),
            },
            series,
            top_vendor: topVendor,
            payment_modes: paymentModeBreakdown,
            insights: insights.slice(0, 4),
            logs: normalizedLogs,
        })
    } catch (err) {
        return next(err)
    }
}

const getDailyLogsForUser = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const logTypeRaw = req.query.log_type
        const fromDateRaw = req.query.from_date
        const toDateRaw = req.query.to_date
        const limitRaw = Number(req.query.limit)

        const logType = logTypeRaw ? normalizeLogType(logTypeRaw) : null
        const fromDate = fromDateRaw ? new Date(String(fromDateRaw)) : null
        const toDate = toDateRaw ? new Date(String(toDateRaw)) : null
        const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 200

        if (logType && logType !== 'received' && logType !== 'paid' && logType !== 'commodity') {
            const error = new Error('log_type must be one of: received, paid, commodity')
            error.status = 400
            return next(error)
        }

        if (fromDate && Number.isNaN(fromDate.getTime())) {
            const error = new Error('from_date must be a valid date')
            error.status = 400
            return next(error)
        }

        if (toDate && Number.isNaN(toDate.getTime())) {
            const error = new Error('to_date must be a valid date')
            error.status = 400
            return next(error)
        }

        const result = await pool.query(getDailyLogsForUserQuery, [
            userId,
            logType,
            fromDate,
            toDate,
            limit,
        ])

        return res.status(200).json({ daily_logs: result.rows })
    } catch (err) {
        return next(err)
    }
}

const createDailyLog = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const { log_type, amount, log_date, note } = req.body

        const normalizedLogType = normalizeLogType(log_type)
        if (normalizedLogType !== 'received' && normalizedLogType !== 'paid' && normalizedLogType !== 'commodity') {
            const error = new Error('log_type must be one of: received, paid, commodity')
            error.status = 400
            return next(error)
        }

        const numericAmount = Number(amount)
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            const error = new Error('amount must be a positive number')
            error.status = 400
            return next(error)
        }

        const parsedLogDate = log_date ? new Date(log_date) : new Date()
        if (Number.isNaN(parsedLogDate.getTime())) {
            const error = new Error('log_date must be a valid date')
            error.status = 400
            return next(error)
        }

        const normalizedNote = typeof note === 'string' && note.trim().length > 0 ? note.trim() : null

        const result = await pool.query(createDailyLogQuery, [
            userId,
            normalizedLogType,
            Math.round(numericAmount),
            parsedLogDate,
            normalizedNote,
        ])

        return res.status(201).json({
            success: true,
            msg: 'Daily log created successfully',
            daily_log: result.rows[0],
        })
    } catch (err) {
        return next(err)
    }
}

const deleteDailyLog = async (req, res, next) => {
    try {
        const userId = req.params.userId
        const logId = req.params.logId

        const result = await pool.query(deleteDailyLogQuery, [logId, userId])
        if (result.rows.length === 0) {
            const error = new Error('Daily log not found')
            error.status = 404
            return next(error)
        }

        return res.status(200).json({
            success: true,
            msg: 'Daily log deleted successfully',
        })
    } catch (err) {
        return next(err)
    }
}

module.exports = {
    getDailyLogsForUser,
    createDailyLog,
    deleteDailyLog,
    getDailyLogAnalytics,
}
