import { getISGRecords, getExpiringDocuments, getMissingDocuments } from "@/actions/isg"
import { getDocumentTypes } from "@/actions/isg-document-types"
import { getEmployees } from "@/actions/employees"
import { ISGForm } from "@/components/isg/isg-form"
import { DocumentCard } from "@/components/isg/document-card"
import { MissingDocuments } from "@/components/isg/missing-documents"
import { ISGAlerts } from "@/components/isg/isg-alerts"

export default async function ISGPage() {
    const [records, documentTypes, employees, missingDocs] = await Promise.all([
        getISGRecords(),
        getDocumentTypes(),
        getEmployees(),
        getMissingDocuments(),
    ])

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">İSG Evrakları</h2>
                    <p className="text-muted-foreground">
                        İş sağlığı ve güvenliği evraklarını yönetin
                    </p>
                </div>
                <ISGForm employees={employees} documentTypes={documentTypes} />
            </div>

            <ISGAlerts hideManagementLink={true} />

            {/* Missing Documents - Per Employee Grouped View */}
            <MissingDocuments missingDocs={missingDocs} />

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {records.map((record) => (
                    <DocumentCard key={record.id} document={record} employees={employees} documentTypes={documentTypes} />
                ))}
                {records.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        Henüz evrak eklenmemiş. Yukarıdaki butonu kullanarak evrak ekleyebilirsiniz.
                    </div>
                )}
            </div>
        </div>
    )
}
