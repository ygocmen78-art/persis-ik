"use client";

import { useState, useEffect, useMemo } from "react";
import { getBranches } from "@/actions/branches";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    ExternalLink,
    Copy,
    Eye,
    EyeOff,
    FileText,
    UserPlus,
    AlertTriangle,
    Shield,
    Settings,
    Wand2,
} from "lucide-react";
import Link from "next/link";

const SGK_LINKS = [
    {
        id: "ebildirge",
        title: "E-Bildirge V2",
        description: "Aylık prim ve hizmet belgesi bildirimi",
        url: "https://ebildirge.sgk.gov.tr/EBildirgeV2",
        icon: FileText,
        color: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
        iconColor: "text-blue-600 dark:text-blue-400",
        fields: ["Kullanıcı Adı", "Sistem Şifresi", "İşyeri Şifresi"],
    },
    {
        id: "ise-giris",
        title: "İşe Giriş / İşten Ayrılış",
        description: "Sigortalı işe giriş ve işten ayrılış bildirgeleri",
        url: "https://uyg.sgk.gov.tr/SigortaliTescil/amp/loginldap",
        icon: UserPlus,
        color: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
        iconColor: "text-green-600 dark:text-green-400",
        fields: ["Kullanıcı Adı", "Sistem Şifresi", "İşyeri Şifresi"],
    },
    {
        id: "is-kazasi",
        title: "İş Kazası / Meslek Hastalığı",
        description: "İş kazası ve meslek hastalığı e-bildirim",
        url: "https://uyg.sgk.gov.tr/IsvBildirimFormu/welcome.do",
        icon: AlertTriangle,
        color: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
        iconColor: "text-orange-600 dark:text-orange-400",
        fields: ["Kullanıcı Kodu", "İşyeri Şifresi"],
    },
    {
        id: "rapor-sorgulama",
        title: "Rapor Sorgulama",
        description: "Çalışılmadığına Dair Bildirim Giriş Sistemi (Vizite)",
        url: "https://uyg.sgk.gov.tr/vizite/welcome.do",
        icon: FileText,
        color: "bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800",
        iconColor: "text-pink-600 dark:text-pink-400",
        fields: ["Kullanıcı Kodu", "İşyeri Şifresi"],
    },
];

export default function SgkPage() {
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getBranches().then((data) => {
            const sgkBranches = data.filter(b => b.sgk_number);
            setBranches(sgkBranches);
            if (sgkBranches.length > 0) {
                setSelectedBranchId(sgkBranches[0].id);
            }
            setLoading(false);
        });
    }, []);

    const credentials = useMemo(() => {
        if (!selectedBranchId) return null;
        const b = branches.find(x => x.id === selectedBranchId);
        if (!b) return null;
        return {
            username: b.sgk_number,
            systemPassword: b.sgk_system_password,
            workplacePassword: b.sgk_workplace_password,
            code: b.sgk_code,
            userCode: b.sgk_user_code
        };
    }, [branches, selectedBranchId]);

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} kopyalandı`);
        } catch {
            toast.error("Kopyalama başarısız");
        }
    };

    const copyAllAndOpen = async (link: typeof SGK_LINKS[0]) => {
        if (!credentials || !credentials.username) {
            toast.error("Lütfen önce Ayarlar > Çalışma Yerleri sayfasından SGK bilgisi olan bir şube ekleyin.");
            return;
        }

        // Copy credentials summary to clipboard
        const credLines = [
            `Sicil: ${credentials.username}`,
            `Sistem: ${credentials.systemPassword}`,
            `Isyeri: ${credentials.workplacePassword}`,
        ];
        if (credentials.code) credLines.push(`Kod: ${credentials.code}`);
        if (credentials.userCode) credLines.push(`Kullanici: ${credentials.userCode}`);
        const credText = credLines.join("\n");

        try {
            await navigator.clipboard.writeText(credText);
            toast.success("Şifreler panoya kopyalandı, sayfa açılıyor...");
        } catch {
            // Still open even if clipboard fails
        }

        // Open the external site in a new window
        window.open(link.url, "_blank", "noopener,noreferrer");
    };

    const hasCredentials = credentials && credentials.username;

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">SGK İşlemleri</h1>
                    <p className="text-muted-foreground">
                        SGK portallarına hızlı erişim — tıklayınca şifreler kopyalanır ve site açılır
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {!loading && branches.length > 0 && (
                        <div className="w-[250px]">
                            <Select value={selectedBranchId?.toString()} onValueChange={(val) => setSelectedBranchId(Number(val))}>
                                <SelectTrigger className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                    <SelectValue placeholder="Şirket Seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPasswords(!showPasswords)}
                    >
                        {showPasswords ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                        {showPasswords ? "Gizle" : "Göster"}
                    </Button>
                    <Link href="/settings">
                        <Button variant="outline" size="sm">
                            <Settings className="mr-2 h-4 w-4" />
                            Düzenle
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Credentials Overview */}
            {!loading && (
                <Card className="border-dashed">
                    <CardContent className="pt-6">
                        {!hasCredentials ? (
                            <div className="flex items-center gap-4 text-muted-foreground">
                                <Shield className="h-8 w-8 text-yellow-500" />
                                <div>
                                    <p className="font-medium text-foreground">Kayıtlı bir resmi şube bulunamadı</p>
                                    <p className="text-sm">
                                        <Link href="/settings" className="text-primary underline">Ayarlar → Çalışma Yerleri</Link> sayfasından SGK bilgisi olan bir şube kaydedin.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                                    <div>
                                        <p className="text-xs text-muted-foreground">SGK İşyeri Sicil No</p>
                                        <p className="font-mono font-medium">{credentials.username}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(credentials.username, "Sicil No")}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Sistem Şifresi</p>
                                        <p className="font-mono font-medium">
                                            {showPasswords ? credentials.systemPassword : "••••••••"}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(credentials.systemPassword, "Sistem şifresi")}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                                    <div>
                                        <p className="text-xs text-muted-foreground">İşyeri Şifresi</p>
                                        <p className="font-mono font-medium">
                                            {showPasswords ? credentials.workplacePassword : "••••••••"}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(credentials.workplacePassword, "İşyeri şifresi")}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}



            {/* SGK Link Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SGK_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Card
                            key={link.id}
                            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 ${link.color}`}
                            onClick={() => copyAllAndOpen(link)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}>
                                        <Icon className={`h-6 w-6 ${link.iconColor}`} />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{link.title}</CardTitle>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <CardDescription className="mt-2">
                                    {link.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-1.5">
                                    {link.fields.map((field) => (
                                        <Badge key={field} variant="secondary" className="text-xs">
                                            {field}
                                        </Badge>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">
                                    Tıkladığınızda şifreler kopyalanır ve yeni pencerede açılır
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
