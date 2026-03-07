"use client";

import { useEffect, useState, useTransition } from "react";
import { getMonthlyExecutionReport, processExecutionPayment, processBulkExecutionPayment, type MonthlyExecutionPayment } from "@/actions/execution-report-actions";
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
import { Loader2, Printer, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import * as xlsx from "xlsx";
import { Download } from "lucide-react";

export default function ExecutionReportPage() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toString());
    const [data, setData] = useState<MonthlyExecutionPayment[]>([]);
    const [isPending, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<number | null>(null);

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
                const result = await getMonthlyExecutionReport(
                    parseInt(selectedYear),
                    parseInt(selectedMonth)
                );
                setData(result);
            } catch (error) {
                toast.error("Rapor alınırken bir hata oluştu.");
            }
        });
    };

    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    const handleBulkPayment = async () => {
        if (data.length === 0) {
            toast.info("Ödenecek kalem bulunmamaktadır.");
            return;
        }

        const totalPayment = data.reduce((sum, item) => sum + item.paymentAmount, 0);
        const formatted = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(totalPayment);

        if (!confirm(`${data.length} personel için toplam ${formatted} ödeme yapmak istiyor musunuz?\n\nÖdeme yapıldığında tutarlar icra dosyalarından düşülecektir.`)) return;

        setIsBulkProcessing(true);
        try {
            const result = await processBulkExecutionPayment(data.map(i => i.id));
            if (result.success) {
                toast.success(result.message);
                fetchReport(); // Listeyi yenile
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Toplu ödeme sırasında hata oluştu.");
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handlePayment = async (id: number) => {
        const item = data.find(d => d.id === id);
        if (!item) return;

        const formatted = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(item.paymentAmount);
        if (!confirm(`${item.employeeName} - ${item.fileNumber}\n\n${formatted} ödeme yapmak istediğinize emin misiniz?`)) return;

        setProcessingId(id);
        try {
            const result = await processExecutionPayment(id);
            toast.success(result.message);
            fetchReport(); // Listeyi yenile
        } catch (error) {
            toast.error("Ödeme işlemi başarısız.");
        } finally {
            setProcessingId(null);
        }
    };

    // Initial load
    useEffect(() => {
        fetchReport();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("tr-TR", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + " ₺";

    const handleExportExcel = () => {
        if (data.length === 0) {
            toast.info("Dışa aktarılacak veri bulunamadı.");
            return;
        }

        const exportData = data.map((item, index) => ({
            "Sıra": item.priorityOrder,
            "Personel": item.employeeName,
            "TC No": item.employeeTc || "",
            "İcra Dairesi": item.officeName,
            "Dosya No": item.fileNumber,
            "IBAN": item.iban || "",
            "Kalan Borç": formatCurrency(item.remainingAmount),
            "Aylık Kesinti": formatCurrency(item.paymentAmount),
        }));

        const ws = xlsx.utils.json_to_sheet(exportData);

        // Sütun genişliklerini ayarla
        const colWidths = [
            { wpx: 40 },  // Sıra
            { wpx: 150 }, // Personel
            { wpx: 100 }, // TC No
            { wpx: 150 }, // İcra Dairesi
            { wpx: 100 }, // Dosya No
            { wpx: 150 }, // IBAN
            { wpx: 100 }, // Kalan Borç
            { wpx: 100 }, // Aylık Kesinti
        ];
        ws['!cols'] = colWidths;

        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "İcra Ödeme Raporu");

        const monthLabel = months.find((m) => m.value === selectedMonth)?.label || "";
        xlsx.writeFile(wb, `İcra_Odeme_Raporu_${monthLabel}_${selectedYear}.xlsx`);
    };

    const totalAmount = data.reduce((sum, item) => sum + item.paymentAmount, 0);

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">İcra Ödeme Raporu</h1>
                    <p className="text-muted-foreground">
                        Her personelin ilk sıradaki aktif icra kesintisi
                    </p>
                </div>
                <div className="flex items-center gap-2">
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
                    <Button
                        onClick={handleBulkPayment}
                        disabled={isBulkProcessing || isPending || data.length === 0}
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isBulkProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Tümünü Öde
                    </Button>
                    <Button variant="excel" onClick={handleExportExcel} disabled={isPending || data.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Excel
                    </Button>
                    <Button variant="outline" onClick={handlePrint} disabled={isPending || data.length === 0}>
                        <Printer className="mr-2 h-4 w-4" />
                        Yazdır
                    </Button>
                </div>
            </div>

            {/* Print Header - Visible only when printing */}
            <div className="hidden print:block mb-8 text-center">
                <h2 className="text-2xl font-bold border-b pb-2 mb-4">
                    {months.find((m) => m.value === selectedMonth)?.label} {selectedYear} - İcra Ödeme Listesi
                </h2>
            </div>

            <Card className="print:shadow-none print:border-none">
                <CardHeader className="print:hidden">
                    <CardTitle>Ödeme Listesi</CardTitle>
                    <CardDescription>
                        {months.find((m) => m.value === selectedMonth)?.label} {selectedYear} dönemi — her personelin 1. sıra icra kesintisi
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto print:border-black print:overflow-visible">
                        <Table className="min-w-[800px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[150px]">Personel</TableHead>
                                    <TableHead className="w-[110px]">TC No</TableHead>
                                    <TableHead className="min-w-[120px]">İcra Dairesi</TableHead>
                                    <TableHead className="w-[120px]">Dosya No</TableHead>
                                    <TableHead className="w-[80px]">Sıra</TableHead>
                                    <TableHead className="max-w-[150px]">IBAN</TableHead>
                                    <TableHead className="text-right w-[110px] whitespace-nowrap">Kalan Borç</TableHead>
                                    <TableHead className="text-right w-[110px] whitespace-nowrap">Aylık Kesinti</TableHead>
                                    <TableHead className="print:hidden w-[110px] text-center">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            Aktif icra dosyası bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium whitespace-nowrap truncate max-w-[150px]" title={item.employeeName}>{item.employeeName}</TableCell>
                                            <TableCell className="text-xs whitespace-nowrap">{item.employeeTc}</TableCell>
                                            <TableCell className="text-xs truncate max-w-[150px]" title={item.officeName}>{item.officeName}</TableCell>
                                            <TableCell className="text-xs truncate max-w-[120px]" title={item.fileNumber}>{item.fileNumber}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 whitespace-nowrap">
                                                    {item.priorityOrder}. sıra
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-[10px] truncate max-w-[150px]" title={item.iban || ""}>{item.iban || "-"}</TableCell>
                                            <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                                                {formatCurrency(item.remainingAmount)}
                                            </TableCell>
                                            <TableCell className="text-right font-bold whitespace-nowrap">
                                                {formatCurrency(item.paymentAmount)}
                                            </TableCell>
                                            <TableCell className="print:hidden text-center">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10 whitespace-nowrap"
                                                    onClick={() => handlePayment(item.id)}
                                                    disabled={processingId === item.id}
                                                >
                                                    {processingId === item.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        "Ödeme Yap"
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <div className="bg-muted/50 p-4 rounded-lg flex flex-col gap-1 min-w-[250px] print:bg-transparent print:border print:border-black">
                            <span className="text-sm font-medium text-muted-foreground print:text-black">Toplam Aylık Kesinti</span>
                            <span className="text-2xl font-bold text-primary print:text-black">
                                {formatCurrency(totalAmount)}
                            </span>
                            <span className="text-xs text-muted-foreground">({data.length} personel)</span>
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
                    /* Hide non-printable elements expressly */
                    nav, aside, header, footer, button {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
