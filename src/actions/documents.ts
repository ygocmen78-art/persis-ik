"use server"

import { db } from "@/db"
import { documents, branches } from "@/db/schema"
import { revalidatePath } from "next/cache"
import { eq, desc, isNull, and } from "drizzle-orm"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

export async function getDocuments() {
    const allDocuments = await db
        .select({
            id: documents.id,
            title: documents.title,
            type: documents.type,
            category: documents.category,
            filePath: documents.filePath,
            fileName: documents.fileName,
            fileSize: documents.fileSize,
            relatedTo: documents.relatedTo,
            branchId: documents.branchId,
            employeeId: documents.employeeId,
            createdAt: documents.createdAt,
        })
        .from(documents)
        .where(isNull(documents.employeeId))
        .orderBy(desc(documents.createdAt))

    return allDocuments
}

export async function getDocumentsWithBranches() {
    const allDocuments = await db
        .select({
            id: documents.id,
            title: documents.title,
            type: documents.type,
            category: documents.category,
            filePath: documents.filePath,
            fileName: documents.fileName,
            fileSize: documents.fileSize,
            companyName: documents.companyName,
            relatedTo: documents.relatedTo,
            branchId: documents.branchId,
            employeeId: documents.employeeId,
            createdAt: documents.createdAt,
            branchName: branches.name,
        })
        .from(documents)
        .leftJoin(branches, eq(documents.branchId, branches.id))
        .where(isNull(documents.employeeId))
        .orderBy(desc(documents.createdAt))

    return allDocuments
}

export async function getCompanyDocuments() {
    return await db
        .select()
        .from(documents)
        .where(
            and(
                isNull(documents.employeeId),
                eq(documents.relatedTo, "company")
            )
        )
        .orderBy(desc(documents.createdAt))
}

export async function getBranchDocuments(branchId: number) {
    return await db
        .select()
        .from(documents)
        .where(eq(documents.branchId, branchId))
        .orderBy(desc(documents.createdAt))
}

export async function addDocument(data: {
    title: string
    type?: string
    category?: string
    filePath: string
    fileName?: string
    fileSize?: number
    companyName?: string
    branchId?: number
    employeeId?: number
    relatedTo?: string
}) {
    try {
        await db.insert(documents).values({
            title: data.title,
            type: data.type,
            category: data.category || "other",
            filePath: data.filePath,
            fileName: data.fileName,
            fileSize: data.fileSize,
            companyName: data.companyName,
            branchId: data.branchId,
            employeeId: data.employeeId,
            relatedTo: data.relatedTo || "company",
        })
        revalidatePath("/documents")
        return { success: true, message: "Doküman başarıyla eklendi." }
    } catch (error) {
        console.error("Add document error:", error)
        return { success: false, message: "Doküman eklenirken hata oluştu." }
    }
}

export async function deleteDocument(id: number) {
    try {
        await db.delete(documents).where(eq(documents.id, id))
        revalidatePath("/documents")
        return { success: true, message: "Doküman silindi." }
    } catch (error) {
        return { success: false, message: "Silme işlemi başarısız." }
    }
}

// --- Employee Specific Document Actions ---

export async function getEmployeeDocuments(employeeId: number) {
    try {
        return await db.select()
            .from(documents)
            .where(eq(documents.employeeId, employeeId))
            .orderBy(desc(documents.createdAt))
    } catch (error) {
        console.error("Failed to fetch employee documents:", error)
        return []
    }
}

export async function uploadEmployeeDocument(formData: FormData) {
    try {
        const file = formData.get("file") as File
        const employeeIdString = formData.get("employeeId") as string
        const title = formData.get("title") as string
        const category = (formData.get("category") as string) || "other"

        if (!file || !employeeIdString || !title) {
            return { success: false, message: "Eksik bilgi gönderildi." }
        }

        const employeeId = parseInt(employeeIdString)
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Upload directory
        const uploadDir = path.join(process.cwd(), "public", "uploads", "documents")

        // Ensure directory exists
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        // Generate unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
        const ext = path.extname(file.name)
        const filename = `${employeeId}-${uniqueSuffix}${ext}`
        const filepath = path.join(uploadDir, filename)

        // Write file to disk
        await writeFile(filepath, buffer)

        // Save to database
        const relativePath = `/uploads/documents/${filename}`

        const inserted = await db.insert(documents).values({
            employeeId,
            title,
            type: ext.replace(".", "").toLowerCase(),
            category,
            filePath: relativePath,
            fileName: file.name,
            fileSize: file.size,
            relatedTo: "employee"
        }).returning()

        revalidatePath(`/employees/${employeeId}`)
        return { success: true, message: "Evrak başarıyla yüklendi.", document: inserted[0] }
    } catch (error: any) {
        console.error("Upload document error:", error)
        return { success: false, message: `Evrak yüklenirken hata oluştu: ${error.message}` }
    }
}

export async function deleteEmployeeDocument(id: number, employeeId: number) {
    try {
        const doc = await db.select().from(documents).where(eq(documents.id, id)).get()

        if (!doc) {
            return { success: false, message: "Evrak bulunamadı." }
        }

        // Delete from database
        await db.delete(documents).where(eq(documents.id, id))

        // Delete from disk
        if (doc.filePath) {
            const absolutePath = path.join(process.cwd(), "public", doc.filePath.replace(/^\//, ""))
            if (existsSync(absolutePath)) {
                await unlink(absolutePath)
            }
        }

        revalidatePath(`/employees/${employeeId}`)
        return { success: true, message: "Evrak başarıyla silindi." }
    } catch (error: any) {
        console.error("Delete document error:", error)
        return { success: false, message: "Evrak silinirken hata oluştu." }
    }
}
