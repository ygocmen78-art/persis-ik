"use client"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [showUpdateToast, setShowUpdateToast] = useState(false)

    useEffect(() => {
        (window as any).__showUpdateToast = () => setShowUpdateToast(true);
        return () => { delete (window as any).__showUpdateToast; };
    }, []);

    useEffect(() => {
        if (showUpdateToast) {
            const t = setTimeout(() => setShowUpdateToast(false), 5000);
            return () => clearTimeout(t);
        }
    }, [showUpdateToast]);

    const getBgColor = () => {
        if (pathname === "/") return "bg-gradient-to-br from-blue-50/50 to-background dark:from-blue-950/30 dark:to-background"
        if (pathname === "/employees") return "bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/30 dark:to-background"
        if (pathname === "/leave") return "bg-gradient-to-br from-purple-50/50 to-background dark:from-purple-950/30 dark:to-background"
        if (pathname === "/expenses") return "bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/30 dark:to-background"
        if (pathname === "/documents") return "bg-gradient-to-br from-cyan-50/50 to-background dark:from-cyan-950/30 dark:to-background"
        if (pathname === "/garnishments") return "bg-gradient-to-br from-red-50/50 to-background dark:from-red-950/30 dark:to-background"
        if (pathname === "/reports/execution") return "bg-gradient-to-br from-pink-50/50 to-background dark:from-pink-950/30 dark:to-background"
        if (pathname === "/reports/bes") return "bg-gradient-to-br from-indigo-50/50 to-background dark:from-indigo-950/30 dark:to-background"
        if (pathname === "/isg") return "bg-gradient-to-br from-yellow-50/50 to-background dark:from-yellow-950/30 dark:to-background"
        if (pathname === "/attendance") return "bg-gradient-to-br from-teal-50/50 to-background dark:from-teal-950/30 dark:to-background"
        if (pathname === "/sgk") return "bg-gradient-to-br from-sky-50/50 to-background dark:from-sky-950/30 dark:to-background"
        if (pathname === "/settings") return "bg-gradient-to-br from-gray-50/50 to-background dark:from-gray-950/30 dark:to-background"
        if (pathname.startsWith("/employees")) return "bg-gradient-to-br from-green-50/50 to-background dark:from-green-950/30 dark:to-background"
        if (pathname.startsWith("/leave")) return "bg-gradient-to-br from-purple-50/50 to-background dark:from-purple-950/30 dark:to-background"
        if (pathname.startsWith("/expenses")) return "bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/30 dark:to-background"
        if (pathname.startsWith("/documents")) return "bg-gradient-to-br from-cyan-50/50 to-background dark:from-cyan-950/30 dark:to-background"
        if (pathname.startsWith("/garnishments")) return "bg-gradient-to-br from-red-50/50 to-background dark:from-red-950/30 dark:to-background"
        if (pathname.startsWith("/reports/execution")) return "bg-gradient-to-br from-pink-50/50 to-background dark:from-pink-950/30 dark:to-background"
        if (pathname.startsWith("/reports/bes")) return "bg-gradient-to-br from-indigo-50/50 to-background dark:from-indigo-950/30 dark:to-background"
        if (pathname.startsWith("/isg")) return "bg-gradient-to-br from-yellow-50/50 to-background dark:from-yellow-950/30 dark:to-background"
        if (pathname.startsWith("/attendance")) return "bg-gradient-to-br from-teal-50/50 to-background dark:from-teal-950/30 dark:to-background"
        if (pathname.startsWith("/sgk")) return "bg-gradient-to-br from-sky-50/50 to-background dark:from-sky-950/30 dark:to-background"
        if (pathname.startsWith("/settings")) return "bg-gradient-to-br from-gray-50/50 to-background dark:from-gray-950/30 dark:to-background"
        return "bg-background"
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <div className="w-64 flex-shrink-0">
                <Sidebar className="h-full" />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className={cn(
                    "flex-1 overflow-y-auto p-6 transition-all duration-500 ease-in-out",
                    getBgColor()
                )}>
                    {children}
                </main>
            </div>

            {showUpdateToast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-600 text-white px-5 py-3.5 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-sm">Güncelleme tamamlandı!</p>
                        <p className="text-xs text-green-100">Program başarıyla güncellendi.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
