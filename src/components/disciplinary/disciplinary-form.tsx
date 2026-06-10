"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDisciplinaryRecord } from "@/actions/disciplinary"
import { VIOLATION_TYPES } from "@/lib/disciplinary-constants"
import { useRouter } from "next/navigation"

interface Employee { id: number; firstName: string; lastName: string }

export function DisciplinaryForm({ employees }: { employees: Employee[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [employeeId, setEmployeeId] = useState("")
    const [violationType, setViolationType] = useState("")
    const [incidentDate, setIncidentDate] = useState("")
    const [description, setDescription] = useState("")

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!employeeId || !violationType || !incidentDate) {
            setMessage({ type: "error", text: "Lütfen zorunlu alanları doldurun." })
            return
        }
        setLoading(true)
        const result = await addDisciplinaryRecord({
            employeeId: parseInt(employeeId),
            violationType,
            incidentDate,
            description,
        })
        setLoading(false)
        if (result.success) {
            setMessage({ type: "success", text: result.message })
            setEmployeeId("")
            setViolationType("")
            setIncidentDate("")
            setDescription("")
            router.refresh()
        } else {
            setMessage({ type: "error", text: result.message })
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Personel Seçiniz *</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Personel seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                        {employees.map(e => (
                            <SelectItem key={e.id} value={String(e.id)}>
                                {e.firstName} {e.lastName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>İhlal Türü *</Label>
                <Select value={violationType} onValueChange={setViolationType}>
                    <SelectTrigger>
                        <SelectValue placeholder="İhlal türü seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                        {VIOLATION_TYPES.map(v => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Olay Tarihi *</Label>
                <input
                    type="date"
                    value={incidentDate}
                    onChange={e => setIncidentDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>Detaylı Açıklama ve Notlar</Label>
                <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Olayla ilgili ek açıklamalar..."
                    rows={4}
                />
            </div>

            {message && (
                <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                    {message.text}
                </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Kaydediliyor..." : "Tutanağı Kaydet"}
            </Button>
        </form>
    )
}
