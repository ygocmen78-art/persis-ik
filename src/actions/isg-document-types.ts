"use server"

import { db } from "@/db"
import { isgDocumentTypes } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getDocumentTypes() {
    return await db.select().from(isgDocumentTypes)
}

export async function addDocumentType(data: {
    name: string
    validityMonths: number
    description?: string
}) {
    try {
        await db.insert(isgDocumentTypes).values(data)
        revalidatePath("/settings/document-types")
        revalidatePath("/isg")
        return { success: true, message: "Evrak türü eklendi." }
    } catch (error) {
        console.error("Add document type error:", error)
        return { success: false, message: "Evrak türü eklenirken hata oluştu." }
    }
}

export async function updateDocumentType(id: number, data: {
    name?: string
    validityMonths?: number
    description?: string
}) {
    try {
        await db.update(isgDocumentTypes)
            .set(data)
            .where(eq(isgDocumentTypes.id, id))
        revalidatePath("/settings/document-types")
        revalidatePath("/isg")
        return { success: true, message: "Evrak türü güncellendi." }
    } catch (error) {
        console.error("Update document type error:", error)
        return { success: false, message: "Evrak türü güncellenirken hata oluştu." }
    }
}

export async function deleteDocumentType(id: number) {
    try {
        await db.delete(isgDocumentTypes).where(eq(isgDocumentTypes.id, id))
        revalidatePath("/settings/document-types")
        revalidatePath("/isg")
        return { success: true, message: "Evrak türü silindi." }
    } catch (error) {
        console.error("Delete document type error:", error)
        return { success: false, message: "Evrak türü silinirken hata oluştu." }
    }
}
