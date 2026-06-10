
import { differenceInYears, differenceInDays } from "date-fns"

/**
 * 4857 Sayılı İş Kanunu Madde 53
 * - 1-5 yıl kıdem  : 14 iş günü
 * - 6-15 yıl kıdem : 20 iş günü
 * - 16+ yıl kıdem  : 26 iş günü
 * - 18 yaşından küçük VEYA 50 yaşından büyük çalışanlar: her yıl için minimum 20 gün
 */
export function calculateAnnualLeaveEntitlement(birthDate: Date, startDate: Date): number {
    const today = new Date()
    const totalYearsOfService = differenceInYears(today, startDate)
    const age = differenceInYears(today, birthDate)

    if (totalYearsOfService < 1) {
        return 0
    }

    // 18 yaş altı veya 50 yaş üstü ise her yıl en az 20 gün (İş Kanunu Madde 53/4)
    const ageQualifiesForMinimum20 = age < 18 || age >= 50

    let totalEarnedDays = 0

    for (let year = 1; year <= totalYearsOfService; year++) {
        let daysForYear: number
        if (year <= 5) {
            daysForYear = 14
        } else if (year <= 15) {
            daysForYear = 20
        } else {
            daysForYear = 26
        }

        // Yaş koşulu varsa minimum 20 gün garantisi uygula
        if (ageQualifiesForMinimum20) {
            daysForYear = Math.max(daysForYear, 20)
        }

        totalEarnedDays += daysForYear
    }

    return totalEarnedDays
}

/**
 * Mevcut yıl için izin hakkını döner (gösterim amaçlı)
 */
export function calculateCurrentYearEntitlement(birthDate: Date, startDate: Date): number {
    const today = new Date()
    const yearsOfService = differenceInYears(today, startDate)
    const age = differenceInYears(today, birthDate)

    if (yearsOfService < 1) return 0

    let days: number
    if (yearsOfService <= 5) {
        days = 14
    } else if (yearsOfService <= 15) {
        days = 20
    } else {
        days = 26
    }

    // 18 yaş altı veya 50 yaş üstü: minimum 20 gün
    if (age < 18 || age >= 50) {
        days = Math.max(days, 20)
    }

    return days
}
