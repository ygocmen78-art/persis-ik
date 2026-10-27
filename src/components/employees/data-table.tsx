"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { deleteEmployees } from "@/actions/employees"
import { toast } from "sonner"
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

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    onFilteredRowCountChange?: (count: number) => void
    searchQuery?: string
    onSearchChange?: (value: string) => void
}

export function DataTable<TData, TValue>({
    columns,
    data,
    onFilteredRowCountChange,
    searchQuery,
    onSearchChange,
}: DataTableProps<TData, TValue>) {
    const isControlled = searchQuery !== undefined && onSearchChange !== undefined
    const [localGlobalFilter, setLocalGlobalFilter] = React.useState("")

    const globalFilter = isControlled ? searchQuery : localGlobalFilter
    const setGlobalFilter = isControlled ? onSearchChange : setLocalGlobalFilter

    const [rowSelection, setRowSelection] = React.useState({})
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false)
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        state: {
            rowSelection,
            pagination,
            globalFilter,
        },
        enableRowSelection: true,
        manualPagination: false,
    })

    React.useEffect(() => {
        if (onFilteredRowCountChange) {
            onFilteredRowCountChange(table.getFilteredRowModel().rows.length)
        }
    }, [table.getFilteredRowModel().rows.length, onFilteredRowCountChange])

    const handleBulkDelete = async () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows
        const ids = selectedRows.map((row: any) => parseInt(row.original.id))

        if (ids.length === 0) return

        const res = await deleteEmployees(ids)
        if (res.success) {
            toast.success(res.message)
            setRowSelection({})
        } else {
            toast.error(res.message)
        }
        setShowBulkDeleteDialog(false)
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between py-2 min-h-[44px]">
                <div className="text-sm text-slate-500">
                    {table.getFilteredSelectedRowModel().rows.length > 0 && (
                        <span className="text-primary font-medium">
                            {table.getFilteredSelectedRowModel().rows.length} satır seçildi
                        </span>
                    )}
                </div>
                {table.getFilteredSelectedRowModel().rows.length > 0 && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowBulkDeleteDialog(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Seçilenleri Sil ({table.getFilteredSelectedRowModel().rows.length})
                    </Button>
                )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-slate-50 hover:bg-slate-50">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="text-slate-600 font-semibold text-xs uppercase tracking-wide">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).closest('button')) return;
                                        row.toggleSelected(!row.getIsSelected())
                                    }}
                                    onDoubleClick={(e) => {
                                        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="checkbox"]')) return;
                                        window.location.href = `/employees/${(row.original as any).id}`
                                    }}
                                    className="cursor-pointer hover:bg-blue-50/60 text-slate-700 transition-colors"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center text-slate-400">
                                    Sonuç bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
                <div className="text-sm text-slate-500">
                    Toplam <span className="font-semibold text-slate-700">{table.getFilteredRowModel().rows.length}</span> kayıt
                    {table.getPageCount() > 1 && (
                        <span className="ml-1">— Sayfa {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>Sayfa başı</span>
                        <Select
                            value={table.getState().pagination.pageSize.toString()}
                            onValueChange={(value) => table.setPageSize(Number(value))}
                        >
                            <SelectTrigger className="h-8 w-[70px] bg-white border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50, 100].map((size) => (
                                    <SelectItem key={size} value={size.toString()}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="border-slate-200"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="border-slate-200"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Toplu Silme İşlemi</AlertDialogTitle>
                        <AlertDialogDescription>
                            Seçili <b>{table.getFilteredSelectedRowModel().rows.length}</b> personeli silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                            Evet, Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
