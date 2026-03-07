"use client"

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
import { Bell } from "lucide-react"
import { usePathname } from "next/navigation"

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

    // Match exact path or parent route for detail pages
    const getAccentColor = () => {
        // Check exact match first
        if (pathname === "/") return "bg-blue-500"
        if (pathname === "/employees") return "bg-green-500"
        if (pathname === "/leave") return "bg-purple-500"
        if (pathname === "/expenses") return "bg-orange-500"
        if (pathname === "/documents") return "bg-cyan-500"
        if (pathname === "/garnishments") return "bg-red-500"
        if (pathname === "/reports/execution") return "bg-pink-500"
        if (pathname === "/reports/bes") return "bg-indigo-500"
        if (pathname === "/isg") return "bg-yellow-500"
        if (pathname === "/sgk") return "bg-sky-500"
        if (pathname === "/settings") return "bg-gray-500"

        // Check for parent routes (e.g., /employees/123 -> /employees)
        if (pathname.startsWith("/employees")) return "bg-green-500"
        if (pathname.startsWith("/leave")) return "bg-purple-500"
        if (pathname.startsWith("/expenses")) return "bg-orange-500"
        if (pathname.startsWith("/documents")) return "bg-cyan-500"
        if (pathname.startsWith("/garnishments")) return "bg-red-500"
        if (pathname.startsWith("/reports/execution")) return "bg-pink-500"
        if (pathname.startsWith("/reports/bes")) return "bg-indigo-500"
        if (pathname.startsWith("/isg")) return "bg-yellow-500"
        if (pathname.startsWith("/sgk")) return "bg-sky-500"
        if (pathname.startsWith("/settings")) return "bg-gray-500"

        return "bg-primary"
    }

    const accentColor = getAccentColor()

    return (
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-10">
            {/* Colored accent bar */}
            <div className={`h-1 ${accentColor} transition-colors duration-300`} />
            <div className="flex h-16 items-center px-4 justify-between">
                <div className="font-semibold text-lg md:hidden">K</div>
                <div className="ml-auto flex items-center space-x-4">
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                    </Button>
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
                                    <p className="text-xs leading-none text-muted-foreground">
                                        admin@example.com
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                Profil
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                Ayarlar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                Çıkış Yap
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
