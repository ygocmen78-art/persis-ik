"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { getExpenses, deleteExpense, addExpense } from "@/actions/expenses"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Expense = {
    id: number
    description: string
    amount: number
    currency: string | null
    date: string
    category: string | null
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)

    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        currency: "TRY",
        date: new Date().toISOString().split("T")[0],
        category: ""
    })

    const loadExpenses = async () => {
        setLoading(true)
        const data = await getExpenses()
        setExpenses(data as Expense[])
        setLoading(false)
    }

    useEffect(() => {
        loadExpenses()
    }, [])

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        await addExpense({
            description: formData.description,
            amount: parseFloat(formData.amount),
            currency: formData.currency,
            date: formData.date,
            category: formData.category || undefined
        })
        setDialogOpen(false)
        setFormData({
            description: "",
            amount: "",
            currency: "TRY",
            date: new Date().toISOString().split("T")[0],
            category: ""
        })
        loadExpenses()
    }

    const handleDelete = async (id: number) => {
        if (confirm("Bu harcamayı silmek istediğinizden emin misiniz?")) {
            await deleteExpense(id)
            loadExpenses()
        }
    }

    const formatCurrency = (amount: number, currency: string | null) => {
        const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺"
        return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString("tr-TR")
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Harcamalar</h2>
                    <p className="text-muted-foreground">
                        Harcama kayıtlarını buradan yönetebilirsiniz.
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Yeni Harcama Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni Harcama Ekle</DialogTitle>
                            <DialogDescription>
                                Harcama bilgilerini girin.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <Label htmlFor="description">Açıklama</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="amount">Tutar</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="currency">Para Birimi</Label>
                                    <select
                                        id="currency"
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="TRY">TRY (₺)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="date">Tarih</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="category">Kategori</Label>
                                    <Input
                                        id="category"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="Opsiyonel"
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full">Kaydet</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Harcama Listesi</CardTitle>
                        <CardDescription>Tüm harcama kayıtları</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-muted-foreground text-center py-4">Yükleniyor...</p>
                        ) : expenses.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">Henüz harcama kaydı yok</p>
                        ) : (
                            <div className="space-y-4">
                                {expenses.map((expense) => (
                                    <div key={expense.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                                        <div className="space-y-1 flex-1">
                                            <p className="text-sm font-medium leading-none">{expense.description}</p>
                                            <div className="flex gap-4 text-xs text-muted-foreground">
                                                <span>{formatDate(expense.date)}</span>
                                                {expense.category && <span className="text-primary">• {expense.category}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="font-medium text-right">
                                                {formatCurrency(expense.amount, expense.currency)}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(expense.id)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
