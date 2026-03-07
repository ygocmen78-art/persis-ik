import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, Calendar, Clock } from "lucide-react"
import { getDashboardStats } from "@/actions/dashboard"

export async function StatsCards() {
    const stats = await getDashboardStats()

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Çalışan</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                    <p className="text-xs text-muted-foreground">
                        Aktif çalışan sayısı
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">İzindeki Personel</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.onLeave}</div>
                    <p className="text-xs text-muted-foreground">
                        Şu an aktif izinli
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Onay Bekleyen</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingApprovals.total}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.pendingApprovals.leaves} izin, {stats.pendingApprovals.expenses} harcama talebi
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Yeni Başlayanlar</CardTitle>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.newHires}</div>
                    <p className="text-xs text-muted-foreground">
                        Bu hafta başlayacak
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
