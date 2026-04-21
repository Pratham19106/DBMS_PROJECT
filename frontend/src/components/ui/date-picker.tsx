import * as React from "react"
import { CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function parseLocalDate(value: string): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function toLocalDateValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function DatePicker({ value, onChange, placeholder = "Select date", className, disabled }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = React.useMemo(() => parseLocalDate(value), [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between border-border/70 bg-background text-left font-normal text-foreground hover:bg-cream-muted/60",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span>{selected ? formatDateLabel(selected) : placeholder}</span>
          <CalendarDays className="h-4 w-4 text-forest/70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto rounded-xl border-border/70 bg-cream-card p-0 shadow-[0_24px_60px_-30px_rgba(26,61,42,0.65)]"
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return
            onChange(toLocalDateValue(date))
            setOpen(false)
          }}
          className="p-3"
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
