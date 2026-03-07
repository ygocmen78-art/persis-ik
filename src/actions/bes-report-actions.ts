"use server";

import { db } from "@/db";
import { employees, branches } from "@/db/schema";
import { and, eq, ne, or, isNull } from "drizzle-orm";

const BES_RATE = 0.03; // %3

export type MonthlyBesReport = {
    id: number;
    employeeName: string;
    tcNumber: string | null;
    branchName: string | null;
    besStatus: string;
    grossSalary: number;
    besAmount: number;
};

export type BesFilterType = "auto" | "voluntary" | "all";

export async function getMonthlyBesReport(year: number, month: number, filterType: BesFilterType = "auto") {
    // If filterType is "voluntary", we should also match nulls and empty strings (since voluntary is the default)
    // If filterType is "all", match auto, voluntary, null, or empty string.
    let besFilter;
    if (filterType === "all") {
        besFilter = or(
            eq(employees.besStatus, "auto"),
            eq(employees.besStatus, "voluntary"),
            isNull(employees.besStatus),
            eq(employees.besStatus, ""),
            eq(employees.besStatus, "none") // Include none when 'all' is explicitly requested
        );
    } else if (filterType === "auto") {
        // "Zorunlu" filter -> Everyone who is explicitly "auto", or has no status (null/"")
        // But EXCLUDE "voluntary" and "none" (exited)
        besFilter = or(
            eq(employees.besStatus, "auto"),
            isNull(employees.besStatus),
            eq(employees.besStatus, "")
        );
    } else if (filterType === "voluntary") {
        besFilter = or(
            eq(employees.besStatus, "voluntary"),
            isNull(employees.besStatus),
            eq(employees.besStatus, "")
        );
    } else {
        besFilter = eq(employees.besStatus, filterType);
    }

    const results = await db
        .select({
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            tcNumber: employees.tcNumber,
            branchName: branches.name,
            besStatus: employees.besStatus,
            grossSalary: employees.grossSalary,
            salary: employees.salary,
            status: employees.status,
            startDate: employees.startDate,
            terminationDate: employees.terminationDate,
            birthDate: employees.birthDate,
        })
        .from(employees)
        .leftJoin(branches, eq(employees.branchId, branches.id))
        .where(
            and(
                eq(employees.status, "active"),
                besFilter!
            )
        )
        .orderBy(employees.firstName, employees.lastName);

    console.log(`BES Query Results Count: ${results.length}`);
    if (results.length > 0) {
        console.log("Sample Employee:", results[0].firstName, results[0].status, results[0].startDate);
    }

    // Filter employees who were active during the selected month
    const monthStart = `${year}-${month.toString().padStart(2, "0")}-01`;
    const monthEnd = `${year}-${month.toString().padStart(2, "0")}-31`;

    const filtered = results
        .filter((emp) => {
            if (emp.startDate && emp.startDate > monthEnd) {
                console.log(`Filtered out ${emp.firstName} ${emp.lastName} due to startDate ${emp.startDate} > ${monthEnd}`);
                return false;
            }
            if (emp.terminationDate && emp.terminationDate < monthStart) {
                console.log(`Filtered out ${emp.firstName} ${emp.lastName} due to termDate ${emp.terminationDate} < ${monthStart}`);
                return false;
            }

            // Yaş Filtresi - Zorunlular için (18 - 45 yaş arası)
            if (filterType === "auto" && emp.birthDate) {
                const birth = new Date(emp.birthDate);
                // Ay sonuna göre yaşı hesapla
                const reportDate = new Date(year, month - 1, 31);

                let age = reportDate.getFullYear() - birth.getFullYear();
                const m = reportDate.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && reportDate.getDate() < birth.getDate())) {
                    age--;
                }

                // 18 yaşını doldurmuş VE 45 yaşını aşmamış olacak
                if (age < 18 || age >= 45) {
                    return false;
                }
            }

            return true;
        })
        .map((r) => {
            // Sadece brüt maaş üzerinden hesapla
            const grossSalary = r.grossSalary || 0;
            return {
                id: r.id,
                employeeName: `${r.firstName} ${r.lastName}`,
                tcNumber: r.tcNumber,
                branchName: r.branchName,
                besStatus: r.besStatus || "auto",
                grossSalary,
                besAmount: grossSalary * BES_RATE,
            };
        });

    console.log(`Filtered BES Count: ${filtered.length}`);
    return filtered;
}

/**
 * Toplu BES'ten çıkış: Seçilen personellerin besStatus'unu "none" yapar
 */
export async function exitFromBes(employeeIds: number[]) {
    if (!employeeIds.length) {
        return { success: false, message: "Hiçbir personel seçilmedi." };
    }

    let successCount = 0;
    for (const id of employeeIds) {
        try {
            await db
                .update(employees)
                .set({ besStatus: "none", updatedAt: new Date().toISOString() })
                .where(eq(employees.id, id));
            successCount++;
        } catch (error) {
            console.error(`BES exit failed for ID ${id}:`, error);
        }
    }

    return {
        success: successCount > 0,
        message: `${successCount} personel BES'ten çıkarıldı.`,
    };
}
