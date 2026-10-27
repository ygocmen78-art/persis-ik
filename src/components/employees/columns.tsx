"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash, UserMinus, UserCheck, Eye, Pencil, FileText } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { differenceInYears, format } from "date-fns"
import { tr } from "date-fns/locale"
import { terminateEmployee, deleteEmployee, cancelTermination } from "@/actions/employees"
import { toast } from "sonner"
import { useState } from "react"
import { TerminationDialog } from "./termination-dialog"
import Link from "next/link"
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
import { Checkbox } from "@/components/ui/checkbox"

export type Employee = {
    id: string
    name: string
    email: string
    department: string
    position: string
    status: "active" | "inactive" | "on_leave" | "passive"
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
    const res = await deleteEmployee(id)
    if (res.success) toast.success(res.message)
    else toast.error(res.message)
}

async function handleCancelTermination(id: number) {
    const res = await cancelTermination(id)
    if (res.success) toast.success(res.message)
    else toast.error(res.message)
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, string> = {
        active: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
        on_leave: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
        inactive: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200",
        passive: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
    }
    const labels: Record<string, string> = {
        active: "Aktif",
        on_leave: "İzinli",
        inactive: "Pasif",
        passive: "Çıkış",
    }
    return (
        <Badge variant="outline" className={variants[status] || variants.inactive}>
            {labels[status] || status}
        </Badge>
    )
}

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
                className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Satır seç"
                className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: "Çalışan",
        cell: ({ row }) => {
            const employee = row.original
            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-slate-200">
                        <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {getInitials(employee.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <Link href={`/employees/${employee.id}`} className="font-semibold text-slate-800 hover:text-primary transition-colors">
                            {employee.name}
                        </Link>
                        <span className="text-xs text-slate-500">{employee.position || "-"}</span>
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
            return <span className="font-mono text-sm text-slate-600">{tc || "-"}</span>
        }
    },
    {
        id: "age",
        header: "Yaş",
        cell: ({ row }) => {
            const dob = row.original.birthDate
            if (!dob) return <span className="text-slate-400">-</span>
            return differenceInYears(new Date(), new Date(dob))
        }
    },
    {
        accessorKey: "department",
        header: "Departman",
        cell: ({ row }) => (
            <span className="text-sm text-slate-600">{row.original.department || "-"}</span>
        )
    },
    {
        id: "company",
        header: "Şube",
        cell: ({ row }) => {
            return (
                <Badge variant="outline" className="font-normal text-slate-600 border-slate-200 bg-slate-50">
                    {row.original.sgkBranchName || "-"}
                </Badge>
            )
        }
    },
    {
        id: "startDate",
        header: "İşe Giriş",
        cell: ({ row }) => {
            const start = row.original.startDate
            if (!start) return <span className="text-slate-400">-</span>
            return <span className="text-sm text-slate-600">{format(new Date(start), "dd.MM.yyyy")}</span>
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
            return <div className="font-medium text-slate-700">{formatted}</div>
        },
    },
    {
        accessorKey: "status",
        header: "Durum",
        cell: ({ row }) => <StatusBadge status={row.getValue("status") as string} />,
    },
    {
        id: "actions",
        header: "İşlemler",
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
                    <div className="flex items-center justify-end gap-1">
                        <Link href={`/employees/${employee.id}`}>
                            <Button variant="ghost" size="icon-xs" className="text-slate-500 hover:text-primary hover:bg-primary/5">
                                <Eye className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href={`/employees/${employee.id}/edit`}>
                            <Button variant="ghost" size="icon-xs" className="text-slate-500 hover:text-primary hover:bg-primary/5">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-xs" className="text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <Link href={`/employees/${employee.id}`}>
                                    <DropdownMenuItem className="cursor-pointer">
                                        <Eye className="mr-2 h-4 w-4" /> Detay Gör
                                    </DropdownMenuItem>
                                </Link>
                                <Link href={`/employees/${employee.id}/edit`}>
                                    <DropdownMenuItem className="cursor-pointer">
                                        <Pencil className="mr-2 h-4 w-4" /> Düzenle
                                    </DropdownMenuItem>
                                </Link>

                                {employee.status === "active" && (
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault()
                                            setShowTerminationDialog(true)
                                        }}
                                        className="text-amber-600 focus:text-amber-600 cursor-pointer"
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
                                        className="text-emerald-600 focus:text-emerald-600 cursor-pointer"
                                    >
                                        <UserCheck className="mr-2 h-4 w-4" /> Çıkışı İptal Et
                                    </DropdownMenuItem>
                                ) : null}

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.preventDefault()
                                        setShowDeleteDialog(true)
                                    }}
                                    className="text-rose-600 focus:text-rose-600 cursor-pointer"
                                >
                                    <Trash className="mr-2 h-4 w-4" /> Sil
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-rose-600 hover:bg-rose-700">
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
