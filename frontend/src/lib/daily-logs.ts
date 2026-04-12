export type ReceivedDailyLog = {
  id: string
  userId: string
  amount: number
  date: string
  note?: string
}

const DAILY_RECEIVED_LOGS_KEY = "daily_received_logs"

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function readAllLogs(): ReceivedDailyLog[] {
  if (!isBrowser()) {
    return []
  }

  const raw = window.localStorage.getItem(DAILY_RECEIVED_LOGS_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item): item is ReceivedDailyLog => {
      if (typeof item !== "object" || item === null) {
        return false
      }

      const candidate = item as Partial<ReceivedDailyLog>
      return (
        typeof candidate.id === "string" &&
        typeof candidate.userId === "string" &&
        typeof candidate.amount === "number" &&
        Number.isFinite(candidate.amount) &&
        typeof candidate.date === "string"
      )
    })
  } catch {
    return []
  }
}

function writeAllLogs(logs: ReceivedDailyLog[]): void {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(DAILY_RECEIVED_LOGS_KEY, JSON.stringify(logs))
}

export function getReceivedLogs(userId: string): ReceivedDailyLog[] {
  return readAllLogs()
    .filter((log) => log.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function addReceivedLog(input: {
  userId: string
  amount: number
  date: string
  note?: string
}): ReceivedDailyLog {
  const nextLog: ReceivedDailyLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    amount: input.amount,
    date: input.date,
    note: input.note?.trim() ? input.note.trim() : undefined,
  }

  const logs = readAllLogs()
  writeAllLogs([nextLog, ...logs])

  return nextLog
}