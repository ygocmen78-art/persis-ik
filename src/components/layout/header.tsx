"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Bell, AlertTriangle, XCircle, Clock } from "lucide-react"
import { usePathname } from "next/navigation"
import { getExpiringLicenses } from "@/actions/employees"

type LicenseAlert = {
    employeeId: number
    employeeName: string
    type: string
    expiryDate: string
    status: "expired" | "expiring"
}

const pageColors: Record<string, string> = {
    "/": "bg-blue-500",
    "/employees": "bg-green-500",
    "/leave": "bg-purple-500",
    "/expenses": "bg-orange-500",
    "/documents": "bg-cyan-500",
    "/garnishments": "bg-red-500",
    "/reports/execution": "bg-pink-500",
    "/reports/bes": "bg-indigo-500",
    "/isg": "bg-yellow-500",
    "/sgk": "bg-sky-500",
    "/settings": "bg-gray-500",
}

export function Header() {
    const pathname = usePathname()
    const [alerts, setAlerts] = useState<LicenseAlert[]>([])

    useEffect(() => {
        let active = true
        getExpiringLicenses(30)
            .then((items) => { if (active) setAlerts(items) })
            .catch((error) => console.error("Belge uyarıları yüklenemedi:", error))
        return () => { active = false }
    }, [])

    const accentColor = pageColors[pathname] || (
        pathname.startsWith("/employees") ? "bg-green-500" :
        pathname.startsWith("/leave") ? "bg-purple-500" :
        pathname.startsWith("/expenses") ? "bg-orange-500" :
        pathname.startsWith("/documents") ? "bg-cyan-500" :
        pathname.startsWith("/garnishments") ? "bg-red-500" : "bg-primary"
    )

    return (
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-10">
            <div className={`h-1 ${accentColor} transition-colors duration-300`} />
            <div className="flex h-16 items-center px-4 justify-between">
                <div className="font-semibold text-lg md:hidden">K</div>
                <div className="ml-auto flex items-center space-x-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative" aria-label={`Belge uyarıları${alerts.length ? `: ${alerts.length}` : ""}`}>
                                <Bell className="h-5 w-5 text-slate-600" />
                                {alerts.length > 0 && (
                                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white">
                                        {alerts.length > 99 ? "99+" : alerts.length}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
                            <DropdownMenuLabel className="flex items-center justify-between px-3 py-2.5">
                                <span>Belge Uyarıları</span>
                                <span className="text-xs font-normal text-slate-500">{alerts.length} uyarı</span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="my-0" />
                            <div className="max-h-[min(65vh,400px)] overflow-y-auto p-1">
                                {alerts.length === 0 ? (
                                    <p className="px-3 py-6 text-center text-sm text-slate-500">Yaklaşan veya süresi dolmuş belge yok.</p>
                                ) : alerts.map((alert, index) => (
                                    <DropdownMenuItem
                                        key={`${alert.employeeId}-${alert.type}-${alert.expiryDate}-${index}`}
                                        onSelect={() => { window.location.href = `/employees/${alert.employeeId}` }}
                                        className="items-start gap-2.5 whitespace-normal px-3 py-2.5 cursor-pointer"
                                    >
                                        {alert.status === "expired"
                                            ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                                            : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium text-slate-800">{alert.employeeName} · {alert.type}</span>
                                            <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                                <Clock className="h-3 w-3" />
                                                {alert.status === "expired" ? "Süresi doldu" : "Süresi yaklaşıyor"} · {new Date(alert.expiryDate).toLocaleDateString("tr-TR")}
                                            </span>
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </div>
                            {alerts.length > 0 && (
                                <>
                                    <DropdownMenuSeparator className="my-0" />
                                    <Link href="/employees">
                                        <DropdownMenuItem className="justify-center text-sm font-medium text-primary cursor-pointer">
                                            Personel listesine git
                                        </DropdownMenuItem>
                                    </Link>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="/avatars/01.png" alt="@user" />
                                    <AvatarFallback>AD</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">Admin User</p>
                                    <p className="text-xs leading-none text-muted-foreground">admin@example.com</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Ayarlar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
