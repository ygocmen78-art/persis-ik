"use client"

import { useEffect, useState } from "react"
import { getExpiringLicenses } from "@/actions/employees"
import { AlertTriangle, XCircle } from "lucide-react"

type LicenseAlert = {
  employeeId: number
  employeeName: string
  type: string
  expiryDate: string
  status: "expired" | "expiring"
}

export function LicenseAlerts() {
  const [alerts, setAlerts] = useState<LicenseAlert[]>([])

  useEffect(() => {
    getExpiringLicenses(30).then(setAlerts)
  }, [])

  if (alerts.length === 0) return null

  return (
    <div className="space-y-1 mb-2">
      {alerts.map((alert, i) => (
        <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs ${
          alert.status === "expired"
            ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
            : "border-yellow-300 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-700 dark:text-yellow-400"
        }`}>
          {alert.status === "expired" ? (
            <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          <span className="font-semibold">{alert.status === "expired" ? "Süresi Dolmuş" : "Yaklaşıyor"} — {alert.type}:</span>
          <span className="font-medium">{alert.employeeName}</span>
          <span className="text-muted-foreground">bitiş: {new Date(alert.expiryDate).toLocaleDateString("tr-TR")}</span>
          {alert.status === "expiring" && (
            <span className="ml-1 opacity-75">({Math.ceil((new Date(alert.expiryDate).getTime() - Date.now()) / 86400000)} gün kaldı)</span>
          )}
        </div>
      ))}
    </div>
  )
}
