"use server"

import { db } from "@/db"
import { appUsers } from "@/db/schema"
import { eq, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { hashPassword } from "./auth"

export async function getAppUsers() {
    try {
        return db.select({
            id: appUsers.id,
            username: appUsers.username,
            role: appUsers.role,
            createdAt: appUsers.createdAt
        }).from(appUsers).all()
    } catch (e) {
        console.error("Error fetching users:", e)
        return []
    }
}

export async function createAppUser(username: string, passwordString: string, role: string = "admin") {
    try {
        const hashedPsw = await hashPassword(passwordString)
        db.insert(appUsers).values({
            username,
            passwordHash: hashedPsw,
            role
        }).run()
        revalidatePath("/settings")
        return { success: true, message: "Kullanıcı başarıyla oluşturuldu." }
    } catch (e: any) {
        if (e.message?.includes("UNIQUE constraint failed")) {
            return { success: false, message: "Bu kullanıcı adı zaten kullanılıyor." }
        }
        return { success: false, message: "Kullanıcı oluşturulamadı." }
    }
}

export async function updateUserPassword(userId: number, passwordString: string) {
    try {
        const hashedPsw = await hashPassword(passwordString)
        db.update(appUsers)
            .set({ passwordHash: hashedPsw })
            .where(eq(appUsers.id, userId))
            .run()
        return { success: true, message: "Şifre başarıyla güncellendi." }
    } catch (e) {
        return { success: false, message: "Şifre güncellenemedi." }
    }
}

export async function deleteAppUser(userId: number) {
    try {
        // Prevent deleting the last admin if we wanted to be strict, 
        // but for now just basic delete.
        db.delete(appUsers).where(eq(appUsers.id, userId)).run()
        revalidatePath("/settings")
        return { success: true, message: "Kullanıcı silindi." }
    } catch (e) {
        return { success: false, message: "Kullanıcı silinemedi." }
    }
}
