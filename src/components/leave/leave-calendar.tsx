"use client"

import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { tr } from "date-fns/locale"

interface LeaveCalendarProps {
    leaves: any[]
}

export function LeaveCalendar({ leaves }: LeaveCalendarProps) {
    const [date, setDate] = useState<Date | undefined>(new Date())

    // Convert leave ranges to a Set of disabled/highlighted days?
    // For now, let's just highlight them using modifiers.

    // We want to highlight days that have ANY leave.
    // This simple logic creates an array of all leave dates (not performant for huge datasets but fine here)
    const leaveDays = leaves.flatMap(leave => {
        const days = []
        let current = new Date(leave.startDate)
        const end = new Date(leave.endDate)

        while (current <= end) {
            days.push(new Date(current))
            current.setDate(current.getDate() + 1)
        }
        return days
    })

    return (
        <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border shadow"
            locale={tr}
            modifiers={{
                booked: leaveDays
            }}
            modifiersStyles={{
                booked: {
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    color: 'var(--primary)'
                }
            }}
        />
    )
}
