"use server"

import fs from "fs"
import path from "path"
import { revalidatePath } from "next/cache"

export async function restoreBackup(formData: FormData) {
    try {
        const file = formData.get("file") as File
        if (!file) {
            return { success: false, message: "Dosya seçilmedi." }
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const dbDirectory = process.env.USERDATA_PATH || process.cwd();
        const dbPath = path.join(dbDirectory, "sqlite.db");
        const backupPath = path.join(dbDirectory, "sqlite.db.bak");

        // 1. Mevcut veritabanını geçici olarak yedekle
        if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, backupPath)
        }

        // 2. Yeni veritabanı dosyasını yaz
        // Not: sqlite-better3 bağlantısı açıksa burada "busy" hatası alabiliriz.
        // Ancak Next.js Server Action ortamında genellikle dosya yazılabilir.
        fs.writeFileSync(dbPath, buffer)

        revalidatePath("/", "layout")
        return { success: true, message: "Veritabanı başarıyla geri yüklendi. Değişikliklerin tam yansıması için uygulamayı yeniden başlatmanız önerilir." }
    } catch (error: any) {
        console.error("Restore error:", error)
        return { success: false, message: `Geri yükleme hatası: ${error.message}` }
    }
}
