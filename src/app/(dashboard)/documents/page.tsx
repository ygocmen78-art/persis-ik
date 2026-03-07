import { getDocumentsWithBranches } from "@/actions/documents"
import { getBranches } from "@/actions/branches"
import { DocumentList } from "@/components/documents/document-list"
import { Suspense } from "react"

export default async function DocumentsPage() {
    const documents = await getDocumentsWithBranches()
    const branches = await getBranches()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Şirket Evrakları</h2>
                    <p className="text-muted-foreground">
                        Ticari sicil gazetesi, imza sirküleri ve diğer resmi evrakları buradan yönetin.
                    </p>
                </div>
            </div>

            <Suspense fallback={<div>Yükleniyor...</div>}>
                <DocumentList data={documents} branches={branches} />
            </Suspense>
        </div>
    )
}
