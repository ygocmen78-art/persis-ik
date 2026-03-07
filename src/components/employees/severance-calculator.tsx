"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface SeveranceCalculatorProps {
    startDate: string | Date
    grossSalary: number
    terminationDate?: string | Date | null
    unusedLeaveDays?: number
}

export function SeveranceCalculator({ startDate, grossSalary, terminationDate, unusedLeaveDays }: SeveranceCalculatorProps) {
    // Defaults: 2026 Yılı Tahmini Değerleri
    // 2026 Asgari Ücret (Brüt): 33.030,00 TL (Kullanıcı Talebi)
    // 2026 Kıdem Tazminatı Tavanı: ~65.000 TL (Tahmini)

    // Eğer personelin maaşı 0 veya null gelirse asgari ücreti varsayılan yap
    const defaultSalary = grossSalary > 0 ? grossSalary : 33030.00

    const [salary, setSalary] = useState<number>(defaultSalary)

    // Use terminationDate from props if available as default
    const initialTerminationDate = terminationDate
        ? new Date(terminationDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]

    const [terminationDateStr, setTerminationDateStr] = useState<string>(initialTerminationDate)
    const [severanceCeiling, setSeveranceCeiling] = useState<number>(65213.78) // 2026 Tahmini Tavan

    // Annual Leave Input
    const [leaveDays, setLeaveDays] = useState<number>(unusedLeaveDays || 0)

    // Results
    const [tenure, setTenure] = useState<{ years: number, months: number, days: number } | null>(null)
    const [kidemResult, setKidemResult] = useState<{ gross: number, tax: number, net: number } | null>(null)
    const [ihbarResult, setIhbarResult] = useState<{ weeks: number, gross: number, tax: number, net: number } | null>(null)
    const [leaveResult, setLeaveResult] = useState<{ gross: number, tax: number, net: number } | null>(null)
    const [totalNet, setTotalNet] = useState<number>(0)

    const calculate = () => {
        const start = new Date(startDate)
        const end = new Date(terminationDateStr)

        if (end < start) {
            alert("Çıkış tarihi giriş tarihinden önce olamaz.")
            return
        }

        // 1. Calculate Tenure (Basit yıl/ay/gün hesabı)
        let years = end.getFullYear() - start.getFullYear()
        let months = end.getMonth() - start.getMonth()
        let days = end.getDate() - start.getDate()

        if (days < 0) {
            months -= 1
            // Get days in previous month
            const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0)
            days += prevMonth.getDate()
        }
        if (months < 0) {
            years -= 1
            months += 12
        }

        setTenure({ years, months, days })

        // 2. Calculate Kıdem Tazminatı
        // Kıdem should define base salary as min(gross, ceiling)
        const baseSalary = Math.min(salary, severanceCeiling)

        // Total tenure in years (float) for calculation
        // Standard approach: (Years + Months/12 + Days/365) * BaseSalary
        let totalYearRatio = years + (months / 12) + (days / 365)

        let kidemGross = totalYearRatio * baseSalary

        // RULE: Must have worked for at least 1 year.
        if (years < 1) {
            kidemGross = 0;
        }

        const kidemTax = kidemGross * 0.00759 // Damga Vergisi (Binde 7.59)
        const kidemNet = kidemGross - kidemTax

        setKidemResult({
            gross: kidemGross,
            tax: kidemTax,
            net: kidemNet
        })

        // 3. Calculate İhbar Tazminatı
        // İhbar süresi (Hafta)
        let ihbarWeeks = 2
        const totalMonths = (years * 12) + months + (days / 30)

        if (totalMonths < 6) ihbarWeeks = 2
        else if (totalMonths < 18) ihbarWeeks = 4
        else if (totalMonths < 36) ihbarWeeks = 6
        else ihbarWeeks = 8

        // Daily Salary = Monthly / 30
        const dailySalary = salary / 30
        const ihbarGross = dailySalary * (ihbarWeeks * 7)

        // Taxes for İhbar: Intecome Tax (Gelir V.) + Stamp Tax (Damga V.)
        // Income Tax is progressive, usually starts at 15%. Simplification: 15%
        const incomeTaxRate = 0.15
        const stampTaxRate = 0.00759

        const ihbarIncomeTax = ihbarGross * incomeTaxRate
        const ihbarStampTax = ihbarGross * stampTaxRate

        const ihbarNet = ihbarGross - ihbarIncomeTax - ihbarStampTax

        setIhbarResult({
            weeks: ihbarWeeks,
            gross: ihbarGross,
            tax: ihbarIncomeTax + ihbarStampTax,
            net: ihbarNet
        })

        // 4. Calculate Annual Leave Pay (Yıllık İzin Ücreti)
        const leaveGross = leaveDays * dailySalary
        // Simplification: Taxed similarly to normal wage (Income + Stamp + SSI usually, but simplified to typical progressive tax base)
        const leaveTax = leaveGross * (incomeTaxRate + stampTaxRate)
        const leaveNet = leaveGross - leaveTax

        setLeaveResult({
            gross: leaveGross,
            tax: leaveTax,
            net: leaveNet
        })

        // Total
        setTotalNet(kidemNet + ihbarNet + leaveNet)
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tazminat Hesaplama (Kıdem, İhbar & İzin)</CardTitle>
                <CardDescription>
                    Personelin giriş tarihi ve brüt maaşı baz alınarak hesaplanır.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>İşe Giriş Tarihi</Label>
                        <Input disabled value={format(new Date(startDate), "d MMMM yyyy", { locale: tr })} />
                    </div>
                    <div className="space-y-2">
                        <Label>İşten Çıkış Tarihi</Label>
                        <Input
                            type="date"
                            value={terminationDateStr}
                            onChange={(e) => setTerminationDateStr(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Brüt Maaş (TL)</Label>
                        <Input
                            type="number"
                            value={salary}
                            onChange={(e) => setSalary(Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">Varsayılan: 2026 Asgari Ücret (33.030,00 TL)</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Kullanılmayan İzin Günü</Label>
                        <Input
                            type="number"
                            value={leaveDays}
                            onChange={(e) => setLeaveDays(Number(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Kıdem Tazminatı Tavanı (TL)</Label>
                        <Input
                            type="number"
                            value={severanceCeiling}
                            onChange={(e) => setSeveranceCeiling(Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">2026-1 dönemi tavan tutarı.</p>
                    </div>
                </div>

                <Button onClick={calculate} className="w-full md:w-auto">Hesapla</Button>

                <Separator />

                {tenure && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold mb-2">Hizmet Süresi</h4>
                        <p>{tenure.years} Yıl, {tenure.months} Ay, {tenure.days} Gün</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* KIDEM */}
                    {kidemResult && (
                        <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base text-blue-700 dark:text-blue-400">Kıdem Tazminatı</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Brüt:</span>
                                    <span className="font-medium">{formatCurrency(kidemResult.gross)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Vergi:</span>
                                    <span className="text-red-500 dark:text-red-400">-{formatCurrency(kidemResult.tax)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between text-base font-bold">
                                    <span>Net:</span>
                                    <span className="text-blue-700 dark:text-blue-400">{formatCurrency(kidemResult.net)}</span>
                                </div>
                                {kidemResult.gross === 0 && tenure && tenure.years < 1 && (
                                    <p className="text-xs text-red-500 pt-2">1 yılı doldurmadığı için hak kazanmaz.</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* İHBAR */}
                    {ihbarResult && (
                        <Card className="bg-orange-50/50 border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base text-orange-700 dark:text-orange-400">İhbar Tazminatı</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="text-muted-foreground">Süre:</span>
                                    <span className="font-medium">{ihbarResult.weeks} Hafta</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Brüt:</span>
                                    <span className="font-medium">{formatCurrency(ihbarResult.gross)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Vergi:</span>
                                    <span className="text-red-500 dark:text-red-400">-{formatCurrency(ihbarResult.tax)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between text-base font-bold">
                                    <span>Net:</span>
                                    <span className="text-orange-700 dark:text-orange-400">{formatCurrency(ihbarResult.net)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* YILLIK İZİN */}
                    {leaveResult && (
                        <Card className="bg-green-50/50 border-green-100 dark:bg-green-500/10 dark:border-green-500/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base text-green-700 dark:text-green-400">Yıllık İzin</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="text-muted-foreground">Süre:</span>
                                    <span className="font-medium">{leaveDays} Gün</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Brüt:</span>
                                    <span className="font-medium">{formatCurrency(leaveResult.gross)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Vergi:</span>
                                    <span className="text-red-500 dark:text-red-400">-{formatCurrency(leaveResult.tax)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between text-base font-bold">
                                    <span>Net:</span>
                                    <span className="text-green-700 dark:text-green-400">{formatCurrency(leaveResult.net)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* TOTAL */}
                {totalNet > 0 && (
                    <Card className="bg-slate-900 text-white mt-6">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between text-xl md:text-2xl font-bold">
                                <span>Toplam Ödenecek Tutar:</span>
                                <span>{formatCurrency(totalNet)}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 text-right">
                                * Hesaplamalar bilgi amaçlıdır. Net tutarlar vergi dilimine ve yasal kesintilere göre değişebilir.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </CardContent>
        </Card>
    )
}
