"use server"

import { db } from "@/db"
import { employees, branches, documents, isgRecords, leaves } from "@/db/schema"
import { model } from "@/lib/gemini"

export type Message = {
    role: "user" | "model";
    parts: string;
}

export async function chatWithGemini(history: Message[], message: string) {
    if (!model) {
        return { success: false, message: "Gemini API Anahtarı eksik. Lütfen ayarlardan ekleyin." }
    }

    try {
        // 1. Veritabanı Bağlamını Oluştur
        const allEmployees = await db.select().from(employees);
        const allBranches = await db.select().from(branches);
        const allLeaves = await db.select().from(leaves);

        // Veriyi sadeleştir (Hassas/gereksiz verileri çıkar)
        const contextData = {
            personeller: allEmployees.map(e => ({
                ad: `${e.firstName} ${e.lastName}`,
                departman: e.department,
                pozisyon: e.position,
                maas: e.salary,
                girisTarihi: e.startDate,
                durum: e.status
            })),
            subeler: allBranches.map(b => ({
                isim: b.name,
                adres: b.address
            })),
            izinler: allLeaves.map(l => ({
                personelId: l.employeeId,
                tur: l.type,
                baslangic: l.startDate,
                gun: l.daysCount
            }))
        };

        const systemPrompt = `
        Sen yardımcı bir İnsan Kaynakları asistanısın.
        Aşağıdaki şirket verilerine erişimin var.
        Sorulan sorulara bu verilere dayanarak cevap ver.
        Eğer sorulan bilgi verilerde yoksa, "Bilgim yok" de.
        Cevapların kısa, net ve profesyonel olsun. Türkçe konuş.
        
        Mevcut Veriler:
        ${JSON.stringify(contextData, null, 2)}
        `;

        // 2. Chat'i başlat
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: "model",
                    parts: [{ text: "Anlaşıldı. Mevcut İK verilerine hakimim. Size nasıl yardımcı olabilirim?" }]
                },
                ...history.map(h => ({
                    role: h.role,
                    parts: [{ text: h.parts }]
                }))
            ],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(message);
        const response = result.response.text();

        return { success: true, message: response }

    } catch (error: any) {
        console.error("Gemini Error:", error);
        return { success: false, message: `Hata oluştu: ${error.message || error.toString()}` }
    }
}
