import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/db"
import { employees, leaves, expenses } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"

type Activity = {
    id: number
    employeeName: string
    action: string
    timestamp: string
    initials: string
}

async function getRecentActivities(): Promise<Activity[]> {
    try {
        const activities: Activity[] = []

        // Get recent leaves (last 10)
        const recentLeaves = await db
            .select({
                id: leaves.id,
                employeeId: leaves.employeeId,
                createdAt: leaves.createdAt,
                type: leaves.type,
                status: leaves.status,
            })
            .from(leaves)
            .orderBy(desc(leaves.createdAt))
            .limit(5)

        for (const leave of recentLeaves) {
            const employee = await db.select().from(employees).where(eq(employees.id, leave.employeeId)).limit(1)
            if (employee[0]) {
                const fullName = `${employee[0].firstName} ${employee[0].lastName}`
                activities.push({
                    id: leave.id,
                    employeeName: fullName,
                    action: `${leave.type === 'annual' ? 'Yıllık' : leave.type === 'sick' ? 'Hastalık' : 'Mazeret'} izin talebi oluşturdu`,
                    timestamp: leave.createdAt || '',
                    initials: `${employee[0].firstName[0]}${employee[0].lastName[0]}`
                })
            }
        }

        // Get recent employees (last 5)
        const newEmployees = await db
            .select()
            .from(employees)
            .where(eq(employees.status, "active"))
            .orderBy(desc(employees.createdAt))
            .limit(3)

        for (const emp of newEmployees) {
            const fullName = `${emp.firstName} ${emp.lastName}`
            activities.push({
                id: emp.id,
                employeeName: fullName,
                action: 'Yeni personel kaydı oluşturuldu',
                timestamp: emp.createdAt || '',
                initials: `${emp.firstName[0]}${emp.lastName[0]}`
            })
        }

        // Sort by timestamp and return top 4
        activities.sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        })

        return activities.slice(0, 4)
    } catch (error) {
        console.error("Error fetching recent activities:", error)
        return []
    }
}

export async function RecentActivity() {
    const activities = await getRecentActivities()

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Son Aktiviteler</CardTitle>
                <div className="text-sm text-muted-foreground">
                    Son {activities.length} işlem
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Henüz aktivite yok</p>
                    ) : (
                        activities.map((activity, index) => (
                            <div key={`${activity.id}-${index}`} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback>{activity.initials}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{activity.employeeName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {activity.action}
                                    </p>
                                </div>
                                <div className="ml-auto font-medium text-xs text-muted-foreground">
                                    {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), {
                                        addSuffix: true,
                                        locale: tr
                                    }) : 'bilinmiyor'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
