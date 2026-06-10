"use server"

import { db } from "@/db"
import { settings } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getTheme() {
    try {
        const result = await db.select().from(settings).where(eq(settings.key, "theme")).get()
        return result?.value || "violet"
    } catch (e) {
        console.error("Error getting theme:", e)
        return "violet"
    }
}

export async function updateTheme(themeName: string) {
    try {
        await db.insert(settings)
            .values({ key: "theme", value: themeName })
            .onConflictDoUpdate({
                target: settings.key,
                set: { value: themeName }
            })

        revalidatePath("/")
        return { success: true }
    } catch (e) {
        console.error("Error updating theme:", e)
        return { success: false, error: e }
    }
}

// --- SGK Credential Management ---
export type SgkCredentials = {
    username: string;
    systemPassword: string;
    workplacePassword: string;
    code: string;
    userCode: string;
};

export async function getSgkCredentials(): Promise<SgkCredentials> {
    try {
        const result = await db.select().from(settings).where(eq(settings.key, "sgk_credentials")).get();
        if (result?.value) {
            return JSON.parse(result.value);
        }
        return { username: "", systemPassword: "", workplacePassword: "", code: "", userCode: "" };
    } catch (e) {
        console.error("Error getting SGK credentials:", e);
        return { username: "", systemPassword: "", workplacePassword: "", code: "", userCode: "" };
    }
}

export async function saveSgkCredentials(credentials: SgkCredentials) {
    try {
        await db.insert(settings)
            .values({ key: "sgk_credentials", value: JSON.stringify(credentials) })
            .onConflictDoUpdate({
                target: settings.key,
                set: { value: JSON.stringify(credentials) }
            });

        revalidatePath("/settings");
        revalidatePath("/sgk");
        return { success: true, message: "SGK şifreleri kaydedildi." };
    } catch (e) {
        console.error("Error saving SGK credentials:", e);
        return { success: false, message: "SGK şifreleri kaydedilemedi." };
    }
}

// --- Meslek Kodları ---
export async function getCustomOccupationCodes() {
    const { db } = await import("@/db")
    const { customOccupationCodes } = await import("@/db/schema")
    return db.select().from(customOccupationCodes).orderBy(customOccupationCodes.code)
}

export async function addCustomOccupationCode(code: string, description?: string) {
    const { db } = await import("@/db")
    const { customOccupationCodes } = await import("@/db/schema")
    try {
        await db.insert(customOccupationCodes).values({ code: code.trim(), description: description?.trim() || null })
        revalidatePath("/settings")
        revalidatePath("/employees")
        return { success: true }
    } catch(e) {
        return { success: false, message: "Kod eklenemedi." }
    }
}

export async function deleteCustomOccupationCode(id: number) {
    const { db } = await import("@/db")
    const { customOccupationCodes } = await import("@/db/schema")
    await db.delete(customOccupationCodes).where(eq(customOccupationCodes.id, id))
    revalidatePath("/settings")
    revalidatePath("/employees")
    return { success: true }
}

// --- Yetkili Kullanıcı (Rapor Sorgulama için) ---
export type AuthorizedUser = {
    userCode: string;
    userCodeSuffix: string;
    password: string;
};

export async function getAuthorizedUser(): Promise<AuthorizedUser> {
    try {
        const result = await db.select().from(settings).where(eq(settings.key, "authorized_user")).get();
        if (result?.value) return JSON.parse(result.value);
        return { userCode: "", userCodeSuffix: "", password: "" };
    } catch (e) {
        return { userCode: "", userCodeSuffix: "", password: "" };
    }
}

export async function saveAuthorizedUser(data: AuthorizedUser) {
    try {
        await db.insert(settings)
            .values({ key: "authorized_user", value: JSON.stringify(data) })
            .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(data) } });
        revalidatePath("/settings");
        revalidatePath("/sgk");
        return { success: true, message: "Yetkili kullanıcı kaydedildi." };
    } catch (e) {
        return { success: false, message: "Kaydedilemedi." };
    }
}
