import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only PDF, JPG, and PNG are allowed.' }, { status: 400 })
        }

        // Create uploads directory if it doesn't exist
        // Use UPLOAD_BASE env var (set by Electron main process) or fallback for dev
        console.log('[upload] UPLOAD_BASE:', process.env.UPLOAD_BASE)
        console.log('[upload] process.cwd():', process.cwd())
        const uploadsDir = process.env.UPLOAD_BASE
            ? path.join(process.env.UPLOAD_BASE, 'isg')
            : path.join(process.cwd(), 'public', 'uploads', 'isg')
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true })
        }

        // Generate unique filename
        const timestamp = Date.now()
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `${timestamp}_${originalName}`
        const filepath = path.join(uploadsDir, filename)

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filepath, buffer)

        // Return the public URL
        const publicUrl = `/uploads/isg/${filename}`

        // For PDFs, we'll use a thumbnail path that points to the PDF itself
        // The client will render it in a small iframe or use PDF.js
        let thumbnailUrl = publicUrl

        if (file.type === 'application/pdf') {
            // PDF thumbnail will be handled client-side with iframe
            thumbnailUrl = publicUrl
        }

        return NextResponse.json({
            success: true,
            filePath: publicUrl,
            thumbnailPath: thumbnailUrl,
            fileType: file.type.startsWith('image/') ? 'image' : 'pdf',
            fileName: file.name
        })
    } catch (error) {
        console.error('File upload error:', error)
        return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
    }
}
