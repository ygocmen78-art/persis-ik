"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Users,
    LayoutDashboard,
    Calendar,
    Settings,
    FileText,
    CreditCard,
    Briefcase,
    Gavel,
    ShieldAlert,
    FileBarChart,
    ClipboardList,
    PiggyBank,
    Landmark,
    Calculator
} from "lucide-react"

import { LogoIcon } from "@/components/icons/logo"

const sidebarItems = [
    {
        title: "Ana Sayfa",
        href: "/",
        icon: LayoutDashboard,
        variant: "default",
        color: "text-blue-500",
        bgColor: "bg-blue-500",
    },
    {
        title: "Personel",
        href: "/employees",
        icon: Users,
        variant: "ghost",
        color: "text-green-500",
        bgColor: "bg-green-500",
    },
    {
        title: "İzinler",
        href: "/leave",
        icon: Calendar,
        variant: "ghost",
        color: "text-purple-500",
        bgColor: "bg-purple-500",
    },
    {
        title: "Harcamalar",
        href: "/expenses",
        icon: CreditCard,
        variant: "ghost",
        color: "text-orange-500",
        bgColor: "bg-orange-500",
    },
    {
        title: "Şirket Evrakları",
        href: "/documents",
        icon: FileText,
        variant: "ghost",
        color: "text-cyan-500",
        bgColor: "bg-cyan-500",
    },
    {
        title: "İcra Takip",
        href: "/garnishments",
        icon: Gavel,
        variant: "ghost",
        color: "text-red-500",
        bgColor: "bg-red-500",
    },
    {
        title: "İcra Raporu",
        href: "/reports/execution",
        icon: FileBarChart,
        variant: "ghost",
        color: "text-pink-500",
        bgColor: "bg-pink-500",
    },
    {
        title: "BES Raporu",
        href: "/reports/bes",
        icon: PiggyBank,
        variant: "ghost",
        color: "text-indigo-500",
        bgColor: "bg-indigo-500",
    },
    {
        title: "Tazminat Raporu",
        href: "/reports/compensation",
        icon: Calculator,
        variant: "ghost",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500",
    },
    {
        title: "İSG Takip",
        href: "/isg",
        icon: ShieldAlert,
        variant: "ghost",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500",
    },
    {
        title: "Puantaj",
        href: "/attendance",
        icon: ClipboardList,
        variant: "ghost",
        color: "text-teal-500",
        bgColor: "bg-teal-500",
    },
    {
        title: "SGK İşlemleri",
        href: "/sgk",
        icon: Landmark,
        variant: "ghost",
        color: "text-sky-500",
        bgColor: "bg-sky-500",
    },
    {
        title: "Ayarlar",
        href: "/settings",
        icon: Settings,
        variant: "ghost",
        color: "text-gray-500",
        bgColor: "bg-gray-500",
    },
    {
        title: "Program Hakkında",
        href: "/about",
        icon: Briefcase,
        variant: "ghost",
        color: "text-violet-500",
        bgColor: "bg-violet-500",
    },
]

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname()

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-gradient-to-b from-sidebar to-sidebar/95 border-sidebar-border/50 shadow-sm", className)}>
            <div className="space-y-6 py-6">
                {/* Header/Logo */}
                <div className="px-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-14 w-14 rounded-lg flex items-center justify-center">
                            <LogoIcon className="h-10 w-10 drop-shadow-md" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                                Persis İK
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Yönetim Sistemi</p>
                        </div>
                    </div>
                </div>

                {/* Main Navigation */}
                <div className="px-3">
                    <div className="space-y-1">
                        {sidebarItems.map((item) => {
                            // Check exact match or if we're on a child route
                            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

                            // Define explicit background colors for Tailwind to detect
                            const activeBgClass =
                                item.href === "/" ? "bg-blue-500" :
                                    item.href === "/employees" ? "bg-green-500" :
                                        item.href === "/leave" ? "bg-purple-500" :
                                            item.href === "/expenses" ? "bg-orange-500" :
                                                item.href === "/documents" ? "bg-cyan-500" :
                                                    item.href === "/garnishments" ? "bg-red-500" :
                                                        item.href === "/reports/execution" ? "bg-pink-500" :
                                                            item.href === "/reports/bes" ? "bg-indigo-500" :
                                                                item.href === "/reports/compensation" ? "bg-emerald-500" :
                                                                    item.href === "/isg" ? "bg-yellow-500" :
                                                                        item.href === "/attendance" ? "bg-teal-500" :
                                                                            item.href === "/sgk" ? "bg-sky-500" :
                                                                                item.href === "/settings" ? "bg-gray-500" :
                                                                    item.href === "/about" ? "bg-violet-500" : "bg-primary"

                            return (
                                <Button
                                    key={item.href}
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start gap-3 h-11 px-3 rounded-lg transition-all duration-200",
                                        "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground hover:translate-x-1",
                                        isActive
                                            ? `${activeBgClass} text-white shadow-sm font-medium hover:opacity-90`
                                            : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                                    )}
                                    asChild
                                >
                                    <Link href={item.href}>
                                        <item.icon className={cn(
                                            "h-4 w-4 shrink-0",
                                            isActive ? "text-white" : item.color
                                        )} />
                                        <span className="text-sm">{item.title}</span>
                                    </Link>
                                </Button>
                            )
                        })}
                    </div>
                </div>



                {/* Spacer to push logout to bottom if we want, or just below management */}
                <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <Button
                        variant="ghost"
                        onClick={async () => {
                            const { logout } = await import("@/actions/auth");
                            await logout();
                            window.location.href = "/login";
                        }}
                        className="w-full justify-start gap-3 h-11 px-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 hover:translate-x-1 transition-all duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out h-4 w-4 shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                        <span className="text-sm font-medium">Güvenli Çıkış Yap</span>
                    </Button>
                </div>

                {/* Developer Signature & Support */}
                <div className="px-6 pt-4 mt-auto">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex flex-col gap-1.5" style={{ fontFamily: 'Ubuntu, sans-serif' }}>
                        <p className="border-t border-zinc-200 dark:border-zinc-800 pt-4 font-semibold text-zinc-700 dark:text-zinc-300">Tamamen Ücretsizdir.</p>
                        <p className="text-zinc-600 dark:text-zinc-400 font-bold mt-1">Destek & İletişim:</p>
                        <div className="flex flex-col gap-2 mt-1">
                            <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                <span className="truncate select-text cursor-text">ygocmen78@gmail.com</span>
                            </span>
                            <span className="flex items-center gap-2 text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (typeof window !== 'undefined' && (window as any).require) {
                                            const { shell } = (window as any).require('electron');
                                            shell.openExternal("https://www.linkedin.com/in/yusuf-g%C3%B6%C3%A7men-5ab0a1311/");
                                        } else {
                                            window.open("https://www.linkedin.com/in/yusuf-g%C3%B6%C3%A7men-5ab0a1311/", "_blank");
                                        }
                                    }}
                                    className="truncate hover:underline"
                                >
                                    LinkedIn Profilim
                                </a>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
