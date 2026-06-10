"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus } from "lucide-react"
import { addCustomOccupationCode, deleteCustomOccupationCode } from "@/actions/settings"
import { useRouter } from "next/navigation"

interface OccupationCode { id: number; code: string; description: string | null }

export function OccupationCodesManager({ codes }: { codes: OccupationCode[] }) {
    const router = useRouter()
    const [code, setCode] = useState("")
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!code.trim()) return
        setLoading(true)
        await addCustomOccupationCode(code, description)
        setCode("")
        setDescription("")
        setLoading(false)
        router.refresh()
    }

    async function handleDelete(id: number) {
        await deleteCustomOccupationCode(id)
        router.refresh()
    }

    return (
        <div className="space-y-4">
            <form onSubmit={handleAdd} className="flex gap-2 items-end">
                <div className="space-y-1">
                    <Label className="text-xs">Meslek Kodu</Label>
                    <Input
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        placeholder="Örn: 8332.05"
                        className="w-32"
                    />
                </div>
                <div className="space-y-1 flex-1">
                    <Label className="text-xs">Açıklama (opsiyonel)</Label>
                    <Input
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Örn: Ağır Vasıta Şoförü"
                    />
                </div>
                <Button type="submit" disabled={loading || !code.trim()} size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Ekle
                </Button>
            </form>

            {codes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz özel meslek kodu eklenmemiş.</p>
            ) : (
                <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                    {codes.map(c => (
                        <div key={c.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/30">
                            <div>
                                <span className="font-mono text-sm font-medium">{c.code}</span>
                                {c.description && <span className="text-sm text-muted-foreground ml-2">— {c.description}</span>}
                            </div>
                            <Button
                                size="sm" variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(c.id)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
