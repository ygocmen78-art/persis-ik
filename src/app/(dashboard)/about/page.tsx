"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Shield, Clock, Tag } from "lucide-react";
import { LogoIcon } from "@/components/icons/logo";

export default function AboutPage() {
    const [appVersion, setAppVersion] = useState<string>("...");
    const [updateDate, setUpdateDate] = useState<string>("...");

    useEffect(() => {
        if (typeof window !== "undefined" && (window as any).require) {
            try {
                const { ipcRenderer } = (window as any).require("electron");
                ipcRenderer.invoke("get-app-version").then((v: string) => setAppVersion(v));
            } catch {}
        }
        // Son kurulum tarihini exe'nin degistirilme tarihinden al
        const stored = localStorage.getItem("install_date");
        if (stored) {
            setUpdateDate(stored);
        } else {
            const now = new Date().toLocaleDateString("tr-TR", {
                year: "numeric", month: "long", day: "numeric",
                hour: "2-digit", minute: "2-digit"
            });
            setUpdateDate(now);
        }
    }, []);

    return (
        <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto">
            <div className="flex flex-col items-center gap-4 py-6">
                <div className="h-24 w-24">
                    <LogoIcon className="h-full w-full" />
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Persis İK</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Güvenli İnsan Kaynakları Yönetim Sistemi</p>
                </div>
            </div>

            <div className="grid gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Tag className="h-4 w-4 text-violet-500" />
                            Sürüm Bilgisi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="text-sm text-zinc-500">Mevcut Sürüm</span>
                            <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">v{appVersion}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-zinc-500">Son Güncelleme</span>
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{updateDate}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Shield className="h-4 w-4 text-green-500" />
                            Lisans
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Bu yazılım tamamen ücretsizdir. Kişisel ve ticari kullanım için serbesttir.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Info className="h-4 w-4 text-blue-500" />
                            Destek & İletişim
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="text-sm text-zinc-500">E-posta</span>
                            <span className="text-sm font-medium select-text">ygocmen78@gmail.com</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-zinc-500">Geliştirici</span>
                            <span className="text-sm font-medium">Yusuf Göçmen</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
