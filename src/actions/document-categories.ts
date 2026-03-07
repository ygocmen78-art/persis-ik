"use server"

import { db } from "@/db"
import { documentCategories } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getDocumentCategories() {
    try {
        return await db.select().from(documentCategories).orderBy(documentCategories.name)
    } catch (error) {
        console.error("Failed to fetch document categories:", error)
        return []
    }
}

export async function addDocumentCategory(name: string) {
    try {
        if (!name || name.trim() === "") {
            return { success: false, message: "Kategori adı boş olamaz." }
        }

        const formattedName = name.trim()

        // Check if exists
        const existing = await db.select()
            .from(documentCategories)
            .where(eq(documentCategories.name, formattedName))
            .get()

        if (existing) {
            return { success: false, message: "Bu kategori zaten mevcut." }
        }

        const inserted = await db.insert(documentCategories).values({
            name: formattedName
        }).returning()

        revalidatePath("/employees")
        return { success: true, message: "Kategori eklendi.", category: inserted[0] }
    } catch (error: any) {
        console.error("Add category error:", error)
        return { success: false, message: `Kategori eklenirken hata: ${error.message}` }
    }
}

export async function deleteDocumentCategory(id: number) {
    try {
        await db.delete(documentCategories).where(eq(documentCategories.id, id))
        revalidatePath("/employees")
        return { success: true, message: "Kategori silindi." }
    } catch (error) {
        console.error("Delete category error:", error)
        return { success: false, message: "Kategori silinemedi (Belki kullanımda olabilir)." }
    }
}
