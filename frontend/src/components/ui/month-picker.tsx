import * as React from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type MonthPickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function parseMonthValue(value: string): { year: number; month: number } | null {
  const [yearStr, monthStr] = value.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr)
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null
  }
  return { year, month }
}

function toMonthValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`
}

function formatMonthLabel(value: string): string {
  const parsed = parseMonthValue(value)
  if (!parsed) return "Select month"
  return `${MONTHS[parsed.month - 1]} ${parsed.year}`
}

export function MonthPicker({ value, onChange, placeholder = "Select month", className, disabled }: MonthPickerProps) {
  const [open, setOpen] = React.useState(false)
  const parsedValue = React.useMemo(() => parseMonthValue(value), [value])
  const [visibleYear, setVisibleYear] = React.useState<number>(parsedValue?.year ?? new Date().getFullYear())

  React.useEffect(() => {
    if (parsedValue?.year) {
      setVisibleYear(parsedValue.year)
    }
  }, [parsedValue?.year])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between border-border/70 bg-background text-left font-normal text-foreground hover:bg-cream-muted/60",
            !parsedValue && "text-muted-foreground",
            className,
          )}
        >
          <span>{parsedValue ? formatMonthLabel(value) : placeholder}</span>
          <CalendarDays className="h-4 w-4 text-forest/70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72.5 rounded-xl border-border/70 bg-cream-card p-3 shadow-[0_24px_60px_-30px_rgba(26,61,42,0.65)]"
      >
        <div className="mb-3 flex items-center justify-between">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => setVisibleYear((year) => year - 1)}
            className="h-8 w-8 border-border/70 bg-background text-forest hover:bg-cream-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="kv-microprint-sm text-forest">{visibleYear}</p>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => setVisibleYear((year) => year + 1)}
            className="h-8 w-8 border-border/70 bg-background text-forest hover:bg-cream-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((monthLabel, index) => {
            const month = index + 1
            const monthValue = toMonthValue(visibleYear, month)
            const isSelected = value === monthValue

            return (
              <Button
                key={monthLabel}
                type="button"
                variant="ghost"
                onClick={() => {
                  onChange(monthValue)
                  setOpen(false)
                }}
                className={cn(
                  "h-9 rounded-md border border-transparent text-sm font-medium text-forest hover:border-border/60 hover:bg-cream-muted",
                  isSelected && "border-forest/25 bg-forest text-cream hover:bg-forest-deep hover:text-cream",
                )}
              >
                {monthLabel}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
