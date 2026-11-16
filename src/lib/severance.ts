// Kıdem tazminatı tavanı (1475 sayılı İş Kanunu m. 14)
// Tavan, Hazine ve Maliye Bakanlığı "Mali ve Sosyal Haklar" genelgeleriyle
// Ocak ve Temmuz aylarında yenilenir; fesih tarihindeki dönemin tavanı uygulanır.

export interface SeveranceCeilingPeriod {
    from: string // inclusive (yyyy-mm-dd)
    to: string // inclusive (yyyy-mm-dd)
    ceiling: number
}

export const SEVERANCE_CEILING_PERIODS: SeveranceCeilingPeriod[] = [
    { from: "2023-07-01", to: "2023-12-31", ceiling: 23489.83 },
    { from: "2024-01-01", to: "2024-06-30", ceiling: 35058.58 },
    { from: "2024-07-01", to: "2024-12-31", ceiling: 41828.42 },
    { from: "2025-01-01", to: "2025-06-30", ceiling: 46655.43 },
    { from: "2025-07-01", to: "2025-12-31", ceiling: 53919.68 },
    { from: "2026-01-01", to: "2026-06-30", ceiling: 64948.77 },
    { from: "2026-07-01", to: "2026-12-31", ceiling: 73729.87 },
]

function toTime(isoDate: string, endOfDay = false): number {
    return new Date(`${isoDate}T${endOfDay ? "23:59:59" : "00:00:00"}`).getTime()
}

// Fesih (çıkış) tarihindeki dönemin kıdem tazminatı tavanını döndürür.
// Son bilinen dönemden sonraki tarihler için en güncel tavan kullanılır
// (yeni genelge yayınlanana kadar).
export function getSeveranceCeiling(date: Date): number {
    const time = date.getTime()
    const periods = SEVERANCE_CEILING_PERIODS
    const last = periods[periods.length - 1]

    if (time > toTime(last.to, true)) return last.ceiling

    for (const p of periods) {
        if (time >= toTime(p.from) && time <= toTime(p.to, true)) {
            return p.ceiling
        }
    }

    return periods[0].ceiling
}

// Dönem etiketi, ör. "01.07.2026 - 31.12.2026"
export function getSeveranceCeilingPeriodLabel(date: Date): string {
    const time = date.getTime()
    const periods = SEVERANCE_CEILING_PERIODS
    const last = periods[periods.length - 1]

    if (time > toTime(last.to, true)) {
        return `${formatTr(last.from)} sonrası (en güncel bilinen dönem)`
    }

    for (const p of periods) {
        if (time >= toTime(p.from) && time <= toTime(p.to, true)) {
            return `${formatTr(p.from)} - ${formatTr(p.to)}`
        }
    }

    return `${formatTr(periods[0].from)} öncesi`
}

function formatTr(isoDate: string): string {
    const [y, m, d] = isoDate.split("-")
    return `${d}.${m}.${y}`
}
