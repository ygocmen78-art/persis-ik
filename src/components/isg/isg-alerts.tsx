import { getExpiringDocuments } from "@/actions/isg"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, AlertCircle } from "lucide-react"
import Link from "next/link"

interface ISGAlertsProps {
    hideManagementLink?: boolean
}

export async function ISGAlerts({ hideManagementLink = false }: ISGAlertsProps) {
    const expiringDocs = await getExpiringDocuments(30)

    if (expiringDocs.length === 0) return null

    const expired = expiringDocs.filter(d => d.status === 'expired')
    const expiring = expiringDocs.filter(d => d.status === 'expiring')

    return (
        <div className="space-y-4 mb-6">
            {expired.length > 0 && (
                <Alert variant="destructive" className="border-2 shadow-sm animate-pulse p-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-sm font-bold">DİKKAT: Süresi Dolan İSG Evrakları!</AlertTitle>
                    <AlertDescription>
                        <div className="mt-1 space-y-0.5">
                            {expired.map((doc) => (
                                <Link
                                    key={doc.id}
                                    href={`/isg#record-${doc.id}`}
                                    className="block text-xs hover:translate-x-1 transition-transform group"
                                >
                                    • <span className="group-hover:underline font-bold">{doc.employeeName} {doc.employeeSurname}</span> - {doc.documentTypeName}
                                    <span className="ml-1 font-semibold text-red-700 dark:text-red-400">
                                        ({new Date(doc.expiryDate!).toLocaleDateString('tr-TR')} tarihinde doldu)
                                    </span>
                                </Link>
                            ))}
                        </div>
                        {!hideManagementLink && (
                            <div className="mt-2 pt-1.5 border-t border-red-200 dark:border-red-900/30">
                                <Link
                                    id="manage-all-isg-expired"
                                    href="/isg"
                                    className="inline-flex items-center text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-2 py-1 rounded-md transition-colors"
                                >
                                    Tüm Evrakları Yönet →
                                </Link>
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {expiring.length > 0 && (
                <Alert className="border-yellow-500 bg-yellow-50 text-yellow-900 border-2 shadow-sm dark:bg-yellow-900/10 dark:text-yellow-500 p-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                    <AlertTitle className="text-sm font-bold">UYARI: Süresi Yaklaşan İSG Evrakları (30 Gün)</AlertTitle>
                    <AlertDescription>
                        <div className="mt-1 space-y-0.5">
                            {expiring.map((doc) => (
                                <Link
                                    key={doc.id}
                                    href={`/isg#record-${doc.id}`}
                                    className="block text-xs hover:translate-x-1 transition-transform group py-0.5"
                                >
                                    • <span className="group-hover:underline font-bold">{doc.employeeName} {doc.employeeSurname}</span> - {doc.documentTypeName}
                                    <span className="ml-1 text-yellow-700 dark:text-yellow-400">
                                        ({new Date(doc.expiryDate!).toLocaleDateString('tr-TR')})
                                    </span>
                                </Link>
                            ))}
                        </div>
                        {!hideManagementLink && (
                            <div className="mt-2 pt-1.5 border-t border-yellow-200 dark:border-yellow-900/30">
                                <Link
                                    id="manage-all-isg-expiring"
                                    href="/isg"
                                    className="inline-flex items-center text-xs font-bold text-white bg-yellow-500/10 hover:bg-yellow-500/20 px-2 py-1 rounded-md transition-colors"
                                >
                                    Hepsini Görüntüle →
                                </Link>
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}
