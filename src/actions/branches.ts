"use server"

import { db } from "@/db"
import { branches, employees } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getBranches() {
    const allBranches = await db.select().from(branches)
    return allBranches
}

export async function addBranch(data: {
    name: string; address?: string; sgk_number?: string;
    sgk_system_password?: string; sgk_workplace_password?: string;
    sgk_user_code?: string; sgk_code?: string;
}) {
    const result = await db.insert(branches).values({
        name: data.name,
        address: data.address,
        sgk_number: data.sgk_number,
        sgk_system_password: data.sgk_system_password,
        sgk_workplace_password: data.sgk_workplace_password,
        sgk_user_code: data.sgk_user_code,
        sgk_code: data.sgk_code,
    }).returning({ id: branches.id }).get()

    revalidatePath("/settings")
    revalidatePath("/employees") // Revalidate employees list as well
    revalidatePath("/employees/new")
    revalidatePath("/sgk") // Always revalidate SGK page on branch credential change

    return { success: true, id: result.id, message: "İş yeri başarıyla eklendi." }
}

export async function deleteBranch(id: number) {
    try {
        // Personel kontrolü
        const employeesInBranch = await db.select().from(employees).where(eq(employees.branchId, id));

        if (employeesInBranch.length > 0) {
            return { success: false, message: "Bu iş yerine bağlı personeller var. Önce onları silin veya başka yere taşıyın." }
        }

        await db.delete(branches).where(eq(branches.id, id))
        revalidatePath("/settings")
        revalidatePath("/employees/new")
        return { success: true, message: "İş yeri başarıyla silindi." }
    } catch (error) {
        console.error("Delete branch error:", error)
        return { success: false, message: "İş yeri silinirken bir hata oluştu." }
    }
}

export async function updateBranch(id: number, data: {
    name: string; address?: string; sgk_number?: string;
    sgk_system_password?: string; sgk_workplace_password?: string;
    sgk_user_code?: string; sgk_code?: string;
}) {
    try {
        await db.update(branches).set({
            name: data.name,
            address: data.address,
            sgk_number: data.sgk_number,
            sgk_system_password: data.sgk_system_password,
            sgk_workplace_password: data.sgk_workplace_password,
            sgk_user_code: data.sgk_user_code,
            sgk_code: data.sgk_code,
        }).where(eq(branches.id, id))

        revalidatePath("/settings")
        revalidatePath("/employees")
        revalidatePath("/employees/new")
        revalidatePath("/sgk") // Ensure SGK page refreshes

        return { success: true, message: "İş yeri güncellendi." }
    } catch (error) {
        console.error("Update branch error:", error)
        return { success: false, message: "İş yeri güncellenirken hata oluştu." }
    }
}
