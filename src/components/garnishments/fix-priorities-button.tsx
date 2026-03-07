"use client"

import { Button } from "@/components/ui/button"
import { fixGarnishmentPriorities } from "@/actions/fix-garnishment-priorities"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { useState } from "react"

export function FixPrioritiesButton() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleFix() {
        setLoading(true)
        try {
            const result = await fixGarnishmentPriorities()
            if (result.success) {
                toast.success(result.message)
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

    return (
        <Button variant="outline" onClick={handleFix} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Sıraları Düzelt
        </Button>
    )
}
