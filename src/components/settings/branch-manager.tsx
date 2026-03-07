"use client"

import { useState } from "react"
import { addBranch, deleteBranch, updateBranch } from "@/actions/branches"
import { Trash2, Plus, Pencil, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type Branch = {
    id: number
    name: string
    address: string | null
    sgk_number: string | null
    sgk_system_password?: string | null
    sgk_workplace_password?: string | null
    sgk_user_code?: string | null
    sgk_code?: string | null
    createdAt: string | null
}

export function BranchManager({ initialBranches }: { initialBranches: Branch[] }) {
    const [open, setOpen] = useState(false)
    const [editId, setEditId] = useState<number | null>(null) // Track editing item
    const [name, setName] = useState("")
    const [address, setAddress] = useState("")
    const [sgk, setSgk] = useState("")
    const [sgkSystemPassword, setSgkSystemPassword] = useState("")
    const [sgkWorkplacePassword, setSgkWorkplacePassword] = useState("")
    const [sgkUserCode, setSgkUserCode] = useState("")
    const [sgkCode, setSgkCode] = useState("")
    const [loading, setLoading] = useState(false)

    // Reset form when dialog closes or opens for new
    const resetForm = () => {
        setEditId(null)
        setName("")
        setAddress("")
        setSgk("")
        setSgkSystemPassword("")
        setSgkWorkplacePassword("")
        setSgkUserCode("")
        setSgkCode("")
    }

    async function handleSave() {
        if (!name) return toast.error("Şube adı gereklidir")
        if (!sgk) return toast.error("SGK numarası gereklidir")

        setLoading(true)
        try {
            const payload = {
                name, address, sgk_number: sgk,
                sgk_system_password: sgkSystemPassword,
                sgk_workplace_password: sgkWorkplacePassword,
                sgk_user_code: sgkUserCode,
                sgk_code: sgkCode
            }

            if (editId) {
                await updateBranch(editId, payload)
                toast.success("Güncellendi")
            } else {
                await addBranch(payload)
                toast.success("Eklendi")
            }

            setOpen(false)
            resetForm()
        } catch (error) {
            toast.error("Hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    const openEdit = (branch: Branch) => {
        setEditId(branch.id)
        setName(branch.name)
        setAddress(branch.address || "")
        setSgk(branch.sgk_number || "")
        setSgkSystemPassword(branch.sgk_system_password || "")
        setSgkWorkplacePassword(branch.sgk_workplace_password || "")
        setSgkUserCode(branch.sgk_user_code || "")
        setSgkCode(branch.sgk_code || "")
        setOpen(true)
    }

    async function handleDelete(id: number) {
        if (confirm("Bu şubeyi silmek istediğinize emin misiniz?")) {
            await deleteBranch(id)
            toast.success("Şube silindi")
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Şubeler (SGK Kayıtları)</CardTitle>
                    <CardDescription>Resmi şubeleri yönetin.</CardDescription>
                </div>
                <Dialog open={open} onOpenChange={(val) => {
                    setOpen(val)
                    if (!val) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> Yeni Ekle</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editId ? "Düzenle" : "Yeni Kayıt Ekle"}</DialogTitle>
                            <DialogDescription>
                                Yeni bir şube eklemek için lütfen bilgileri doldurunuz. <b>SGK numarası girmek zorunludur.</b>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Adı</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" placeholder="Örn: Merkez Ofis, Fabrika..." />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="address" className="text-right">Adres</Label>
                                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="sgk" className="text-right">SGK No</Label>
                                <Input id="sgk" value={sgk} onChange={e => setSgk(e.target.value)} className="col-span-3" placeholder="Zorunlu" required />
                            </div>

                            {sgk && (
                                <div className="col-span-4 mt-2 border-t pt-4 space-y-4">
                                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Shield className="h-4 w-4" /> SGK Şifre Bilgileri
                                    </h4>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="sgkSystemPassword" className="text-right">Sistem Şifresi</Label>
                                        <Input id="sgkSystemPassword" value={sgkSystemPassword} onChange={e => setSgkSystemPassword(e.target.value)} className="col-span-3" type="password" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="sgkWorkplacePassword" className="text-right">İşyeri Şifresi</Label>
                                        <Input id="sgkWorkplacePassword" value={sgkWorkplacePassword} onChange={e => setSgkWorkplacePassword(e.target.value)} className="col-span-3" type="password" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="sgkUserCode" className="text-right">Kullanıcı Kodu</Label>
                                        <Input id="sgkUserCode" value={sgkUserCode} onChange={e => setSgkUserCode(e.target.value)} className="col-span-3" />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="sgkCode" className="text-right">SGK Kod</Label>
                                        <Input id="sgkCode" value={sgkCode} onChange={e => setSgkCode(e.target.value)} className="col-span-3" placeholder="000" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSave} disabled={loading}>{editId ? "Güncelle" : "Kaydet"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>

            <CardContent className="space-y-8">
                {/* Resmi Şubeler Tablosu */}
                <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        🏭 Resmi Şubeler (SGK Kayıtları)
                    </h3>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Şube Adı</TableHead>
                                    <TableHead>Adres</TableHead>
                                    <TableHead>SGK Sicil No</TableHead>
                                    <TableHead className="w-[100px]">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialBranches.filter(b => b.sgk_number).map((branch) => (
                                    <TableRow key={branch.id}>
                                        <TableCell className="font-medium">{branch.name}</TableCell>
                                        <TableCell>{branch.address}</TableCell>
                                        <TableCell>{branch.sgk_number}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(branch)}>
                                                    <Pencil className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {initialBranches.filter(b => b.sgk_number).length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                            Kayıtlı resmi şube bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>


            </CardContent>
        </Card>
    )
}
