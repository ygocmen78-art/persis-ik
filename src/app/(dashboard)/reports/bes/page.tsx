"use client";

import { useEffect, useState, useTransition } from "react";
import { getMonthlyBesReport, exitFromBes, type MonthlyBesReport, type BesFilterType } from "@/actions/bes-report-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, Printer, Download, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export default function BesReportPage() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toString());
    const [filterType, setFilterType] = useState<BesFilterType>("auto");
    const [data, setData] = useState<MonthlyBesReport[]>([]);
    const [isPending, startTransition] = useTransition();
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isExiting, setIsExiting] = useState(false);

    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
    const months = [
        { value: "1", label: "Ocak" },
        { value: "2", label: "Şubat" },
        { value: "3", label: "Mart" },
        { value: "4", label: "Nisan" },
        { value: "5", label: "Mayıs" },
        { value: "6", label: "Haziran" },
        { value: "7", label: "Temmuz" },
        { value: "8", label: "Ağustos" },
        { value: "9", label: "Eylül" },
        { value: "10", label: "Ekim" },
        { value: "11", label: "Kasım" },
        { value: "12", label: "Aralık" },
    ];

    const fetchReport = () => {
        startTransition(async () => {
            try {
                const result = await getMonthlyBesReport(
                    parseInt(selectedYear),
                    parseInt(selectedMonth),
                    filterType
                );
                setData(result);
                setSelectedIds(new Set());
            } catch (error) {
                toast.error("BES raporu alınırken bir hata oluştu.");
            }
        });
    };

    // Initial load + refetch when filter changes
    useEffect(() => {
        fetchReport();
    }, [filterType]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePrint = () => {
        window.print();
    };

    const handleExcelExport = () => {
        if (data.length === 0) {
            toast.info("Dışa aktarılacak veri bulunamadı.");
            return;
        }

        import("xlsx").then((xlsx) => {
            const exportData = data.map((item, index) => ({
                "No": index + 1,
                "Personel": item.employeeName,
                "TC No": item.tcNumber || "-",
                "Şube": item.branchName || "-",
                "BES Tipi": item.besStatus === "auto" ? "Otomatik (Zorunlu)" : "Gönüllü",
                "Brüt Maaş": item.grossSalary,
                "BES Kesintisi (%3)": item.besAmount,
            }));

            const worksheet = xlsx.utils.json_to_sheet(exportData);
            const workbook = xlsx.utils.book_new();
            const monthLabel = months.find((m) => m.value === selectedMonth)?.label;
            const filterLabel = filterType === "auto" ? "Zorunlu" : filterType === "voluntary" ? "Gönüllü" : "Tüm";
            xlsx.utils.book_append_sheet(workbook, worksheet, `BES ${monthLabel} ${selectedYear}`);
            xlsx.writeFile(workbook, `BES_${filterLabel}_${monthLabel}_${selectedYear}.xlsx`);
            toast.success("Excel dosyası indirildi.");
        });
    };

    const handleBesExit = async () => {
        if (selectedIds.size === 0) {
            toast.info("Lütfen BES'ten çıkarılacak personelleri seçin.");
            return;
        }

        if (!confirm(`${selectedIds.size} personeli BES'ten çıkarmak istediğinize emin misiniz?`)) return;

        setIsExiting(true);
        try {
            const result = await exitFromBes(Array.from(selectedIds));
            if (result.success) {
                toast.success(result.message);
                fetchReport();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("BES'ten çıkış işlemi sırasında hata oluştu.");
        } finally {
            setIsExiting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === data.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(data.map(d => d.id)));
        }
    };

    const toggleSelect = (id: number) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const totalBesAmount = data.reduce((sum, item) => sum + item.besAmount, 0);
    const totalGrossSalary = data.reduce((sum, item) => sum + item.grossSalary, 0);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">BES Raporu</h1>
                    <p className="text-muted-foreground">
                        Aylık Bireysel Emeklilik Sistemi kesinti listesi (brüt maaş üzerinden %3)
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Select value={filterType} onValueChange={(v) => setFilterType(v as BesFilterType)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="BES Tipi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">Zorunlu (Otomatik)</SelectItem>
                            <SelectItem value="voluntary">Gönüllü</SelectItem>
                            <SelectItem value="all">Tümü</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Ay" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Yıl" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={y}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={fetchReport} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Raporla
                    </Button>
                    <Button variant="excel" onClick={handleExcelExport} disabled={data.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Excel
                    </Button>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Yazdır
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleBesExit}
                        disabled={selectedIds.size === 0 || isExiting}
                    >
                        {isExiting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserMinus className="mr-2 h-4 w-4" />}
                        BES'ten Çıkar ({selectedIds.size})
                    </Button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8 text-center">
                <h2 className="text-2xl font-bold border-b pb-2 mb-4">
                    {months.find((m) => m.value === selectedMonth)?.label} {selectedYear} - BES Kesinti Listesi
                    ({filterType === "auto" ? "Zorunlu" : filterType === "voluntary" ? "Gönüllü" : "Tümü"})
                </h2>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Personel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Brüt Maaş</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalGrossSalary)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Toplam BES Kesintisi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalBesAmount)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="print:shadow-none print:border-none">
                <CardHeader className="print:hidden">
                    <CardTitle>BES Kesinti Listesi</CardTitle>
                    <CardDescription>
                        {months.find((m) => m.value === selectedMonth)?.label} {selectedYear} dönemi —
                        {filterType === "auto" ? " Zorunlu (Otomatik Katılım)" : filterType === "voluntary" ? " Gönüllü" : " Tüm BES"} kesintileri
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border print:border-black">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px] print:hidden">
                                        <Checkbox
                                            checked={data.length > 0 && selectedIds.size === data.length}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[50px]">No</TableHead>
                                    <TableHead>Personel</TableHead>
                                    <TableHead>TC No</TableHead>
                                    <TableHead>Şube</TableHead>
                                    <TableHead>BES Tipi</TableHead>
                                    <TableHead className="text-right">Brüt Maaş</TableHead>
                                    <TableHead className="text-right">BES Kesintisi (%3)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            Bu dönem ve filtre için BES kaydı bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="print:hidden">
                                                <Checkbox
                                                    checked={selectedIds.has(item.id)}
                                                    onCheckedChange={() => toggleSelect(item.id)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                            <TableCell className="font-medium">{item.employeeName}</TableCell>
                                            <TableCell>{item.tcNumber || "-"}</TableCell>
                                            <TableCell>{item.branchName || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    item.besStatus === "auto"
                                                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                                                        : "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                                                }>
                                                    {item.besStatus === "auto" ? "Zorunlu" : "Gönüllü"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(item.grossSalary)}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatCurrency(item.besAmount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <div className="bg-muted/50 p-4 rounded-lg flex flex-col gap-1 min-w-[250px] print:bg-transparent print:border print:border-black">
                            <span className="text-sm font-medium text-muted-foreground print:text-black">Toplam BES Kesintisi</span>
                            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 print:text-black">
                                {formatCurrency(totalBesAmount)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 20mm;
                    }
                    body {
                        visibility: hidden;
                    }
                    .space-y-6 > * {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    nav, aside, header, footer, button {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
