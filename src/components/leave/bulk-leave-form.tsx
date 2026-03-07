"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { addLeaveRequest } from "@/actions/leaves"
import { Upload } from "lucide-react"

interface BulkLeaveFormProps {
    employees: { id: number; firstName: string; lastName: string }[]
}

export function BulkLeaveForm({ employees }: BulkLeaveFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [employeeId, setEmployeeId] = useState<string>("")
    const [totalDays, setTotalDays] = useState<string>("")

    async function handleSubmit() {
        if (!employeeId || !totalDays) {
            toast.error("Lütfen personel seçin ve gün sayısını girin.")
            return
        }

        const days = parseInt(totalDays)
        if (days <= 0) {
            toast.error("Gün sayısı 0'dan büyük olmalıdır.")
            return
        }

        setLoading(true)

        try {
            // Create a single "bulk entry" leave record
            // Using today as start date and calculating end date based on days
            const today = new Date()
            const startDate = new Date(today)
            const endDate = new Date(today)
            endDate.setDate(endDate.getDate() + days - 1)

            const returnDate = new Date(endDate)
            returnDate.setDate(returnDate.getDate() + 1)

            const result = await addLeaveRequest({
                employeeId: parseInt(employeeId),
                type: "annual",
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                returnDate: returnDate.toISOString(),
                description: `Toplu izin girişi: ${days} gün`,
            })

            if (result.success) {
                toast.success(`${days} gün izin kaydedildi.`)
                setOpen(false)
                setTotalDays("")
                setEmployeeId("")
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Toplu İzin Girişi
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Toplu İzin Girişi</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Personel</Label>
                        <Select value={employeeId} onValueChange={setEmployeeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Personel seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id.toString()}>
                                        {emp.firstName} {emp.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Kullanılan İzin (Gün)</Label>
                        <Input
                            type="number"
                            placeholder="Örn: 30"
                            value={totalDays}
                            onChange={(e) => setTotalDays(e.target.value)}
                            min="1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Personelin kullandığı toplam izin gün sayısını girin
                        </p>
                    </div>

                    <Button onClick={handleSubmit} disabled={loading} className="w-full">
                        {loading ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
