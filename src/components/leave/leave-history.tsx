"use client"

import { useState } from "react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Edit2, Trash2, MoreVertical, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LeaveRequestForm } from "./leave-request-form"
import { PdfDownloadButton } from "./pdf-download-button"
import { deleteLeaveRequest } from "@/actions/leaves"
import { toast } from "sonner"
import { getLeaveLabel } from "@/lib/leave-types"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"

interface LeaveHistoryProps {
    employeeId: number;
    initialLeaves: any[];
    availableBalance?: number;
}

export function LeaveHistory({ employeeId, initialLeaves, availableBalance }: LeaveHistoryProps) {
    const [editingLeave, setEditingLeave] = useState<any | null>(null)
    const [deletingLeave, setDeletingLeave] = useState<any | null>(null)

    const handleDelete = async () => {
        if (!deletingLeave) return

        const result = await deleteLeaveRequest(deletingLeave.id)
        if (result.success) {
            toast.success("İzin kaydı silindi.")
        } else {
            toast.error(result.message)
        }
        setDeletingLeave(null)
    }

    const [isAddingLeave, setIsAddingLeave] = useState(false)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">İzin Kayıtları</h4>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() => setIsAddingLeave(true)}
                >
                    Yeni İzin Ekle
                </Button>
            </div>

            {availableBalance !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 mb-6">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Kalan Yıllık İzin</span>
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3">
                        {availableBalance} Gün
                    </Badge>
                </div>
            )}
            {initialLeaves.length > 0 ? (
                initialLeaves.map((leave) => (
                    <div key={leave.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0 group">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">
                                {getLeaveLabel(leave.type)}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {format(new Date(leave.startDate), "d MMM yyyy", { locale: tr })} - {format(new Date(leave.endDate), "d MMM yyyy", { locale: tr })}
                                <span className="ml-1 font-bold text-slate-700 dark:text-slate-300">({leave.daysCount} gün)</span>
                                {leave.status === "approved" && (
                                    <Badge variant="outline" className="ml-2 h-4 px-1 text-[10px] bg-green-50 text-green-700 border-green-200">Onaylı</Badge>
                                )}
                            </p>
                            {leave.description && (
                                <p className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">
                                    "{leave.description}"
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <PdfDownloadButton leaveId={leave.id} />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingLeave(leave)} className="cursor-pointer">
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        <span>Düzenle</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            // Trigger the same print logic as the button
                                            // We can manually trigger it or just use the button from the main UI
                                            // But for simplicity, let's just use the button that's already there
                                            // Alternatively, we could export the print logic
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Printer className="h-4 w-4 mr-2" />
                                        <span>Yazdır</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setDeletingLeave(leave)}
                                        className="cursor-pointer text-red-600 focus:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        <span>Sil</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz izin kaydı yok.</p>
            )}

            {/* New Leave Dialog */}
            <Dialog open={isAddingLeave} onOpenChange={setIsAddingLeave}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Yeni İzin Kaydı</DialogTitle>
                    </DialogHeader>
                    <LeaveRequestForm
                        initialData={{
                            id: 0,
                            employeeId,
                            type: "annual",
                            startDate: format(new Date(), "yyyy-MM-dd"),
                            endDate: format(new Date(), "yyyy-MM-dd"),
                        }}
                        onSuccess={() => setIsAddingLeave(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingLeave} onOpenChange={(open) => !open && setEditingLeave(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>İzin Kaydını Düzenle</DialogTitle>
                    </DialogHeader>
                    {editingLeave && (
                        <LeaveRequestForm
                            initialData={{
                                ...editingLeave,
                                employeeId
                            }}
                            onSuccess={() => setEditingLeave(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingLeave} onOpenChange={(open) => !open && setDeletingLeave(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>İzin Kaydını Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu izin kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve personelin izin bakiyesi güncellenir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
