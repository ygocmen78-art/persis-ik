"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash, UserMinus, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Badge } from "@/components/ui/badge"
import { differenceInYears, format } from "date-fns"
import { tr } from "date-fns/locale"
import { terminateEmployee, deleteEmployee, cancelTermination } from "@/actions/employees"
import { toast } from "sonner"
import { useState } from "react"
import { TerminationDialog } from "./termination-dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export type Employee = {
    id: string
    name: string
    email: string
    department: string
    position: string
    status: "active" | "inactive" | "on_leave"
    gender: "male" | "female"
    birthDate?: string
    startDate?: string
    terminationDate?: string | null
    avatarUrl?: string
    branchName?: string | null
    sgkBranchName?: string | null
    salary?: number
    tcNumber?: string | null
    phone?: string | null
    iban?: string | null
}

async function handleDelete(id: number) {
    if (!confirm("Personeli tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return
    const res = await deleteEmployee(id)
    if (res.success) toast.success(res.message)
    else toast.error(res.message)
}

async function handleCancelTermination(id: number) {
    if (!confirm("Personelin çıkış işlemini iptal etmek ve tekrar AKTİF hale getirmek istiyor musunuz?")) return
    const res = await cancelTermination(id)
    if (res.success) toast.success(res.message)
    else toast.error(res.message)
}

import { Checkbox } from "@/components/ui/checkbox"

export const columns: ColumnDef<Employee>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Tümünü seç"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Satır seç"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: "Ad Soyad",
        cell: ({ row }) => {
            const employee = row.original



            return (
                <div className="flex items-center gap-3">

                    <div className="flex flex-col">
                        <span className="font-medium">{employee.name}</span>
                        <span className="text-xs text-muted-foreground">{employee.email}</span>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "tcNumber",
        header: "TC Kimlik No",
        cell: ({ row }) => {
            const tc = row.original.tcNumber
            return <span className="font-mono text-sm">{tc || "-"}</span>
        }
    },
    {
        id: "age",
        header: "Yaş",
        cell: ({ row }) => {
            const dob = row.original.birthDate
            if (!dob) return "-"
            return differenceInYears(new Date(), new Date(dob))
        }
    },
    {
        id: "startDate",
        header: "İşe Giriş",
        cell: ({ row }) => {
            const start = row.original.startDate
            if (!start) return "-"
            return format(new Date(start), "d MMM yyyy", { locale: tr })
        }
    },
    {
        id: "terminationDate",
        header: "Çıkış Tarihi",
        cell: ({ row }) => {
            const end = row.original.terminationDate
            if (!end) return <span className="text-muted-foreground">-</span>
            return <span className="text-red-600 font-medium">{format(new Date(end), "d MMM yyyy", { locale: tr })}</span>
        }
    },
    {
        id: "company",
        header: "Şube",
        cell: ({ row }) => {
            return (
                <Badge variant="outline" className="font-normal text-muted-foreground">
                    {row.original.sgkBranchName}
                </Badge>
            )
        }
    },
    {
        accessorKey: "salary",
        header: "Maaş",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("salary"))
            const formatted = new Intl.NumberFormat("tr-TR", {
                style: "currency",
                currency: "TRY",
            }).format(amount || 0)

            return <div className="font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "department",
        header: "Departman",
    },
    {
        accessorKey: "position",
        header: "SGK Meslek",
    },
    {
        accessorKey: "status",
        header: "Durum",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "active" ? "default" : status === "on_leave" ? "secondary" : "destructive"}>
                    {status === "active" ? "Aktif" : status === "on_leave" ? "İzinli" : "Pasif"}
                </Badge>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const employee = row.original
            const [showTerminationDialog, setShowTerminationDialog] = useState(false)
            const [showDeleteDialog, setShowDeleteDialog] = useState(false)

            const handleDeleteConfirm = async () => {
                const res = await deleteEmployee(parseInt(employee.id))
                if (res.success) {
                    toast.success(res.message)
                } else {
                    toast.error(res.message)
                }
                setShowDeleteDialog(false)
            }

            return (
                <>
                    <div className="flex items-center gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Menü</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => navigator.clipboard.writeText(employee.id)}
                                >
                                    ID Kopyala
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />

                                {employee.status === "active" && (
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault()
                                            setShowTerminationDialog(true)
                                        }}
                                        className="text-orange-600 focus:text-orange-600 cursor-pointer"
                                    >
                                        <UserMinus className="mr-2 h-4 w-4" /> İşten Çıkar
                                    </DropdownMenuItem>
                                )}

                                {(employee.status === "inactive" || employee.status as string === "passive") ? (
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleCancelTermination(parseInt(employee.id))
                                        }}
                                        className="text-green-600 focus:text-green-600 cursor-pointer"
                                    >
                                        <UserCheck className="mr-2 h-4 w-4" /> Çıkışı İptal Et
                                    </DropdownMenuItem>
                                ) : null}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>

                    <TerminationDialog
                        open={showTerminationDialog}
                        onOpenChange={setShowTerminationDialog}
                        employeeId={employee.id}
                        employeeName={employee.name}
                    />

                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Silmek istediğinize emin misiniz?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Bu işlem geri alınamaz. <b>{employee.name}</b> adlı personelin kaydı ve tüm geçmiş verileri (izinler, icralar vb.) kalıcı olarak silinecektir.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                                    Sil
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )
        },
    },
]
