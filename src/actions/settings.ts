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
