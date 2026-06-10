"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { rehireEmployee } from "@/actions/employment-history"
import { UserCheck } from "lucide-react"

interface Branch {
    id: number
    name: string
}

interface RehireDialogProps {
    employeeId: number
    employeeName: string
    branches: Branch[]
    existingDepartments: string[]
}

export function RehireDialog({ employeeId, employeeName, branches, existingDepartments }: RehireDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [branchId, setBranchId] = useState("")
    const [department, setDepartment] = useState("")
    const [position, setPosition] = useState("")
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
    const [salary, setSalary] = useState("")
    const router = useRouter()

    async function handleRehire() {
        if (!startDate) return toast.error("Başlangıç tarihi giriniz.")
        setLoading(true)
        try {
            const result = await rehireEmployee(employeeId, {
                branchId: branchId ? parseInt(branchId) : undefined,
                department,
                position,
                startDate,
                salary: salary ? parseFloat(salary) : undefined,
            })
            if (result.success) {
                toast.success(result.message)
                setOpen(false)
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
                <UserCheck className="h-4 w-4 mr-2" />
                Yeniden İşe Al
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Yeniden İşe Al — {employeeName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label>Şube</Label>
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Şube seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Departman</Label>
                            <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="Departman" list="dept-list" />
                            <datalist id="dept-list">
                                {existingDepartments.map(d => <option key={d} value={d} />)}
                            </datalist>
                        </div>
                        <div className="space-y-1">
                            <Label>Pozisyon / SGK Meslek</Label>
                            <Input value={position} onChange={e => setPosition(e.target.value)} placeholder="Pozisyon" />
                        </div>
                        <div className="space-y-1">
                            <Label>İşe Başlama Tarihi *</Label>
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>Maaş (₺)</Label>
                            <Input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="0" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                        <Button onClick={handleRehire} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                            {loading ? "Kaydediliyor..." : "Yeniden İşe Al"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
