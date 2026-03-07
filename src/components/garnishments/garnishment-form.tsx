"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
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
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { addGarnishment } from "@/actions/garnishments"
import { toast } from "sonner"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"

const garnishmentFormSchema = z.object({
    employeeId: z.string().min(1, "Personel seçimi zorunludur."),
    fileNumber: z.string().min(1, {
        message: "Dosya numarası zorunludur.",
    }),
    officeName: z.string().min(1, {
        message: "İcra dairesi zorunludur.",
    }),
    creditor: z.string().optional(),
    totalAmount: z.string().min(1, {
        message: "Toplam borç tutarı zorunludur.",
    }),
    deductionAmount: z.string().optional(),
    iban: z.string().optional(),
    notificationDate: z.string().min(1, {
        message: "Teslim tarihi zorunludur.",
    }),
})

interface GarnishmentFormProps {
    employees: { id: number; firstName: string; lastName: string }[]
}

export function GarnishmentForm({ employees }: GarnishmentFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof garnishmentFormSchema>>({
        resolver: zodResolver(garnishmentFormSchema),
        defaultValues: {
            fileNumber: "",
            officeName: "",
            creditor: "",
            totalAmount: "",
            deductionAmount: "",
            iban: "",
            notificationDate: "",
        },
    })

    async function onSubmit(values: z.infer<typeof garnishmentFormSchema>) {
        setLoading(true)
        try {
            const res = await addGarnishment({
                employeeId: parseInt(values.employeeId),
                fileNumber: values.fileNumber,
                officeName: values.officeName,
                creditor: values.creditor,
                totalAmount: parseFloat(values.totalAmount),
                deductionAmount: values.deductionAmount ? parseFloat(values.deductionAmount) : undefined,
                iban: values.iban,
                notificationDate: values.notificationDate || undefined,
            })

            if (res.success) {
                toast.success(res.message)
                setOpen(false)
                form.reset()
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error("Bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Yeni İcra Dosyası
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni İcra Dosyası Ekle</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="employeeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Personel</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Personel seçiniz" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {employees.map((employee) => (
                                                <SelectItem key={employee.id} value={employee.id.toString()}>
                                                    {employee.firstName} {employee.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="officeName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>İcra Dairesi</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Örn: Ankara 12. İcra" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="creditor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Alacaklı / Avukat</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Örn: Ahmet Yılmaz" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fileNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dosya No (Esas)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="2024/12345" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="totalAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Toplam Borç (₺)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="deductionAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Aylık Kesinti (Opsiyonel)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="iban"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>IBAN</FormLabel>
                                    <FormControl>
                                        <Input placeholder="TR..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notificationDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Teslim Tarihi</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
