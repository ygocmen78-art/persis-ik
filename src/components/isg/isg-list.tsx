"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash, FileText, AlertTriangle } from "lucide-react"
import { deleteISGRecord } from "@/actions/isg"
import { toast } from "sonner"
import { format, isBefore, addMonths } from "date-fns"
import { tr } from "date-fns/locale"

interface ISGRecord {
    id: number
    employeeId: number
    firstName: string | null
    lastName: string | null
    documentType: string
    filePath: string | null
    expiryDate: string | null
    notificationStatus: string | null
    createdAt?: string | null
}

interface ISGListProps {
    records: ISGRecord[]
}

const docTypeLabels: Record<string, string> = {
    health_report: "Sağlık Raporu",
    training_certificate: "Eğitim Sertifikası",
    equipment_delivery: "KKD Zimmet",
    other: "Diğer"
}

export function ISGList({ records }: ISGListProps) {
    async function handleDelete(id: number) {
        if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return
        const res = await deleteISGRecord(id)
        if (res.success) toast.success(res.message)
        else toast.error(res.message)
    }

    const today = new Date()

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Personel</TableHead>
                        <TableHead>Belge Türü</TableHead>
                        <TableHead>Geçerlilik Tarihi</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((item) => {
                        const expiry = item.expiryDate ? new Date(item.expiryDate) : null
                        const isExpired = expiry && isBefore(expiry, today)
                        const isExpiringSoon = expiry && isBefore(expiry, addMonths(today, 1)) && !isExpired

                        return (
                            <TableRow key={item.id}>
                                <TableCell>
                                    {item.firstName} {item.lastName}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        {docTypeLabels[item.documentType] || item.documentType}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {item.expiryDate ? format(new Date(item.expiryDate), "d MMMM yyyy", { locale: tr }) : "-"}
                                </TableCell>
                                <TableCell>
                                    {isExpired ? (
                                        <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Süresi Doldu
                                        </Badge>
                                    ) : isExpiringSoon ? (
                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                            Yaklaşıyor
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">Geçerli</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => toast.info("Dosya indirme henüz aktif değil.")}>
                                                İndir
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600">
                                                <Trash className="mr-2 h-4 w-4" /> Sil
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                    {records.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                Kayıt bulunamadı.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
