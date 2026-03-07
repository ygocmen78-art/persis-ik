"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { activateLicense } from "@/actions/license";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Building2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export default function ActivatePage() {
    const router = useRouter();
    const [vkn, setVkn] = useState("");
    const [attemptKey, setAttemptKey] = useState("");
    const [eulaAccepted, setEulaAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!eulaAccepted) {
            toast.error("Lütfen Lisans Sözleşmesini kabul ediniz.");
            return;
        }

        setLoading(true);

        try {
            const res = await activateLicense(vkn, attemptKey);
            if (res.success) {
                toast.success(res.message);
                // Redirect user with a hard reload to clear all Next.js App Router cached layouts
                setTimeout(() => {
                    window.location.href = "/";
                }, 500);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Aktivasyon sunucusuna ulaşılamadı. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <Card className="w-full max-w-lg shadow-2xl border-zinc-800 backdrop-blur-md bg-zinc-900/90 relative z-10 text-zinc-100">
                <CardHeader className="space-y-4 pb-6 pt-8">
                    <div className="flex justify-center mb-2">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl text-center font-bold tracking-tight text-white">Lisans Aktivasyonu</CardTitle>
                    <CardDescription className="text-center text-zinc-400 text-sm px-4">
                        Bu yazılım, kurulum yapılan şirketin VKN'sine özel olarak lisanslanmaktadır. Lütfen bilgilerinizi giriniz.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleActivate}>
                    <CardContent className="space-y-5">

                        <div className="space-y-2">
                            <Label htmlFor="vkn" className="text-zinc-300">Şirket Vergi/TC Kimlik Numarası (VKN)</Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                                <Input
                                    id="vkn"
                                    placeholder="Örn: 1234567890"
                                    className="pl-10 h-12 bg-zinc-950/50 border-zinc-700 text-lg placeholder:text-zinc-600 focus:ring-emerald-500"
                                    value={vkn}
                                    onChange={(e) => setVkn(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="attemptKey" className="text-zinc-300">Ürün Aktivasyon Anahtarı</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                                <Input
                                    id="attemptKey"
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    className="pl-10 h-12 bg-zinc-950/50 border-zinc-700 text-lg placeholder:text-zinc-600 font-mono uppercase tracking-widest focus:ring-emerald-500"
                                    value={attemptKey}
                                    onChange={(e) => setAttemptKey(e.target.value)}
                                    required
                                />
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">
                                Aktivasyon anahtarı için lütfen geliştiriciyle (LinkedIn) iletişime geçiniz.
                            </p>
                        </div>

                        <div className="p-4 rounded-lg bg-zinc-950/50 border border-zinc-800 space-y-3 mt-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <Checkbox
                                    checked={eulaAccepted}
                                    onCheckedChange={(checked) => setEulaAccepted(checked as boolean)}
                                    className="mt-1 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                />
                                <div className="text-sm text-zinc-300 leading-snug">
                                    <span className="font-semibold text-emerald-400">Kullanıcı Sözleşmesini (EULA) okudum ve kabul ediyorum.</span><br />
                                    Bu yazılımın tamamen <strong>ÜCRETSİZ</strong> olduğunu, hiçbir kişi veya kuruma para karşılığı satılmayacağını, ticari gelir elde etme amacıyla kullanılamayacağını ve para ödeyerek satın almadığımı beyan ederim.
                                </div>
                            </label>
                        </div>
                    </CardContent>

                    <CardFooter className="pb-8 pt-4">
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white shadow-lg shadow-emerald-900/20 h-12 text-lg font-medium transition-all"
                            disabled={loading || !eulaAccepted}
                        >
                            {loading ? "Doğrulanıyor..." : "Lisansı Doğrula ve Başla"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {/* Developer Signature */}
            <div className="fixed bottom-4 right-6 text-zinc-500 text-sm font-medium" style={{ fontFamily: 'Ubuntu, sans-serif' }}>
                Meslektaşlara armağan edilmiştir. Tamamen Ücretsizdir.
            </div>
        </div>
    );
}
