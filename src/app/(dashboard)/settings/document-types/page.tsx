import { getDocumentTypes } from "@/actions/isg-document-types"
import { DocumentTypeList } from "@/components/isg/document-type-list"
import { DocumentTypeForm } from "@/components/isg/document-type-form"

export default async function DocumentTypesPage() {
    const documentTypes = await getDocumentTypes()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">İSG Evrak Türleri</h2>
                    <p className="text-muted-foreground">
                        İş sağlığı ve güvenliği evrak türlerini tanımlayın ve yönetin.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <DocumentTypeForm />
                </div>
            </div>

            <DocumentTypeList documentTypes={documentTypes} />
        </div>
    )
}
