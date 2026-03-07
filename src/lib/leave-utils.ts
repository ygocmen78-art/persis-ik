
import { differenceInYears, differenceInDays } from "date-fns"

export function calculateAnnualLeaveEntitlement(birthDate: Date, startDate: Date): number {
    const today = new Date()
    const totalYearsOfService = differenceInYears(today, startDate)
    const age = differenceInYears(today, birthDate)

    if (totalYearsOfService < 1) {
        return 0
    }

    let totalEarnedDays = 0

    // Calculate total earned leave from hire date to today
    // Turkish Labor Law:
    // - Years 1-5: 14 days per year
    // - Years 6-15: 20 days per year
    // - Years 16+: 26 days per year

    for (let year = 1; year <= totalYearsOfService; year++) {
        if (year <= 5) {
            totalEarnedDays += 14
        } else if (year <= 15) {
            totalEarnedDays += 20
        } else {
            totalEarnedDays += 26
        }
    }

    // Special rule for age: <18 or >=50 must get at least 20 days per year
    // This is complex to apply retroactively, so we'll apply it to current year only
    // If current year entitlement is less than 20 and age qualifies, adjust
    const currentYearEntitlement = totalYearsOfService <= 5 ? 14 : totalYearsOfService <= 15 ? 20 : 26
    if ((age < 18 || age >= 50) && currentYearEntitlement < 20) {
        // Add the difference for the current year
        totalEarnedDays += (20 - currentYearEntitlement)
    }

    return totalEarnedDays
}
