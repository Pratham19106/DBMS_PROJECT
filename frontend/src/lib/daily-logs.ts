import {
  addDailyLog,
  getDailyLogs,
  type BackendDailyLog,
} from "@/lib/api"

export type ReceivedDailyLog = {
  id: string
  userId: string
  amount: number
  date: string
  note?: string
}

function toReceivedDailyLog(entry: BackendDailyLog): ReceivedDailyLog {
  return {
    id: entry.id,
    userId: entry.user_id,
    amount: typeof entry.amount === "number" ? entry.amount : Number(entry.amount),
    date: entry.log_date,
    note: typeof entry.note === "string" && entry.note.trim().length > 0 ? entry.note : undefined,
  }
}

export async function getReceivedLogs(userId: string): Promise<ReceivedDailyLog[]> {
  const rows = await getDailyLogs(userId, {
    logType: "received",
    limit: 500,
  })

  return rows
    .map(toReceivedDailyLog)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export async function addReceivedLog(input: {
  userId: string
  amount: number
  date: string
  note?: string
}): Promise<ReceivedDailyLog> {
  const created = await addDailyLog(input.userId, {
    logType: "received",
    amount: input.amount,
    logDate: input.date,
    note: input.note,
  })

  return toReceivedDailyLog(created)
}