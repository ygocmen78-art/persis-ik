"use server"

import { db } from "@/db"
import { isgRecords, isgDocumentTypes, employees } from "@/db/schema"
import { eq, and, lte, gte } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { addMonths, format, differenceInDays } from "date-fns"
import { unlink } from "fs/promises"
import path from "path"

export async function addISGRecord(data: {
    employeeId: number
    documentTypeId: number
    documentDate: string
    filePath: string
    fileType: string
}) {
    try {
        console.log("addISGRecord called with data:", data)

        // Get document type to calculate expiry date
        const docType = await db.select()
            .from(isgDocumentTypes)
            .where(eq(isgDocumentTypes.id, data.documentTypeId))
            .get()

        console.log("Document type found:", docType)

        if (!docType) {
            return { success: false, message: "Evrak türü bulunamadı." }
        }

        // Calculate expiry date
        const documentDate = new Date(data.documentDate)
        const expiryDate = addMonths(documentDate, docType.validityMonths || 12)

        console.log("Inserting record with values:", {
            employeeId: data.employeeId,
            documentTypeId: data.documentTypeId,
            documentDate: data.documentDate,
            expiryDate: expiryDate.toISOString(),
            filePath: data.filePath,
            fileType: data.fileType,
            notificationStatus: "pending",
        })

        await db.insert(isgRecords).values({
            employeeId: data.employeeId,
            documentTypeId: data.documentTypeId,
            documentDate: data.documentDate,
            expiryDate: expiryDate.toISOString(),
            filePath: data.filePath,
            fileType: data.fileType,
            notificationStatus: "pending",
        })

        revalidatePath("/isg")
        return { success: true, message: "İSG kaydı eklendi." }
    } catch (error) {
        console.error("Add ISG record error DETAILS:", error)
        console.error("Error message:", error instanceof Error ? error.message : String(error))
        console.error("Error stack:", error instanceof Error ? error.stack : "No stack")
        return { success: false, message: `İSG kaydı eklenirken hata oluştu: ${error instanceof Error ? error.message : String(error)}` }
    }
}

export async function getISGRecords(employeeId?: number) {
    const query = db.select({
        id: isgRecords.id,
        employeeId: isgRecords.employeeId,
        employeeName: employees.firstName,
        employeeSurname: employees.lastName,
        documentTypeId: isgRecords.documentTypeId,
        documentTypeName: isgDocumentTypes.name,
        documentDate: isgRecords.documentDate,
        expiryDate: isgRecords.expiryDate,
        filePath: isgRecords.filePath,
        fileType: isgRecords.fileType,
        notificationStatus: isgRecords.notificationStatus,
    })
        .from(isgRecords)
        .leftJoin(employees, eq(isgRecords.employeeId, employees.id))
        .leftJoin(isgDocumentTypes, eq(isgRecords.documentTypeId, isgDocumentTypes.id))

    if (employeeId) {
        return await query.where(eq(isgRecords.employeeId, employeeId))
    }

    return await query
}

export async function deleteISGRecord(id: number) {
    try {
        // Get record to delete file
        const record = await db.select()
            .from(isgRecords)
            .where(eq(isgRecords.id, id))
            .get()

        if (record?.filePath) {
            try {
                const filepath = path.join(process.cwd(), 'public', record.filePath)
                await unlink(filepath)
            } catch (error) {
                console.error("File deletion error:", error)
            }
        }

        await db.delete(isgRecords).where(eq(isgRecords.id, id))
        revalidatePath("/isg")
        return { success: true, message: "İSG kaydı silindi." }
    } catch (error) {
        console.error("Delete ISG record error:", error)
        return { success: false, message: "İSG kaydı silinirken hata oluştu." }
    }
}

export async function updateISGRecord(id: number, data: {
    employeeId: number
    documentTypeId: number
    documentDate: string
    filePath?: string
    fileType?: string
}) {
    try {
        // Get document type to calculate expiry date
        const docType = await db.select()
            .from(isgDocumentTypes)
            .where(eq(isgDocumentTypes.id, data.documentTypeId))
            .get()

        if (!docType) {
            return { success: false, message: "Evrak türü bulunamadı." }
        }

        // Calculate expiry date
        const documentDate = new Date(data.documentDate)
        const expiryDate = addMonths(documentDate, docType.validityMonths || 12)

        const updateData: any = {
            employeeId: data.employeeId,
            documentTypeId: data.documentTypeId,
            documentDate: data.documentDate,
            expiryDate: expiryDate.toISOString(),
        }

        // If a new file was uploaded, update file fields and delete old file
        if (data.filePath && data.fileType) {
            const oldRecord = await db.select()
                .from(isgRecords)
                .where(eq(isgRecords.id, id))
                .get()

            if (oldRecord?.filePath) {
                try {
                    const oldFilePath = path.join(process.cwd(), 'public', oldRecord.filePath)
                    await unlink(oldFilePath)
                } catch (error) {
                    console.error("Old file deletion error:", error)
                }
            }

            updateData.filePath = data.filePath
            updateData.fileType = data.fileType
        }

        await db.update(isgRecords)
            .set(updateData)
            .where(eq(isgRecords.id, id))

        revalidatePath("/isg")
        return { success: true, message: "İSG kaydı güncellendi." }
    } catch (error) {
        console.error("Update ISG record error:", error)
        return { success: false, message: "İSG kaydı güncellenirken hata oluştu." }
    }
}

export async function getExpiringDocuments(daysAhead: number = 30) {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    const records = await db.select({
        id: isgRecords.id,
        employeeName: employees.firstName,
        employeeSurname: employees.lastName,
        documentTypeName: isgDocumentTypes.name,
        expiryDate: isgRecords.expiryDate,
    })
        .from(isgRecords)
        .leftJoin(employees, eq(isgRecords.employeeId, employees.id))
        .leftJoin(isgDocumentTypes, eq(isgRecords.documentTypeId, isgDocumentTypes.id))
        .where(
            lte(isgRecords.expiryDate, futureDate.toISOString())
        )

    return records.map(doc => ({
        ...doc,
        status: doc.expiryDate && new Date(doc.expiryDate) < today ? 'expired' : 'expiring'
    }))
}

export async function getMissingDocuments() {
    // Get all employees
    const allEmployees = await db.select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
    }).from(employees).where(eq(employees.status, "active"))

    // Get all document types
    const allDocTypes = await db.select().from(isgDocumentTypes)

    // Get all existing records
    const existingRecords = await db.select({
        employeeId: isgRecords.employeeId,
        documentTypeId: isgRecords.documentTypeId,
    }).from(isgRecords)

    const missing: Array<{
        employeeId: number
        employeeName: string
        documentTypeId: number
        documentTypeName: string
    }> = []

    // Check each employee for each document type
    for (const emp of allEmployees) {
        for (const docType of allDocTypes) {
            const hasRecord = existingRecords.some(
                r => r.employeeId === emp.id && r.documentTypeId === docType.id
            )
            if (!hasRecord) {
                missing.push({
                    employeeId: emp.id,
                    employeeName: `${emp.firstName} ${emp.lastName}`,
                    documentTypeId: docType.id,
                    documentTypeName: docType.name,
                })
            }
        }
    }

    return missing
}
