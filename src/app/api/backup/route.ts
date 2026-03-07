import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
    try {
        const dbDirectory = process.env.USERDATA_PATH || process.cwd()
        const dbPath = path.join(dbDirectory, "sqlite.db")

        if (!fs.existsSync(dbPath)) {
            return NextResponse.json({ error: "Database file not found" }, { status: 404 })
        }

        const fileBuffer = fs.readFileSync(dbPath)

        return new Response(fileBuffer, {
            headers: {
                "Content-Disposition": `attachment; filename="hrapp_backup_${new Date().toISOString().split('T')[0]}.db"`,
                "Content-Type": "application/octet-stream",
            },
        })
    } catch (error) {
        console.error("Backup error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
