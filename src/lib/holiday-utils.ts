import { format, addDays, isSunday } from "date-fns";

// Türkiye Resmi Tatilleri (Sabit Günler)
export const FIXED_HOLIDAYS = [
    "01-01", // Yılbaşı
    "04-23", // Ulusal Egemenlik ve Çocuk Bayramı
    "05-01", // Emek ve Dayanışma Günü
    "05-19", // Atatürk'ü Anma, Gençlik ve Spor Bayramı
    "07-15", // Demokrasi ve Milli Birlik Günü
    "08-30", // Zafer Bayramı
    "10-29", // Cumhuriyet Bayramı
];

// Türkiye Dini Bayramları (Değişken Günler 2024-2027)
export const RELIGIOUS_HOLIDAYS = [
    // 2024
    "2024-04-10", "2024-04-11", "2024-04-12", // Ramazan Bayramı
    "2024-06-16", "2024-06-17", "2024-06-18", "2024-06-19", // Kurban Bayramı
    // 2025
    "2025-03-30", "2025-03-31", "2025-04-01", // Ramazan Bayramı
    "2025-06-06", "2025-06-07", "2025-06-08", "2025-06-09", // Kurban Bayramı
    // 2026
    "2026-03-20", "2026-03-21", "2026-03-22", // Ramazan Bayramı
    "2026-05-27", "2026-05-28", "2026-05-29", "2026-05-30", // Kurban Bayramı
    // 2027
    "2027-03-09", "2027-03-10", "2027-03-11", // Ramazan Bayramı
    "2027-05-16", "2027-05-17", "2027-05-18", "2027-05-19", // Kurban Bayramı
];

/**
 * Belirli bir tarihin resmi tatil veya Pazar günü (haftalık tatil) olup olmadığını kontrol eder.
 */
export function isHoliday(date: Date): boolean {
    const dateStr = format(date, "yyyy-MM-dd");
    const monthDay = format(date, "MM-dd");

    // 1. Pazar Günü (Haftalık Tatil)
    if (isSunday(date)) return true;

    // 2. Sabit Resmi Tatiller
    if (FIXED_HOLIDAYS.includes(monthDay)) return true;

    // 3. Dini Bayramlar
    if (RELIGIOUS_HOLIDAYS.includes(dateStr)) return true;

    return false;
}

/**
 * İki tarih arasındaki fiili izin gün sayısını hesaplar (Tatiller hariç).
 */
export function calculateLeaveDays(startDate: Date, endDate: Date): number {
    let count = 0;
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
        if (!isHoliday(current)) {
            count++;
        }
        current = addDays(current, 1);
    }
    return count;
}

/**
 * İzin bitişinden sonraki ilk iş gününü (İşe başlama tarihi) bulur.
 */
export function calculateReturnDate(endDate: Date): Date {
    let nextDay = addDays(new Date(endDate), 1);
    while (isHoliday(nextDay)) {
        nextDay = addDays(nextDay, 1);
    }
    return nextDay;
}
