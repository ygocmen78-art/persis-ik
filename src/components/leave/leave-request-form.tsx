"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { isHoliday, calculateLeaveDays, calculateReturnDate } from "@/lib/holiday-utils"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { tr } from "date-fns/locale"
import { addLeaveRequest, getEmployeeLeaveBalance, updateLeaveRequest } from "@/actions/leaves"
import { LEAVE_CATEGORIES, LEAVE_TYPES } from "@/lib/leave-types"

const leaveFormSchema = z.object({
    employeeId: z.string().min(1, "Personel seçimi zorunludur."),
    type: z.string().min(1, "İzin türü seçimi zorunludur."),
    startDate: z.date(),
    endDate: z.date(),
    description: z.string().optional(),
})

interface LeaveRequestFormProps {
    employees?: { id: number; firstName: string; lastName: string }[]
    initialData?: {
        id: number;
        employeeId: number;
        type: string;
        startDate: string;
        endDate: string;
        description?: string;
    }
    onSuccess?: () => void
}

export function LeaveRequestForm({ employees, initialData, onSuccess }: LeaveRequestFormProps) {
    const [balance, setBalance] = useState<{ entitlement: number; used: number; remaining: number } | null>(null)
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof leaveFormSchema>>({
        resolver: zodResolver(leaveFormSchema),
        defaultValues: {
            employeeId: initialData?.employeeId.toString() || "",
            type: initialData?.type || "",
            startDate: initialData?.startDate ? new Date(initialData.startDate) : undefined,
            endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
            description: initialData?.description || "",
        }
    })

    const selectedEmployeeId = form.watch("employeeId")

    useEffect(() => {
        async function fetchBalance() {
            if (selectedEmployeeId) {
                const bal = await getEmployeeLeaveBalance(parseInt(selectedEmployeeId))
                setBalance(bal)
            } else {
                setBalance(null)
            }
        }
        fetchBalance()
    }, [selectedEmployeeId])

    const startDate = form.watch("startDate")
    const endDate = form.watch("endDate")
    const [calculatedDays, setCalculatedDays] = useState<number>(0)
    const [returnDate, setReturnDate] = useState<Date | null>(null)


    useEffect(() => {
        if (startDate && endDate) {
            setCalculatedDays(calculateLeaveDays(new Date(startDate), new Date(endDate)))
            setReturnDate(calculateReturnDate(new Date(endDate)))
        } else {
            setCalculatedDays(0)
            setReturnDate(null)
        }
    }, [startDate, endDate])

    async function onSubmit(data: z.infer<typeof leaveFormSchema>) {
        if (!returnDate) return

        // Show info warning for Annual Leave if balance is exceeded, but don't block
        if (data.type === "annual" && balance) {
            let available = balance.remaining
            // Only add back days if we are EDITING an existing annual leave
            if (initialData?.id && initialData.type === "annual") {
                const start = new Date(initialData.startDate)
                const end = new Date(initialData.endDate)
                const currentDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                available += currentDays
            }

            if (calculatedDays > available) {
                toast.info("Bilgi: Personelin yıllık izin bakiyesi aşılıyor.", {
                    description: `Bu personel için yeterli bakiye bulunmamaktadır, ancak talep kaydedilecek.`
                })
            }
        }

        setLoading(true)
        try {
            const payload = {
                employeeId: parseInt(data.employeeId),
                type: data.type,
                startDate: data.startDate.toISOString(),
                endDate: data.endDate.toISOString(),
                returnDate: returnDate.toISOString(),
                description: data.description,
            }

            const result = initialData?.id
                ? await updateLeaveRequest(initialData.id, payload)
                : await addLeaveRequest(payload)

            if (result.success) {
                toast.success(result.message)
                if (!initialData) {
                    form.reset()
                    setBalance(null)
                    setCalculatedDays(0)
                }
                onSuccess?.()
            } else {
                toast.error(result.message)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {!initialData?.employeeId && employees && (
                    <FormField
                        control={form.control}
                        name="employeeId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Personel</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Personel seçin" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {employees.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.firstName} {emp.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {balance && (
                    <div className="grid grid-cols-3 gap-2 text-center text-sm bg-muted p-2 rounded-md">
                        <div>
                            <span className="block font-medium text-xs text-muted-foreground uppercase">Hakedilen</span>
                            <span className="font-bold text-lg">{balance.entitlement} Gün</span>
                        </div>
                        <div>
                            <span className="block font-medium text-xs text-muted-foreground uppercase">Kullanılan</span>
                            <span className="font-bold text-lg text-blue-600">{balance.used} Gün</span>
                        </div>
                        <div>
                            <span className="block font-medium text-xs text-muted-foreground uppercase">Kalan</span>
                            <span className={cn("font-bold text-lg", (balance.entitlement - balance.used) < 0 ? "text-red-600" : "text-green-600")}>
                                {balance.entitlement - balance.used} Gün
                            </span>
                        </div>
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>İzin Türü</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="İzin türü seçin" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>{LEAVE_CATEGORIES.annual}</SelectLabel>
                                        <SelectItem value="annual">Yıllık İzin</SelectItem>
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel>{LEAVE_CATEGORIES.paid}</SelectLabel>
                                        {LEAVE_TYPES.filter(t => t.category === "paid").map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                    <SelectGroup>
                                        <SelectLabel>Diğer</SelectLabel>
                                        <SelectItem value="sick">Rapor/Hastalık</SelectItem>
                                        <SelectItem value="unpaid">Ücretsiz İzin</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Başlangıç Tarihi</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        {...field}
                                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bitiş Tarihi</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        {...field}
                                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {calculatedDays > 0 && returnDate && (
                    <div className="space-y-4 mb-4">
                        <div className="bg-blue-50 text-blue-700 p-4 rounded-md border border-blue-200 text-center">
                            <div className="flex justify-center gap-8 items-center">
                                <div>
                                    <span className="font-semibold block text-2xl">{calculatedDays} Gün</span>
                                    <span className="text-sm">kullanılacak izin.</span>
                                </div>
                                <div className="border-l border-blue-200 pl-8">
                                    <span className="font-semibold block text-xl">{format(returnDate, "d MMMM yyyy", { locale: tr })}</span>
                                    <span className="text-sm">İşe Başlama Tarihi</span>
                                </div>
                            </div>
                        </div>

                        {form.watch("type") === "annual" && balance && (() => {
                            let available = balance.remaining
                            if (initialData && initialData.type === "annual") {
                                const start = new Date(initialData.startDate)
                                const end = new Date(initialData.endDate)
                                const currentDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                                available += currentDays
                            }

                            if (calculatedDays > available) {
                                return (
                                    <div className="bg-orange-50 text-orange-700 p-2 rounded-md border border-orange-200 text-[11px] flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                        <span>Not: Bu işlem sonucunda yıllık izin bakiyesi eksiye düşecektir. (Kalan: {available} gün)</span>
                                    </div>
                                )
                            }
                            return null
                        })()}
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Açıklama (Opsiyonel)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="İzin nedeninizi buraya yazabilirsiniz..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData?.id ? "İzni Güncelle" : "İzni Kaydet"}
                </Button>
            </form>
        </Form>
    )
}
