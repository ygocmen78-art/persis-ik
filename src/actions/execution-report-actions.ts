"use server";

import { db } from "@/db";
import { employees, garnishments } from "@/db/schema";
import { eq, asc, and, or, sql, isNull } from "drizzle-orm";

export type MonthlyExecutionPayment = {
    id: number; // garnishment id
    employeeName: string;
    employeeTc: string | null;
    fileNumber: string;
    officeName: string;
    paymentAmount: number;
    remainingAmount: number;
    priorityOrder: number;
    iban: string | null;
    creditor: string | null;
    isPaid: boolean; // true if this month's payment was already made
};

/**
 * Aylık İcra Raporu:
 * - Her personelin sadece en düşük priority_order'lı AKTİF icrasını getirir
 * - Kesinti tutarı = deduction_amount (veya kalan tutar daha azsa, kalan tutar)
 * - Ödeme yapılınca remaining_amount düşer
 * - remaining_amount <= 0 olunca icra "completed" olur → sonraki ay sıradaki icra gelir
 * - Bu ay içinde veya geçmişte gelmiş (notificationDate <= seçilen ay) icraları dahil eder
 */
export async function getMonthlyExecutionReport(year: number, month: number) {
    const monthStr = month.toString().padStart(2, "0");
    const endOfMonthStr = `${year}-${monthStr}-31`;

    // Sistemdeki tüm aktif icra dosyalarını çek, priority sırasına göre ve istenilen aya kadarki icraları filtrele
    const allGarnishments = await db
        .select({
            id: garnishments.id,
            employeeId: garnishments.employeeId,
            employeeFirstName: employees.firstName,
            employeeLastName: employees.lastName,
            employeeTc: employees.tcNumber,
            fileNumber: garnishments.fileNumber,
            officeName: garnishments.officeName,
            deductionAmount: garnishments.deductionAmount,
            totalAmount: garnishments.totalAmount,
            remainingAmount: garnishments.remainingAmount,
            priorityOrder: garnishments.priorityOrder,
            iban: garnishments.iban,
            creditor: garnishments.creditor,
            status: garnishments.status,
            notificationDate: garnishments.notificationDate,
        })
        .from(garnishments)
        .innerJoin(employees, eq(garnishments.employeeId, employees.id))
        .where(
            and(
                eq(garnishments.status, "active"),
                or(
                    isNull(garnishments.notificationDate), // In case notificationDate is empty, default assume applies
                    eq(garnishments.notificationDate, ""), // Same here
                    sql`${garnishments.notificationDate} <= ${endOfMonthStr}` // Core condition: arrived on or before report month
                )
            )
        )
        .orderBy(asc(garnishments.priorityOrder));

    // Her personel için sadece en düşük priority_order'lı icrayı al
    const firstPerEmployee = new Map<number, typeof allGarnishments[0]>();
    for (const g of allGarnishments) {
        if (!firstPerEmployee.has(g.employeeId)) {
            firstPerEmployee.set(g.employeeId, g);
        }
    }

    const results: MonthlyExecutionPayment[] = [];
    for (const g of firstPerEmployee.values()) {
        // Kesinti tutarı: deduction_amount veya kalan tutar (hangisi küçükse)
        const deduction = g.deductionAmount || 0;
        const remaining = g.remainingAmount;
        const paymentAmount = Math.min(deduction, remaining);

        results.push({
            id: g.id,
            employeeName: `${g.employeeFirstName} ${g.employeeLastName}`,
            employeeTc: g.employeeTc,
            fileNumber: g.fileNumber,
            officeName: g.officeName,
            paymentAmount,
            remainingAmount: remaining,
            priorityOrder: g.priorityOrder,
            iban: g.iban,
            creditor: g.creditor,
            isPaid: false,
        });
    }

    // Personel adına göre sırala
    results.sort((a, b) => a.employeeName.localeCompare(b.employeeName, "tr"));

    return results;
}

/**
 * Tek bir icra dosyası için ödeme yap:
 * - garnishment.remaining_amount -= deduction_amount
 * - Eğer remaining <= 0 ise status = "completed"
 */
export async function processExecutionPayment(garnishmentId: number) {
    const garnishment = await db.query.garnishments.findFirst({
        where: eq(garnishments.id, garnishmentId),
    });

    if (!garnishment) {
        throw new Error("İcra dosyası bulunamadı.");
    }

    if (garnishment.status === "completed") {
        throw new Error("Bu icra dosyası zaten tamamlanmış.");
    }

    const deduction = garnishment.deductionAmount || 0;
    const paymentAmount = Math.min(deduction, garnishment.remainingAmount);

    if (paymentAmount <= 0) {
        throw new Error("Ödenecek tutar bulunamadı.");
    }

    try {
        const newRemaining = Math.max(0, garnishment.remainingAmount - paymentAmount);
        const newStatus = newRemaining <= 0 ? "completed" : "active";

        await db
            .update(garnishments)
            .set({
                remainingAmount: newRemaining,
                status: newStatus,
            })
            .where(eq(garnishments.id, garnishmentId));

        return {
            success: true,
            message: `₺${paymentAmount.toLocaleString("tr-TR")} ödeme yapıldı. ${newStatus === "completed" ? "Dosya tamamlandı." : `Kalan: ₺${newRemaining.toLocaleString("tr-TR")}`}`,
        };
    } catch (error) {
        console.error("Ödeme işlemi hatası:", error);
        throw new Error("Ödeme işlemi sırasında bir hata oluştu.");
    }
}

/**
 * Toplu ödeme: Tüm görünen icra dosyaları için ödeme yap
 */
export async function processBulkExecutionPayment(garnishmentIds: number[]) {
    if (!garnishmentIds.length) {
        return { success: false, message: "Hiçbir ödeme seçilmedi." };
    }

    let successCount = 0;
    let failCount = 0;
    let totalPaid = 0;

    for (const id of garnishmentIds) {
        try {
            const garnishment = await db.query.garnishments.findFirst({
                where: eq(garnishments.id, id),
            });

            if (!garnishment || garnishment.status === "completed") {
                failCount++;
                continue;
            }

            const deduction = garnishment.deductionAmount || 0;
            const paymentAmount = Math.min(deduction, garnishment.remainingAmount);

            if (paymentAmount <= 0) {
                failCount++;
                continue;
            }

            const newRemaining = Math.max(0, garnishment.remainingAmount - paymentAmount);
            const newStatus = newRemaining <= 0 ? "completed" : "active";

            await db
                .update(garnishments)
                .set({
                    remainingAmount: newRemaining,
                    status: newStatus,
                })
                .where(eq(garnishments.id, id));

            totalPaid += paymentAmount;
            successCount++;
        } catch (error) {
            console.error(`Bulk payment failed for ID ${id}:`, error);
            failCount++;
        }
    }

    return {
        success: successCount > 0,
        message: `${successCount} ödeme başarıyla yapıldı. Toplam: ₺${totalPaid.toLocaleString("tr-TR")}${failCount > 0 ? `. ${failCount} ödeme başarısız.` : ""}`,
    };
}
