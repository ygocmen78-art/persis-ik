"use client"

import { useState } from "react"
import { addDepartment, deleteDepartment, updateDepartment } from "@/actions/departments"
import { Trash2, Plus, Pencil } from "lucide-react"
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
import { useRouter } from "next/navigation"

type Department = {
    id: number
    name: string
    description: string | null
    createdAt: string | null
}

export function DepartmentManager({ initialDepartments }: { initialDepartments: Department[] }) {
    const [open, setOpen] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const resetForm = () => {
        setEditId(null)
        setName("")
        setDescription("")
    }

    async function handleSave() {
        if (!name) return toast.error("Departman adı gereklidir")

        setLoading(true)
        try {
            let result;
            if (editId) {
                result = await updateDepartment(editId, { name, description })
            } else {
                result = await addDepartment({ name, description })
            }

            if (result.success) {
                toast.success(result.message)
                setOpen(false)
                resetForm()
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: number) {
        if (confirm("Bu departmanı silmek istediğinize emin misiniz?")) {
            const result = await deleteDepartment(id)
            if (result.success) {
                toast.success(result.message)
                router.refresh()
            } else {
                toast.error(result.message)
            }
        }
    }

    const openEdit = (dept: Department) => {
        setEditId(dept.id)
        setName(dept.name)
        setDescription(dept.description || "")
        setOpen(true)
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Departmanlar</CardTitle>
                    <CardDescription>Şirket departmanlarını yönetin. Yeni eklenen departmanlar personel formunda görünecektir.</CardDescription>
                </div>
                <Dialog open={open} onOpenChange={(val) => {
                    setOpen(val)
                    if (!val) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> Yeni Departman</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editId ? "Departmanı Düzenle" : "Yeni Departman Ekle"}</DialogTitle>
                            <DialogDescription>Departman bilgilerini giriniz.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Departman Adı</Label>
                                <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" placeholder="Örn: Satış" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Açıklama</Label>
                                <Input id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" placeholder="İsteğe bağlı" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSave} disabled={loading}>{editId ? "Güncelle" : "Kaydet"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Departman Adı</TableHead>
                            <TableHead>Açıklama</TableHead>
                            <TableHead className="w-[100px]">İşlem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialDepartments.map((dept) => (
                            <TableRow key={dept.id}>
                                <TableCell className="font-medium">{dept.name}</TableCell>
                                <TableCell>{dept.description || "-"}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(dept)}>
                                            <Pencil className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {initialDepartments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                    Henüz departman eklenmemiş.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
