"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  setDate?: (date: Date) => void
  disabled?: boolean
}

export function DatePicker({ date, setDate, disabled = false }: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

  React.useEffect(() => {
    setSelectedDate(date)
  }, [date])

  const handleSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate)
    if (setDate && newDate) {
      setDate(newDate)
    }
  }

  const isValidDate = selectedDate instanceof Date && !isNaN(selectedDate.getTime())

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
          {isValidDate
            ? format(selectedDate, "dd/MM/yyyy", { locale: es })
            : <span>Seleccionar fecha</span>
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          locale={es}
          disabled={disabled ? () => true : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}
