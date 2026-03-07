"use server";

import { db } from "@/db";
import { appUsers, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import crypto from "crypto";

// Basic SHA-256 Hasher for standard secure storage without needing external bcrypt packages
// Since it's a completely local app, SHA256 with a salt is perfectly adequate.
export async function hashPassword(password: string) {
    return crypto.createHash('sha256').update(password + "PERSIS_LOCAL_SALT_99").digest('hex');
}

export async function createDefaultAdmin() {
    const existingAdmins = db.select().from(appUsers).all();
    if (existingAdmins.length === 0) {
        const hashedPsw = await hashPassword("9685**");
        db.insert(appUsers).values({
            username: "admin",
            passwordHash: hashedPsw,
            role: "admin"
        }).run();
    }
}

export async function login(username: string, passwordString: string) {
    try {
        // 1. Ensure default admin exists (auto-seed)
        await createDefaultAdmin();

        // 2. Hash incoming password
        const hashedAttempt = await hashPassword(passwordString);

        // 3. Find user
        const user = db.select().from(appUsers).where(eq(appUsers.username, username)).get();

        if (!user) {
            return { success: false, message: "Kullanıcı bulunamadı." };
        }

        if (user.passwordHash !== hashedAttempt) {
            return { success: false, message: "Hatalı şifre." };
        }

        // 4. Set secure cookie
        const cookieStore = await cookies();
        cookieStore.set("persis_session", user.id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        return { success: true, message: "Giriş başarılı!" };
    } catch (e: any) {
        console.error("--- LOGIN SERVER ACTION EXCEPTION ---");
        console.error(e);
        throw new Error("Login failed internally: " + e.message);
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("persis_session");
    return { success: true };
}

export async function checkAuth() {
    const cookieStore = await cookies();
    const session = cookieStore.get("persis_session");
    if (!session || !session.value) {
        return false;
    }
    const user = db.select().from(appUsers).where(eq(appUsers.id, parseInt(session.value))).get();
    return !!user;
}
