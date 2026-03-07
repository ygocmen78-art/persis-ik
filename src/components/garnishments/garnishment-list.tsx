"use client"


import { cn } from "@/lib/utils"
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
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle, Trash, CalendarClock, Edit, RotateCcw, ArrowUp, ArrowDown, XCircle } from "lucide-react"
import { deleteGarnishment, updateGarnishment, addGarnishmentRefund, updateGarnishmentPriority, closeGarnishment, addGarnishmentResidualBalance, deleteGarnishmentInstallment } from "@/actions/garnishments"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GarnishmentResponseDialog } from "./response-dialog"
import { FilePlus2 } from "lucide-react"

interface Garnishment {
    id: number
    employeeId: number
    firstName: string | null
    lastName: string | null
    fileNumber: string
    officeName: string
    totalAmount: number
    remainingAmount: number
    deductionAmount: number | null
    iban: string | null
    status: string | null
    notificationDate: string | null
    priorityOrder: number
    creditor: string | null
}

interface GarnishmentListProps {
    garnishments: Garnishment[]
}

export function GarnishmentList({ garnishments }: GarnishmentListProps) {
    const [editingGarnishment, setEditingGarnishment] = useState<Garnishment | null>(null)
    const [refundingGarnishment, setRefundingGarnishment] = useState<Garnishment | null>(null)
    const [residualBalanceGarnishment, setResidualBalanceGarnishment] = useState<Garnishment | null>(null)
    const [viewingPlanId, setViewingPlanId] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    async function handleResidualBalance(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!residualBalanceGarnishment) return

        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const amount = parseFloat(formData.get("amount") as string)

        try {
            const res = await addGarnishmentResidualBalance({
                id: residualBalanceGarnishment.id,
                amount
            })

            if (res.success) {
                toast.success(res.message)
                setResidualBalanceGarnishment(null)
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error("İşlem sırasında bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Bu icra dosyasını silmek istediğinize emin misiniz?")) return
        const res = await deleteGarnishment(id)
        if (res.success) toast.success(res.message)
        else toast.error(res.message)
    }

    async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!editingGarnishment) return

        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            const res = await updateGarnishment(editingGarnishment.id, {
                fileNumber: formData.get("fileNumber") as string,
                officeName: formData.get("officeName") as string,
                totalAmount: parseFloat(formData.get("totalAmount") as string),
                remainingAmount: parseFloat(formData.get("remainingAmount") as string),
                iban: formData.get("iban") as string,
                notificationDate: formData.get("notificationDate") as string,
                creditor: formData.get("creditor") as string,
                deductionAmount: parseFloat(formData.get("deductionAmount") as string) || 0
            })

            if (res.success) {
                toast.success(res.message)
                setEditingGarnishment(null)
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error("Hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    async function handleRefund(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!refundingGarnishment) return

        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            const res = await addGarnishmentRefund({
                garnishmentId: refundingGarnishment.id,
                amount: parseFloat(formData.get("amount") as string),
                date: formData.get("date") as string,
                description: formData.get("description") as string
            })

            if (res.success) {
                toast.success(res.message)
                setRefundingGarnishment(null)
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error("Hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    async function handlePriorityChange(employeeId: number, garnishmentId: number, direction: 'up' | 'down', currentPriority: number) {
        const newPriority = direction === 'up' ? currentPriority - 1 : currentPriority + 1
        const res = await updateGarnishmentPriority(employeeId, garnishmentId, newPriority)
        if (res.success) toast.success(res.message)
        else toast.error(res.message)
    }

    async function handleClose(id: number) {
        if (!confirm("Bu icrayı kapatmak istediğinize emin misiniz?")) return
        const res = await closeGarnishment(id)
        if (res.success) toast.success(res.message)
        else toast.error(res.message)
    }

    const filteredGarnishments = garnishments.filter(g => {
        if (!searchQuery) return true
        const query = searchQuery.toLocaleLowerCase('tr-TR')
        const fullName = `${g.firstName} ${g.lastName}`.toLocaleLowerCase('tr-TR')
        const fileNo = (g.fileNumber || "").toLocaleLowerCase('tr-TR')
        const office = (g.officeName || "").toLocaleLowerCase('tr-TR')
        return fullName.includes(query) || fileNo.includes(query) || office.includes(query)
    })

    // Group filtered garnishments by employee
    const grouped = filteredGarnishments.reduce((acc, g) => {
        const key = g.employeeId
        if (!acc[key]) {
            acc[key] = {
                employeeName: `${g.firstName} ${g.lastName}`,
                garnishments: [],
                totalAllDebt: 0,
                totalAllRemaining: 0
            }
        }
        acc[key].garnishments.push(g)
        acc[key].totalAllDebt += g.totalAmount || 0
        acc[key].totalAllRemaining += g.remainingAmount || 0
        return acc
    }, {} as Record<number, { employeeName: string, garnishments: Garnishment[], totalAllDebt: number, totalAllRemaining: number }>)

    // Sort garnishments by priority within each employee
    Object.values(grouped).forEach(group => {
        group.garnishments.sort((a, b) => a.priorityOrder - b.priorityOrder)
    })

    return (
        <>
            <div className="mb-4">
                <Input
                    placeholder="Personel adı, dosya no veya icra dairesi ile ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                />
            </div>
            <div className="space-y-4">
                {Object.entries(grouped).map(([employeeId, group]) => (
                    <div key={employeeId} className="rounded-md border bg-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-muted/50 border-b gap-2">
                            <div className="font-semibold text-lg">{group.employeeName}</div>
                            <div className="flex items-center gap-4 text-sm whitespace-nowrap">
                                <span className="text-muted-foreground">Toplam İcra Borcu: <strong className="text-foreground">{group.totalAllDebt.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</strong></span>
                                <span className="text-red-600 font-medium">Kalan: <strong>{group.totalAllRemaining.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</strong></span>
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Sıra</TableHead>
                                    <TableHead>İcra Dairesi / Dosya</TableHead>
                                    <TableHead>IBAN</TableHead>
                                    <TableHead>Teslim Tarihi</TableHead>
                                    <TableHead>Toplam Borç</TableHead>
                                    <TableHead>Kalan Borç</TableHead>
                                    <TableHead>Durum</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {group.garnishments.map((item, index) => (
                                    <TableRow
                                        key={item.id}
                                        className={cn(
                                            item.status === "completed" && "bg-green-50/70 hover:bg-green-100/70 dark:bg-green-900/20 dark:hover:bg-green-900/30 transition-colors"
                                        )}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span className="text-lg font-bold text-primary">{item.priorityOrder}</span>
                                                <div className="flex flex-col gap-0.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5"
                                                        disabled={index === 0}
                                                        onClick={() => handlePriorityChange(parseInt(employeeId), item.id, 'up', item.priorityOrder)}
                                                    >
                                                        <ArrowUp className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5"
                                                        disabled={index === group.garnishments.length - 1}
                                                        onClick={() => handlePriorityChange(parseInt(employeeId), item.id, 'down', item.priorityOrder)}
                                                    >
                                                        <ArrowDown className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.officeName}</span>
                                                <span className="text-xs text-muted-foreground">{item.fileNumber}</span>
                                                {item.creditor && <span className="text-[10px] text-teal-600 font-semibold truncate max-w-[120px]">{item.creditor}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">{item.iban || "-"}</TableCell>
                                        <TableCell className="text-xs">
                                            {item.notificationDate ? new Date(item.notificationDate).toLocaleDateString("tr-TR") : "-"}
                                        </TableCell>
                                        <TableCell>{item.totalAmount.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</TableCell>
                                        <TableCell className="font-bold text-red-600">
                                            {item.remainingAmount.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.status === "active" ? "default" : item.status === "completed" ? "outline" : "secondary"}>
                                                {item.status === "active" ? "Aktif" : item.status === "completed" ? "Kapatıldı" : "Askıda"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <GarnishmentResponseDialog
                                                    garnishmentId={item.id}
                                                    employeeName={group.employeeName}
                                                />
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => setResidualBalanceGarnishment(item)}>
                                                            <FilePlus2 className="mr-2 h-4 w-4" /> Bakiye Yazısı Ekle
                                                        </DropdownMenuItem>
                                                        {item.status === "active" && (
                                                            <DropdownMenuItem onClick={() => handleClose(item.id)}>
                                                                <XCircle className="mr-2 h-4 w-4" /> İcrayı Kapat
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => setEditingGarnishment(item)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Düzenle
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setRefundingGarnishment(item)}>
                                                            <RotateCcw className="mr-2 h-4 w-4" /> İade Ekle
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setViewingPlanId(item.id)}>
                                                            <CalendarClock className="mr-2 h-4 w-4" /> Ödeme Planı
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600">
                                                            <Trash className="mr-2 h-4 w-4" /> Sil
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ))}
                {garnishments.length === 0 && (
                    <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
                        Kayıt bulunamadı.
                    </div>
                )}
            </div>

            <Dialog open={!!residualBalanceGarnishment} onOpenChange={(val) => !val && setResidualBalanceGarnishment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bakiye İcra Yazısı Ekle</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleResidualBalance} className="space-y-4 py-4">
                        <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-2 border border-blue-100">
                            <strong>Bilgi:</strong> Eklenen tutar borca ilave edilecek ve bu icra dosyası otomatik olarak <strong>1. sıraya</strong> taşınacaktır.
                        </div>
                        <div className="space-y-2">
                            <Label>İlave Borç Tutarı</Label>
                            <Input type="number" step="0.01" name="amount" required placeholder="0.00" autoFocus />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setResidualBalanceGarnishment(null)}>İptal</Button>
                            <Button type="submit" disabled={loading}>{loading ? "Kaydediliyor..." : "Kaydet ve 1. Sıraya Taşı"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!refundingGarnishment} onOpenChange={(val) => !val && setRefundingGarnishment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>İade Ekle</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRefund} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>İade Edilen Tutar</Label>
                            <Input type="number" step="0.01" name="amount" required placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <Label>İade Tarihi</Label>
                            <Input type="date" name="date" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Açıklama</Label>
                            <Input name="description" placeholder="Örn: Fazla ödeme iadesi" defaultValue="İade" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setRefundingGarnishment(null)}>İptal</Button>
                            <Button type="submit" disabled={loading}>{loading ? "Kaydediliyor..." : "Kaydet"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingGarnishment} onOpenChange={(val) => !val && setEditingGarnishment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>İcra Dosyasını Düzenle</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>İcra Dairesi</Label>
                                <Input name="officeName" defaultValue={editingGarnishment?.officeName} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Alacaklı</Label>
                                <Input name="creditor" defaultValue={editingGarnishment?.creditor || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label>Dosya No (Esas)</Label>
                                <Input name="fileNumber" defaultValue={editingGarnishment?.fileNumber} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>IBAN</Label>
                            <Input name="iban" defaultValue={editingGarnishment?.iban || ""} placeholder="TR..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Tebliğ/Teslim Tarihi</Label>
                            <Input type="date" name="notificationDate" defaultValue={editingGarnishment?.notificationDate || ""} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Toplam Borç</Label>
                                <Input type="number" step="0.01" name="totalAmount" defaultValue={editingGarnishment?.totalAmount} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Kalan Borç</Label>
                                <Input type="number" step="0.01" name="remainingAmount" defaultValue={editingGarnishment?.remainingAmount} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Aylık Kesinti Tutarı (Varsayılan)</Label>
                            <Input type="number" step="0.01" name="deductionAmount" defaultValue={editingGarnishment?.deductionAmount || 0} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingGarnishment(null)}>İptal</Button>
                            <Button type="submit" disabled={loading}>{loading ? "Kaydediliyor..." : "Kaydet"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingPlanId} onOpenChange={(val) => !val && setViewingPlanId(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Ödeme Planı</DialogTitle>
                    </DialogHeader>
                    <GarnishmentPlanManager
                        garnishmentId={viewingPlanId!}
                        onClose={() => setViewingPlanId(null)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}

function GarnishmentPlanManager({ garnishmentId, onClose }: { garnishmentId: number, onClose: () => void }) {
    const [installments, setInstallments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [newDate, setNewDate] = useState("")
    const [newAmount, setNewAmount] = useState("")

    useEffect(() => {
        loadInstallments()
    }, [garnishmentId])

    async function loadInstallments() {
        const { getGarnishmentInstallments } = await import("@/actions/garnishments")
        const data = await getGarnishmentInstallments(garnishmentId)
        setInstallments(data)
        setLoading(false)
    }

    async function handleAddInstallment() {
        if (!newDate || !newAmount) return
        const { addGarnishmentInstallment } = await import("@/actions/garnishments")
        await addGarnishmentInstallment({
            garnishmentId,
            paymentDate: newDate,
            amount: parseFloat(newAmount)
        })
        toast.success("Taksit eklendi")
        setNewDate("")
        setNewAmount("")
        loadInstallments()
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2 items-end border-b pb-4">
                <div className="grid gap-1.5 flex-1">
                    <Label>Tarih</Label>
                    <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                </div>
                <div className="grid gap-1.5 flex-1">
                    <Label>Tutar</Label>
                    <Input type="number" placeholder="0.00" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
                </div>
                <Button onClick={handleAddInstallment}>Ekle</Button>
            </div>

            <div className="max-h-[300px] overflow-auto">
                {loading ? <div className="text-center py-4">Yükleniyor...</div> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Tutar</TableHead>
                                <TableHead>Açıklama</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {installments.map(ins => (
                                <TableRow key={ins.id}>
                                    <TableCell>{new Date(ins.paymentDate).toLocaleDateString("tr-TR")}</TableCell>
                                    <TableCell>{ins.amount.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</TableCell>
                                    <TableCell className="text-[10px] text-muted-foreground">{ins.description || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant={ins.status === "paid" ? "default" : "outline"}>
                                            {ins.status === "paid" ? "Ödendi" : "Bekliyor"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                                            onClick={async () => {
                                                if (confirm("Bu kaydı silmek istediğinize emin misiniz? Borç bakiyesi buna göre güncellenecektir.")) {
                                                    const res = await deleteGarnishmentInstallment(ins.id)
                                                    if (res.success) {
                                                        toast.success(res.message)
                                                        loadInstallments()
                                                    } else {
                                                        toast.error(res.message)
                                                    }
                                                }
                                            }}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {installments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">Plan bulunamadı.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div >
    )
}
