"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface DocumentPreviewProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    filePath: string | null
    fileType: string | null
    title: string
}

export function DocumentPreview({ open, onOpenChange, filePath, fileType, title }: DocumentPreviewProps) {
    const [zoom, setZoom] = useState(100)
    const [rotation, setRotation] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const imageRef = useRef<HTMLDivElement>(null)

    // Reset zoom and rotation when dialog opens/closes
    useEffect(() => {
        if (open) {
            setZoom(100)
            setRotation(0)
            setIsFullscreen(false)
        }
    }, [open])

    // Mouse wheel zoom for images
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (fileType === 'image' && imageRef.current?.contains(e.target as Node)) {
                e.preventDefault()
                const delta = e.deltaY > 0 ? -10 : 10
                setZoom(prev => Math.max(25, Math.min(400, prev + delta)))
            }
        }

        if (open) {
            window.addEventListener('wheel', handleWheel, { passive: false })
            return () => window.removeEventListener('wheel', handleWheel)
        }
    }, [open, fileType])

    function handlePrint() {
        if (!filePath) return

        const printWindow = window.open(filePath, '_blank')

        if (printWindow) {
            // Try both load event and timeout for reliability
            let printed = false

            printWindow.addEventListener('load', () => {
                if (!printed) {
                    printed = true
                    setTimeout(() => {
                        printWindow.print()
                    }, 250)
                }
            })

            // Fallback timeout in case load event doesn't fire
            setTimeout(() => {
                if (!printed) {
                    printed = true
                    printWindow.print()
                }
            }, 1000)
        }
    }

    function handleDownload() {
        if (!filePath) return

        // Use fetch to download as blob to preserve file type
        fetch(filePath)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url

                // Get original filename from path
                const filename = filePath.split('/').pop() || 'document'
                link.download = filename

                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                // Clean up the blob URL
                window.URL.revokeObjectURL(url)
            })
            .catch(error => {
                console.error('Download error:', error)
                // Fallback to direct download
                const link = document.createElement('a')
                link.href = filePath
                link.download = filePath.split('/').pop() || 'document'
                link.target = '_blank'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            })
    }

    // Fullscreen mode - custom overlay
    if (open && isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col">
                {/* Header */}
                <div className="border-b p-4 flex items-center justify-between bg-background">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <div className="flex gap-2 flex-wrap">
                        {fileType === 'image' && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.max(25, prev - 25))}>
                                    <ZoomOut className="h-4 w-4 mr-2" />
                                    {zoom}%
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.min(400, prev + 25))}>
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setRotation(prev => (prev + 90) % 360)}>
                                    <RotateCw className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Yazdır
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            İndir
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsFullscreen(false)}
                            className="bg-primary/10"
                        >
                            <Minimize2 className="h-4 w-4 mr-2" />
                            Küçült
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                        >
                            Kapat
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
                    {fileType === 'image' && filePath ? (
                        <div
                            ref={imageRef}
                            className="w-full h-full flex items-center justify-center p-4 cursor-zoom-in"
                        >
                            <img
                                src={filePath}
                                alt={title}
                                className="max-w-full h-auto transition-transform duration-200"
                                style={{
                                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                                    transformOrigin: 'center'
                                }}
                            />
                        </div>
                    ) : fileType === 'pdf' && filePath ? (
                        <iframe
                            src={filePath}
                            className="w-full h-full"
                            title={title}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Önizleme mevcut değil
                        </div>
                    )}
                </div>

                {/* Footer hints */}
                {fileType === 'image' && (
                    <div className="text-center text-sm text-muted-foreground py-2 border-t bg-background">
                        💡 İpucu: Mouse tekerleği ile yakınlaştırma yapabilirsiniz
                    </div>
                )}
                {fileType === 'pdf' && (
                    <div className="text-center text-sm text-muted-foreground py-2 border-t bg-background">
                        📄 PDF dosyaları tarayıcının kendi görüntüleyicisi ile açılır
                    </div>
                )}
            </div>
        )
    }

    // Normal mode - use Dialog
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-[95vw] h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center justify-between">
                        <span>{title}</span>
                        <div className="flex gap-2 flex-wrap">
                            {fileType === 'image' && (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.max(25, prev - 25))}>
                                        <ZoomOut className="h-4 w-4 mr-2" />
                                        {zoom}%
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.min(400, prev + 25))}>
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setRotation(prev => (prev + 90) % 360)}>
                                        <RotateCw className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                            <Button variant="outline" size="sm" onClick={handlePrint}>
                                <Printer className="h-4 w-4 mr-2" />
                                Yazdır
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownload}>
                                <Download className="h-4 w-4 mr-2" />
                                İndir
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsFullscreen(true)}
                                className="bg-primary/10"
                            >
                                <Maximize2 className="h-4 w-4 mr-2" />
                                Büyüt
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 rounded-lg">
                    {fileType === 'image' && filePath ? (
                        <div
                            ref={imageRef}
                            className="w-full h-full flex items-center justify-center p-4 cursor-zoom-in"
                            style={{ minHeight: '500px' }}
                        >
                            <img
                                src={filePath}
                                alt={title}
                                className="max-w-full h-auto transition-transform duration-200"
                                style={{
                                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                                    transformOrigin: 'center'
                                }}
                            />
                        </div>
                    ) : fileType === 'pdf' && filePath ? (
                        <iframe
                            src={filePath}
                            className="w-full h-full min-h-[600px]"
                            title={title}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Önizleme mevcut değil
                        </div>
                    )}
                </div>

                {fileType === 'image' && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                        💡 İpucu: Mouse tekerleği ile yakınlaştırma yapabilirsiniz (sadece resimler için)
                    </div>
                )}
                {fileType === 'pdf' && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                        📄 PDF dosyaları tarayıcının kendi görüntüleyicisi ile açılır
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
