"use server"

import nodemailer from "nodemailer"
import { readFileSync, existsSync } from "fs"
import path from "path"

// Mock transporter for development/demo without real SMTP credentials
// In production, replace with secure SMTP configuration
const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email", // Mock SMTP host
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: "ethereal.user@example.com", // Mock user
        pass: "ethereal.pass", // Mock password
    },
})

export async function sendDocumentEmail(data: {
    recipientEmail: string
    subject: string
    message: string
    documentTitle: string
    filePath: string // Public path, e.g., /uploads/documents/file.pdf
    documentType?: string
}) {
    try {
        console.log("Attempting to send email...", data)

        // Convert public URL directly to filesystem path
        // Remove leading slash if present to avoid absolute path confusion
        const relativePath = data.filePath.startsWith('/') ? data.filePath.slice(1) : data.filePath
        const absolutePath = path.join(process.cwd(), "public", relativePath)

        if (!existsSync(absolutePath)) {
            console.error("File not found at path:", absolutePath)
            return { success: false, message: "Dosya sunucuda bulunamadı." }
        }

        // For demo purposes, we will just log the email details
        // and simulate a successful send.
        // Uncomment the code below to attempt actual sending if SMTP is configured.

        /*
        const mailOptions = {
            from: '"Persis IK" <noreply@persis.com.tr>',
            to: data.recipientEmail,
            subject: data.subject,
            text: data.message,
            html: `<p>${data.message}</p><br><p><strong>${data.documentTitle}</strong> belgesi ektedir.</p>`,
            attachments: [
                {
                    filename: data.documentTitle + (path.extname(absolutePath) || ".pdf"),
                    path: absolutePath
                }
            ]
        }

        const info = await transporter.sendMail(mailOptions)
        console.log("Message sent: %s", info.messageId)
        */

        console.log("---------------------------------------------------")
        console.log("SIMULATED EMAIL SENDING")
        console.log("To:", data.recipientEmail)
        console.log("Subject:", data.subject)
        console.log("Message:", data.message)
        console.log("Attachment:", absolutePath)
        console.log("---------------------------------------------------")

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        return { success: true, message: "E-posta başarıyla gönderildi (Simülasyon)." }
    } catch (error: any) {
        console.error("Email sending error:", error)
        return { success: false, message: "E-posta gönderilirken hata oluştu: " + error.message }
    }
}
