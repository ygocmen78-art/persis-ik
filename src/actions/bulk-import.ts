"use server"

import { db } from "@/db"
import { employees, branches } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import * as XLSX from "xlsx"

// Helper to normalize strings for comparison (remove spaces, lowercase)
const normalizeParams = (str: string) => str.trim().toLowerCase();

// Helper to convert Excel Serial Date to JS ISO Date String (YYYY-MM-DD)
function excelDateToJSDate(serial: any) {
    if (!serial) return null;

    // If it's already a string like "2024-01-01" or "01.01.2024", return as is or parse
    // But basic ISO string check:
    if (typeof serial === 'string' && serial.includes('-')) return serial;

    // If it's a number (Excel Serial Date)
    if (!isNaN(serial)) {
        // Excel base date: Dec 30 1899 (usually). 
        // 25569 is the offset for 1970-01-01.
        // 86400 * 1000 milliseconds in a day.
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);

        // Check for invalid date
        if (isNaN(date_info.getTime())) return null;

        return date_info.toISOString().split('T')[0];
    }

    return String(serial);
}

export async function importEmployees(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, message: "Dosya yüklenmedi." };
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        if (jsonData.length === 0) {
            return { success: false, message: "Dosya boş veya okunamadı." };
        }

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        const errorDetails: string[] = [];

        // Cache all branches to minimize DB hits
        const allBranches = await db.select().from(branches);
        const branchMap = new Map<string, number>(); // Name -> ID

        allBranches.forEach(b => {
            branchMap.set(normalizeParams(b.name), b.id);
        });

        let rowIndex = 1; // Start from 1 for user friendly indexing (ignoring header)
        for (const row of jsonData) {
            rowIndex++;
            try {
                // Expected Headers: Ad, Soyad, Çalışma Yeri (Şube), Şirket (SGK), TC, Telefon, Departman, SGK Meslek, Maaş, IBAN, İşe Giriş
                let firstName = row["Ad"] || row["ad"];
                let lastName = row["Soyad"] || row["soyad"];
                const fullName = row["Ad Soyad"] || row["ad soyad"] || row["İsim Soyisim"];

                if (!firstName && !lastName && fullName) {
                    const parts = String(fullName).trim().split(" ");
                    if (parts.length > 1) {
                        lastName = parts.pop();
                        firstName = parts.join(" ");
                    } else {
                        firstName = parts[0];
                        lastName = "";
                    }
                } else if (firstName && !lastName) {
                    const parts = String(firstName).trim().split(" ");
                    if (parts.length > 1) {
                        lastName = parts.pop();
                        firstName = parts.join(" ");
                    }
                }

                // Field mappings
                let workBranchName = row["Çalışma Yeri (Şube)"] || row["Çalışma Yeri"] || row["Şube"] || row["sube"] || row["İş Yeri"];
                const sgkBranchName = row["Şirket (SGK)"] || row["Şirket"] || row["sirket"] || row["Resmi Şube"];
                const tcNumber = row["TC"] || row["tc"] || row["TC Kimlik"];
                const iban = row["IBAN"] || row["iban"] || row["Iban"];
                const phone = row["Telefon"] || row["telefon"];
                const department = row["Departman"] || row["departman"];
                const position = row["SGK Meslek Kodu"] || row["SGK Meslek"] || row["Meslek"] || row["Pozisyon"];
                const salary = row["Maaş"] || row["maas"];
                const startDateRaw = row["İşe Giriş"] || row["ise giris"];

                // Fallback: If Work Branch is missing but SGK Branch exists, use SGK Branch
                if (!workBranchName && sgkBranchName) {
                    workBranchName = sgkBranchName;
                }

                if (!firstName || !lastName || !workBranchName) {
                    console.warn(`Row ${rowIndex}: Missing mandatory fields.`, row);
                    errorDetails.push(`Satır ${rowIndex}: İsim, Soyisim veya Çalışma Yeri eksik.`);
                    errorCount++;
                    continue;
                }

                // 1. Handle Working Branch (Çalışma Yeri)
                let branchId = branchMap.get(normalizeParams(String(workBranchName)));
                if (!branchId) {
                    const newBranch = await db.insert(branches).values({
                        name: String(workBranchName).trim(),
                        address: "Otomatik oluşturuldu (Excel Import)"
                    }).returning({ id: branches.id }).get();
                    branchId = newBranch.id;
                    branchMap.set(normalizeParams(String(workBranchName)), branchId);
                }

                // 2. Handle SGK Branch (Şirket)
                // If not provided, default to working branch ID
                let sgkBranchId = branchId;
                if (sgkBranchName) {
                    let foundSgkId = branchMap.get(normalizeParams(String(sgkBranchName)));
                    if (!foundSgkId) {
                        const newSgkBranch = await db.insert(branches).values({
                            name: String(sgkBranchName).trim(),
                            address: "Otomatik oluşturuldu (Excel Import - SGK)"
                        }).returning({ id: branches.id }).get();
                        foundSgkId = newSgkBranch.id;
                        branchMap.set(normalizeParams(String(sgkBranchName)), foundSgkId);
                    }
                    sgkBranchId = foundSgkId;
                }

                // Upsert Logic
                if (tcNumber) {
                    const existingEmp = await db.select().from(employees).where(eq(employees.tcNumber, String(tcNumber))).get();
                    if (existingEmp) {
                        await db.update(employees).set({
                            branchId: branchId || existingEmp.branchId,
                            sgkBranchId: sgkBranchId || existingEmp.sgkBranchId,
                            department: department ? String(department) : existingEmp.department,
                            position: position ? String(position) : existingEmp.position,
                            salary: salary ? Number(salary) : existingEmp.salary,
                            iban: iban ? String(iban) : existingEmp.iban,
                            startDate: startDateRaw ? (excelDateToJSDate(startDateRaw) || existingEmp.startDate) : existingEmp.startDate,
                            phone: phone ? String(phone) : existingEmp.phone,
                            updatedAt: new Date().toISOString()
                        }).where(eq(employees.id, existingEmp.id));

                        updatedCount++;
                        continue;
                    }
                }

                // Insert New Employee
                await db.insert(employees).values({
                    branchId: branchId,
                    sgkBranchId: sgkBranchId,
                    firstName: String(firstName).trim(),
                    lastName: String(lastName).trim(),
                    tcNumber: tcNumber ? String(tcNumber).trim() : null,
                    phone: phone ? String(phone) : null,
                    department: department ? String(department) : null,
                    position: position ? String(position) : null,
                    salary: salary ? Number(salary) : 0,
                    iban: iban ? String(iban) : null,
                    startDate: startDateRaw ? (excelDateToJSDate(startDateRaw) || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
                    gender: "male", // Default
                    status: "active",
                    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`
                });

                addedCount++;

            } catch (err: any) {
                console.error(`Row ${rowIndex} error:`, err);
                errorDetails.push(`Satır ${rowIndex}: Beklenmeyen hata (${err.message}).`);
                errorCount++;
            }
        }

        revalidatePath("/employees");
        revalidatePath("/settings"); // For new branches

        let message = `${addedCount} kişi eklendi.`;
        if (updatedCount > 0) message += ` ${updatedCount} kişi güncellendi.`;
        if (errorCount > 0) {
            message += ` ${errorCount} satırda hata oluştu.`;
            if (errorDetails.length > 0) {
                // Show first 3 errors in the main message to be helpful but not overwhelming
                message += ` İlk hatalar: ${errorDetails.slice(0, 3).join(", ")}`;
            }
        }

        return { success: errorCount === 0 || addedCount > 0 || updatedCount > 0, message: message };

    } catch (error: any) {
        console.error("Import error:", error);
        return { success: false, message: `Yükleme hatası: ${error.message}` };
    }
}
