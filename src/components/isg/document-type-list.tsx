"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash } from "lucide-react"
import { deleteDocumentType } from "@/actions/isg-document-types"
import { toast } from "sonner"
import { DocumentTypeForm } from "./document-type-form"

interface DocumentType {
    id: number
    name: string
    validityMonths: number | null
    description: string | null
}

interface DocumentTypeListProps {
    documentTypes: DocumentType[]
}

export function DocumentTypeList({ documentTypes }: DocumentTypeListProps) {
    async function handleDelete(id: number, name: string) {
        if (!confirm(`"${name}" evrak türünü silmek istediğinize emin misiniz?`)) return

        const result = await deleteDocumentType(id)
        if (result.success) {
            toast.success(result.message)
        } else {
            toast.error(result.message)
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Evrak Adı</TableHead>
                        <TableHead>Geçerlilik Süresi</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead className="w-[100px]">İşlemler</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documentTypes.map((docType) => (
                        <TableRow key={docType.id}>
                            <TableCell className="font-medium">{docType.name}</TableCell>
                            <TableCell>
                                <Badge variant="outline">
                                    {docType.validityMonths || 12} Ay
                                </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {docType.description || "-"}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <DocumentTypeForm initialData={docType} />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(docType.id, docType.name)}
                                    >
                                        <Trash className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {documentTypes.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Henüz evrak türü tanımlanmamış.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
