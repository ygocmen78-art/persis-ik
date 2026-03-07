"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

const SECRET_SALT = "Ahmet-Persis-2026-XyZ-Professional-Edition";

// The core algorithm reproducing the keygen functionality
export async function generateLicenseKey(vkn: string): Promise<string> {
    const hash = crypto.createHash('sha256').update(`${vkn}-${SECRET_SALT}`).digest('hex');
    const shortHash = hash.substring(0, 16).toUpperCase();
    return `${shortHash.slice(0, 4)}-${shortHash.slice(4, 8)}-${shortHash.slice(8, 12)}-${shortHash.slice(12, 16)}`;
}

export async function checkLicenseStatus() {
    const activatedSetting = db.select().from(settings).where(eq(settings.key, "license_activated")).get();
    return activatedSetting?.value === "true";
}

export async function activateLicense(vkn: string, attemptKey: string) {
    // Basic validation
    if (!vkn || !attemptKey) {
        return { success: false, message: "VKN ve Aktivasyon Anahtarı boş bırakılamaz." };
    }

    // Mathematical verification
    const correctKey = await generateLicenseKey(vkn);

    // Normalize format (remove dashes, uppercase)
    const normalizedAttempt = attemptKey.replace(/-/g, '').toUpperCase();
    const normalizedCorrect = correctKey.replace(/-/g, '').toUpperCase();

    if (normalizedAttempt === normalizedCorrect) {
        // Verification Passed - Save to settings table
        const prev = db.select().from(settings).where(eq(settings.key, "license_activated")).get();
        if (prev) {
            db.update(settings).set({ value: "true" }).where(eq(settings.key, "license_activated")).run();
        } else {
            db.insert(settings).values({ key: "license_activated", value: "true" }).run();
        }

        // Save VKN as well
        const prevVKN = db.select().from(settings).where(eq(settings.key, "license_vkn")).get();
        if (prevVKN) {
            db.update(settings).set({ value: vkn }).where(eq(settings.key, "license_vkn")).run();
        } else {
            db.insert(settings).values({ key: "license_vkn", value: vkn }).run();
        }

        revalidatePath('/');
        return { success: true, message: "Yazılım Başarıyla Aktive Edildi! Teşekkürler." };
    }

    return {
        success: false,
        message: "Hatalı veya sahte bir aktivasyon anahtarı girdiniz. Lütfen geçerli bir anahtar edinin."
    };
}
