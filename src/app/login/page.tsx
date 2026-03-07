"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/actions/auth";
import { checkLicenseStatus } from "@/actions/license";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, User } from "lucide-react";
import { LogoIcon } from "@/components/icons/logo";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const check = async () => {
            const isActivated = await checkLicenseStatus();
            if (!isActivated) {
                router.push("/activate");
            }
        };
        check();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await login(username, password);
            if (res.success) {
                toast.success(res.message);
                router.push("/"); // Redirect to dashboard
                router.refresh();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Giriş yapılırken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <Card className="w-full max-w-md shadow-2xl border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm bg-white/90 dark:bg-zinc-900/90 relative z-10">
                <CardHeader className="space-y-3 pb-6 pt-8">
                    <div className="flex justify-center mb-2">
                        <div className="w-20 h-20 flex items-center justify-center">
                            <LogoIcon className="w-full h-full" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center font-bold tracking-tight text-red-600 dark:text-red-500">Persis IK</CardTitle>
                    <CardDescription className="text-center text-zinc-500 dark:text-zinc-400">
                        Güvenli İnsan Kaynakları Yönetim Sistemi
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Kullanıcı Adı</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                <Input
                                    id="username"
                                    placeholder="admin"
                                    className="pl-9 bg-zinc-50/50 dark:bg-zinc-950/50"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Şifre</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••"
                                    className="pl-9 bg-zinc-50/50 dark:bg-zinc-950/50"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pb-8">
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-md transition-all h-11 border-none"
                            disabled={loading}
                        >
                            {loading ? "Giriş Yapılıyor..." : "Sisteme Giriş Yap"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Developer Signature & Support */}
            <div className="fixed bottom-4 right-6 text-zinc-500 dark:text-zinc-400 text-sm font-medium flex flex-col items-end gap-1.5" style={{ fontFamily: 'Ubuntu, sans-serif' }}>
                <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-base">Tamamen Ücretsizdir.</p>
                <div className="flex items-center gap-4 text-sm mt-1">
                    <span className="font-bold text-zinc-600 dark:text-zinc-400 mr-1">Destek:</span>
                    <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                        <span className="select-text cursor-text">ygocmen78@gmail.com</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors font-medium">
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
                            className="hover:underline"
                        >
                            LinkedIn Profilim
                        </a>
                    </span>
                </div>
            </div>
        </div>
    );
}
