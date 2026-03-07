"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
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
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { addEmployee, updateEmployee } from "@/actions/employees"
import { useRouter } from "next/navigation"
import { format, differenceInYears } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { tr } from "date-fns/locale"
import { useState, useEffect, useId } from "react"

// Şube tipi
type Branch = {
    id: number
    name: string
    sgk_number?: string | null
}

const employeeFormSchema = z.object({
    firstName: z.string().min(2, {
        message: "İsim en az 2 karakter olmalıdır.",
    }),
    lastName: z.string().min(2, {
        message: "Soyisim en az 2 karakter olmalıdır.",
    }),
    email: z.string().email("Geçerli bir email adresi giriniz.").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    tcNumber: z.string().min(11, {
        message: "TC Kimlik No 11 haneli olmalıdır.",
    }).max(11, {
        message: "TC Kimlik No 11 haneli olmalıdır.",
    }),
    birthDate: z.date().optional(),
    gender: z.string().min(1, { message: "Cinsiyet seçimi zorunludur." }),
    startDate: z.date(),
    branchId: z.string().optional(),
    sgkBranchId: z.string().min(1, "Resmi Şube zorunludur."),
    department: z.string().min(1, "Departman zorunludur."),
    position: z.string().min(1, "SGK Meslek zorunludur."),
    salary: z.string().min(1, "Net maaş zorunludur."),
    grossSalary: z.string().optional(),
    iban: z.string().optional(),
    besStatus: z.string().optional(),
    leaveCarryover: z.string().optional(),
})

type EmployeeFormValues = z.infer<typeof employeeFormSchema>

export function EmployeeForm({
    branches,
    initialData,
    existingPositions = [],
    existingDepartments = []
}: {
    branches: Branch[]
    initialData?: any
    existingPositions?: string[]
    existingDepartments?: string[]
}) {
    const router = useRouter()
    const [age, setAge] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [departmentMode, setDepartmentMode] = useState<"select" | "input">("select")
    const positionListId = useId()

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeFormSchema),
        defaultValues: initialData ? {
            firstName: initialData.firstName,
            lastName: initialData.lastName,
            tcNumber: initialData.tcNumber || "",
            email: initialData.email || "",
            phone: initialData.phone || "",
            position: initialData.position || "",
            salary: initialData.salary?.toString() || "",
            grossSalary: initialData.grossSalary?.toString() || "",
            iban: initialData.iban || "",
            besStatus: initialData.besStatus || "auto",
            branchId: initialData.branchId?.toString() || "",
            sgkBranchId: initialData.sgkBranchId?.toString() || initialData.branchId?.toString() || "",
            department: initialData.department || "",
            gender: initialData.gender || "male",
            birthDate: initialData.birthDate ? new Date(initialData.birthDate) : undefined,
            startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
            leaveCarryover: initialData.leaveCarryover?.toString() || "0",
        } : {
            firstName: "",
            lastName: "",
            tcNumber: "",
            email: "",
            phone: "",
            position: "",
            salary: "",
            grossSalary: "",
            iban: "",
            besStatus: "auto",
            gender: "male",
        },
    })

    // Yaş hesaplama
    const birthDate = form.watch("birthDate")
    useEffect(() => {
        if (birthDate) {
            setAge(differenceInYears(new Date(), birthDate))
        } else {
            setAge(null)
        }
    }, [birthDate])

    // Otomatik BES Mantığı (18 ile 44 yaş arası auto)
    useEffect(() => {
        if (age !== null) {
            if (age >= 18 && age < 45) {
                form.setValue("besStatus", "auto")
            } else {
                form.setValue("besStatus", "voluntary")
            }
        }
    }, [age, form])

    async function onSubmit(data: EmployeeFormValues) {
        setLoading(true)
        try {
            let result;
            const payload = {
                ...data,
                branchId: data.sgkBranchId ? parseInt(data.sgkBranchId) : undefined,
                sgkBranchId: parseInt(data.sgkBranchId),
                birthDate: data.birthDate?.toISOString(),
                startDate: data.startDate.toISOString(),
                salary: parseFloat(data.salary),
                grossSalary: data.grossSalary ? parseFloat(data.grossSalary) : undefined,
                iban: data.iban,
                leaveCarryover: data.leaveCarryover ? parseInt(data.leaveCarryover) : 0,
            }

            if (initialData) {
                result = await updateEmployee(initialData.id, payload)
            } else {
                result = await addEmployee(payload)
            }

            if (result?.success) {
                toast.success(result.message)
                router.push("/employees")
                router.refresh()
            } else {
                toast.error(result?.message || "Bir hata oluştu")
            }
        } catch (error) {
            toast.error("Beklenmedik bir hata oluştu")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Personel Bilgileri</CardTitle>
                <CardDescription>Tüm alanları eksiksiz doldurunuz.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* Kişisel Bilgiler */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>İsim</FormLabel>
                                        <FormControl><Input placeholder="Ahmet" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Soyisim</FormLabel>
                                        <FormControl><Input placeholder="Yılmaz" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tcNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>TC Kimlik No</FormLabel>
                                        <FormControl><Input placeholder="11 haneli TC" maxLength={11} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefon</FormLabel>
                                        <FormControl><Input placeholder="0555 555 55 55" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cinsiyet</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seçiniz" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="male">Erkek</SelectItem>
                                                <SelectItem value="female">Kadın</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="birthDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Doğum Tarihi {age !== null && <span className="text-muted-foreground ml-2">({age} Yaş)</span>}</FormLabel>
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

                        <div className="border-t pt-4">
                            <h3 className="text-lg font-medium mb-4">Şirket & Pozisyon Bilgileri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                    control={form.control}
                                    name="sgkBranchId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Şube / Firma (SGK)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Şube seçin" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {branches
                                                        .filter(b => b.sgk_number && b.sgk_number.length > 0)
                                                        .map(branch => (
                                                            <SelectItem key={branch.id} value={branch.id.toString()}>
                                                                {branch.name}
                                                            </SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                            <FormDescription className="text-xs">Sadece SGK numarası girilmiş resmi şubeler listelenir.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="department"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Departman</FormLabel>
                                            {departmentMode === "select" && !(!existingDepartments.includes(field.value) && field.value !== "") ? (
                                                <div className="flex gap-2">
                                                    <Select
                                                        value={existingDepartments.includes(field.value) ? field.value : ""}
                                                        onValueChange={(value) => {
                                                            if (value === "__new__") {
                                                                setDepartmentMode("input")
                                                                field.onChange("")
                                                            } else {
                                                                field.onChange(value)
                                                            }
                                                        }}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Departman seçin..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {existingDepartments.map((dept) => (
                                                                <SelectItem key={dept} value={dept}>
                                                                    {dept}
                                                                </SelectItem>
                                                            ))}
                                                            <SelectItem value="__new__" className="font-semibold text-primary">
                                                                + Yeni Departman Ekle
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Yeni departman adı yazın..."
                                                            {...field}
                                                            autoFocus
                                                        />
                                                    </FormControl>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setDepartmentMode("select")
                                                            field.onChange("")
                                                        }}
                                                    >
                                                        İptal
                                                    </Button>
                                                </div>
                                            )}
                                            <FormDescription>
                                                {departmentMode === "select"
                                                    ? "Listeden seçin veya 'Yeni Departman Ekle' seçeneğini kullanın."
                                                    : "Yeni departman ismini yazın."}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {/* Cleaned up duplicate logic */}
                                <FormField
                                    control={form.control}
                                    name="position"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>SGK Meslek</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        placeholder="Örn: Uzman"
                                                        {...field}
                                                        list={positionListId}
                                                        autoComplete="off"
                                                    />
                                                    <datalist id={positionListId}>
                                                        {existingPositions.map((pos, index) => (
                                                            <option key={index} value={pos} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                Listeden seçebilir veya yeni yazabilirsiniz.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="leaveCarryover"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Önceki Kullanılan İzin (Gün)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormDescription>Sistemden önce kullanılan toplam izin günü (hakedilenden düşülür)</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>İşe Giriş Tarihi</FormLabel>
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
                                name="salary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Net Maaş</FormLabel>
                                        <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="grossSalary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Brüt Maaş</FormLabel>
                                        <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                                        <FormDescription className="text-xs">BES kesintisi brüt maaş üzerinden hesaplanır.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="besStatus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>BES Durumu</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="auto">Otomatik Katılım (Zorunlu)</SelectItem>
                                                <SelectItem value="voluntary">Gönüllü</SelectItem>
                                                <SelectItem value="none">BES Yok / Çıkış</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-xs">18-45 yaş arası için otomatik seçilir. BES'ten çıkış için 'BES Yok / Çıkış' seçin.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="iban"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-3">
                                        <FormLabel>IBAN</FormLabel>
                                        <FormControl>
                                            <Input placeholder="TR..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </div>

                        <div className="flex justify-end space-x-2 pt-6">
                            <Button variant="outline" type="button" onClick={() => router.back()}>İptal</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Kaydediliyor..." : "Kaydet"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card >
    )
}
