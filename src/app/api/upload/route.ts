import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'

async function generatePDFThumbnail(pdfBuffer: Buffer, outputPath: string): Promise<void> {
    try {
        // Load PDF
        const pdfDoc = await PDFDocument.load(pdfBuffer)
        const pages = pdfDoc.getPages()

        if (pages.length === 0) {
            throw new Error('PDF has no pages')
        }

        // Get first page
        const firstPage = pages[0]
        const { width, height } = firstPage.getSize()

        // Create a new PDF with just the first page
        const singlePagePdf = await PDFDocument.create()
        const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [0])
        singlePagePdf.addPage(copiedPage)

        // Save as bytes
        const pdfBytes = await singlePagePdf.save()

        // For now, we'll save the PDF path and use iframe for preview
        // True image conversion would require pdf2pic or similar, which needs external dependencies
        // This is a simplified approach - we'll use the PDF itself

    } catch (error) {
        console.error('PDF thumbnail generation error:', error)
        throw error
    }
}

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
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'isg')
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
