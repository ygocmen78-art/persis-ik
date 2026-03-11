"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UserPlus, Key, Trash2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { createAppUser, updateUserPassword, deleteAppUser } from "@/actions/user-actions"

interface User {
    id: number;
    username: string;
    role: string;
    createdAt: string;
}

interface UserManagerProps {
    initialUsers: any[]
}

export function UserManager({ initialUsers }: UserManagerProps) {
    const [users, setUsers] = useState(initialUsers)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isPasswordOpen, setIsPasswordOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    // Form states
    const [newUsername, setNewUsername] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [updatePasswordValue, setUpdatePasswordValue] = useState("")

    const handleAddUser = async () => {
        if (!newUsername || !newPassword) {
            toast.error("Lütfen tüm alanları doldurun.")
            return
        }
        const res = await createAppUser(newUsername, newPassword)
        if (res.success) {
            toast.success(res.message)
            setIsAddOpen(false)
            setNewUsername("")
            setNewPassword("")
            // Refresh logic - ideally use revalidatePath or fetch again
            window.location.reload()
        } else {
            toast.error(res.message)
        }
    }

    const handleUpdatePassword = async () => {
        if (!selectedUser || !updatePasswordValue) return
        const res = await updateUserPassword(selectedUser.id, updatePasswordValue)
        if (res.success) {
            toast.success(res.message)
            setIsPasswordOpen(false)
            setUpdatePasswordValue("")
        } else {
            toast.error(res.message)
        }
    }

    const handleDeleteUser = async (id: number) => {
        if (users.length <= 1) {
            toast.error("Son kullanıcıyı silemezsiniz.")
            return
        }
        if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return
        const res = await deleteAppUser(id)
        if (res.success) {
            toast.success("Kullanıcı silindi.")
            setUsers(users.filter(u => u.id !== id))
        } else {
            toast.error(res.message)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle>Kullanıcı Yönetimi</CardTitle>
                    <CardDescription>Uygulamaya erişebilen kullanıcıları yönetin ve şifrelerini güncelleyin.</CardDescription>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90">
                            <UserPlus className="mr-2 h-4 w-4" /> Yeni Kullanıcı
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
                            <DialogDescription>Programı kullanması için yeni bir hesap tanımlayın.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Kullanıcı Adı</Label>
                                <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Örn: muhasebe" />
                            </div>
                            <div className="space-y-2">
                                <Label>Şifre</Label>
                                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>İptal</Button>
                            <Button onClick={handleAddUser}>Oluştur</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kullanıcı Adı</TableHead>
                            <TableHead>Yetki</TableHead>
                            <TableHead>Kayıt Tarihi</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.username}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                        {user.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Dialog open={isPasswordOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                                        setIsPasswordOpen(open)
                                        if (open) setSelectedUser(user)
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Key className="h-4 w-4 mr-2" /> Şifre Değiştir
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Şifre Güncelle ({user.username})</DialogTitle>
                                                <DialogDescription>Bu kullanıcının giriş şifresini değiştiriyorsunuz.</DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4">
                                                <Label>Yeni Şifre</Label>
                                                <Input type="password" value={updatePasswordValue} onChange={(e) => setUpdatePasswordValue(e.target.value)} className="mt-2" placeholder="••••••" />
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>İptal</Button>
                                                <Button onClick={handleUpdatePassword}>Şifreyi Güncelle</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUser(user.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-semibold">Biliyor muydunuz?</p>
                        <p className="mt-1 opacity-90">Program ilk açıldığında otomatik olarak <strong>admin</strong> kullanıcısı ve <strong>9685**</strong> şifresini oluşturur. Güvenliğiniz için bu varsayılan şifreyi değiştirmeniz önerilir.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
