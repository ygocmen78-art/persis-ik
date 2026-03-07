"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,

    getFilteredRowModel,
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
import { Trash2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    onFilteredRowCountChange?: (count: number) => void
    onDeleteSelected?: (ids: number[]) => Promise<void>
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
    // If props are provided, use them. Otherwise, use local state (though we intend to use controlled).
    const isControlled = searchQuery !== undefined && onSearchChange !== undefined
    const [localGlobalFilter, setLocalGlobalFilter] = React.useState("")

    const globalFilter = isControlled ? searchQuery : localGlobalFilter
    const setGlobalFilter = isControlled ? onSearchChange : setLocalGlobalFilter

    const [rowSelection, setRowSelection] = React.useState({})
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false)

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),

        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            rowSelection,
        },
        enableRowSelection: true,
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
        <div className="space-y-4">
            <div className="flex items-center justify-end py-2 h-[52px]">
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
            <div className="rounded-md border bg-white dark:bg-zinc-950">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
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
                                        // Prevent row selection if clicking button actions
                                        if ((e.target as HTMLElement).closest('button')) return;
                                        row.toggleSelected(!row.getIsSelected())
                                    }}
                                    onDoubleClick={(e) => {
                                        // Prevent navigation if clicking checkbox or actions
                                        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="checkbox"]')) return;
                                        window.location.href = `/employees/${(row.original as any).id}`
                                    }}
                                    className="cursor-pointer hover:bg-muted/50 text-zinc-900 dark:text-zinc-100"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Sonuç bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} / {table.getFilteredRowModel().rows.length} satır seçildi.
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
