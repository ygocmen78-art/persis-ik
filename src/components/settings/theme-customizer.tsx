"use client"

import * as React from "react"
import { Moon, Sun, Check } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { updateTheme } from "@/actions/settings"

const themes = [
    { name: "violet", label: "Mor", color: "bg-purple-600", cssVars: { primary: "0.55 0.22 280", ring: "0.55 0.22 280" } },
    { name: "blue", label: "Mavi", color: "bg-blue-600", cssVars: { primary: "0.55 0.20 240", ring: "0.55 0.20 240" } },
    { name: "green", label: "Yeşil", color: "bg-green-600", cssVars: { primary: "0.55 0.18 145", ring: "0.55 0.18 145" } },
    { name: "red", label: "Kırmızı", color: "bg-red-600", cssVars: { primary: "0.60 0.22 25", ring: "0.60 0.22 25" } },
    { name: "orange", label: "Turuncu", color: "bg-orange-500", cssVars: { primary: "0.65 0.20 50", ring: "0.65 0.20 50" } },
    { name: "pink", label: "Pembe", color: "bg-pink-500", cssVars: { primary: "0.60 0.22 340", ring: "0.60 0.22 340" } },
    { name: "teal", label: "Turkuaz", color: "bg-teal-500", cssVars: { primary: "0.55 0.18 180", ring: "0.55 0.18 180" } },
    { name: "amber", label: "Amber", color: "bg-amber-500", cssVars: { primary: "0.70 0.18 70", ring: "0.70 0.18 70" } },
    { name: "indigo", label: "İndigo", color: "bg-indigo-600", cssVars: { primary: "0.50 0.20 260", ring: "0.50 0.20 260" } },
    { name: "emerald", label: "Zümrüt", color: "bg-emerald-500", cssVars: { primary: "0.60 0.18 160", ring: "0.60 0.18 160" } },
]


export function ThemeCustomizer() {
    const { setTheme, theme } = useTheme()
    const [colorTheme, setColorTheme] = React.useState("violet")

    // Load saved color theme on mount
    React.useEffect(() => {
        const saved = localStorage.getItem("color-theme")
        if (saved) {
            setColorTheme(saved)
            applyColorTheme(saved, false) // false = don't save to DB on init, just apply
        }
    }, [])

    function applyColorTheme(themeName: string, saveToDb = true) {
        const selectedTheme = themes.find(t => t.name === themeName)
        if (!selectedTheme) return

        const root = document.documentElement
        root.style.setProperty('--primary', `oklch(${selectedTheme.cssVars.primary})`, 'important')
        root.style.setProperty('--ring', `oklch(${selectedTheme.cssVars.ring})`, 'important')

        // Also set attribute for persistence via script
        root.setAttribute('data-theme-color', themeName)

        localStorage.setItem("color-theme", themeName)
        setColorTheme(themeName)

        if (saveToDb) {
            updateTheme(themeName)
        }
    }

    return (
        <div className="grid gap-6">
            <div className="grid gap-2">
                <Label className="text-base font-semibold">Görünüm Modu</Label>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTheme("light")}
                        className={cn(theme === "light" && "border-2 border-primary")}
                    >
                        <Sun className="mr-2 h-4 w-4" /> Açık
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTheme("dark")}
                        className={cn(theme === "dark" && "border-2 border-primary")}
                    >
                        <Moon className="mr-2 h-4 w-4" /> Koyu
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTheme("system")}
                        className={cn(theme === "system" && "border-2 border-primary")}
                    >
                        Sistem
                    </Button>
                </div>
            </div>

            <div className="grid gap-2">
                <Label className="text-base font-semibold">Renk Teması</Label>
                <div className="grid grid-cols-2 gap-2">
                    {themes.map((t) => (
                        <Button
                            key={t.name}
                            variant="outline"
                            size="sm"
                            className={cn(
                                "justify-start",
                                colorTheme === t.name && "border-2 border-primary"
                            )}
                            onClick={() => applyColorTheme(t.name)}
                        >
                            <span className={cn("mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", t.color)}>
                                {colorTheme === t.name && <Check className="h-3 w-3 text-white" />}
                            </span>
                            {t.label}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}
