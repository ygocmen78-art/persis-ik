"use server"

import { db } from "@/db"
import { garnishments } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function fixGarnishmentPriorities() {
    try {
        // Get all garnishments ordered by employee and creation date
        const allGarnishments = await db.select()
            .from(garnishments)
            .orderBy(garnishments.employeeId, asc(garnishments.createdAt))

        // Group by employee
        const byEmployee = allGarnishments.reduce((acc, g) => {
            if (!acc[g.employeeId]) acc[g.employeeId] = []
            acc[g.employeeId].push(g)
            return acc
        }, {} as Record<number, typeof allGarnishments>)

        // Update each garnishment with proper priority
        for (const employeeId in byEmployee) {
            const employeeGarnishments = byEmployee[employeeId]
            for (let i = 0; i < employeeGarnishments.length; i++) {
                await db.update(garnishments)
                    .set({ priorityOrder: i + 1 })
                    .where(eq(garnishments.id, employeeGarnishments[i].id))
            }
        }

        revalidatePath("/garnishments")
        return { success: true, message: "Öncelik sıralaması düzeltildi" }
    } catch (error) {
        console.error("Priority fix error:", error)
        return { success: false, message: "Hata oluştu" }
    }
}
