import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BranchManager } from "@/components/settings/branch-manager"
import { DepartmentManager } from "@/components/settings/department-manager"
import { ThemeCustomizer } from "@/components/settings/theme-customizer"
import { DocumentTypeList } from "@/components/isg/document-type-list"
import { DocumentTypeForm } from "@/components/isg/document-type-form"
import { getBranches } from "@/actions/branches"
import { getDepartments } from "@/actions/departments"
import { getDocumentTypes } from "@/actions/isg-document-types"
import { Button } from "@/components/ui/button"
import { Download, Upload } from "lucide-react"
import { RestoreButton } from "@/components/settings/restore-button"
import { BackupFolderButton } from "@/components/settings/backup-folder-button"
import { UserManager } from "@/components/settings/user-manager"
import { getAppUsers } from "@/actions/user-actions"

export default async function SettingsPage() {
    const branches = await getBranches()
    const departments = await getDepartments()
    const documentTypes = await getDocumentTypes()
    const users = await getAppUsers()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Ayarlar</h2>
            <Tabs defaultValue="branches" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="branches">Çalışma Yerleri & Şubeler</TabsTrigger>
                    <TabsTrigger value="departments">Departmanlar</TabsTrigger>
                    <TabsTrigger value="isg">İSG Evrak Türleri</TabsTrigger>
                    <TabsTrigger value="general">Görünüm</TabsTrigger>
                    <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
                    <TabsTrigger value="backup">Yedekleme</TabsTrigger>
                </TabsList>
                <TabsContent value="branches" className="space-y-4">
                    <BranchManager initialBranches={branches} />
                </TabsContent>
                <TabsContent value="departments" className="space-y-4">
                    <DepartmentManager initialDepartments={departments} />
                </TabsContent>
                <TabsContent value="isg" className="space-y-4">
                    <div className="flex items-center justify-between space-y-2">
                        <div>
                            <h3 className="text-lg font-medium">İSG Evrak Türleri</h3>
                            <p className="text-sm text-muted-foreground">
                                İş sağlığı ve güvenliği evrak türlerini tanımlayın ve yönetin.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <DocumentTypeForm />
                        </div>
                    </div>
                    <DocumentTypeList documentTypes={documentTypes} />
                </TabsContent>
                <TabsContent value="general">
                    <div className="p-4 border rounded-lg max-w-xl">
                        <ThemeCustomizer />
                    </div>
                </TabsContent>
                <TabsContent value="users">
                    <UserManager initialUsers={users} />
                </TabsContent>
                <TabsContent value="backup">
                    <div className="p-4 border rounded-lg max-w-xl space-y-4">
                        <div>
                            <h3 className="text-lg font-medium">Veritabanı Yedekleme & Geri Yükleme</h3>
                            <p className="text-sm text-muted-foreground">
                                Mevcut veritabanını (.db) dosyasını bilgisayarınıza indirin veya eski bir yedeği sisteme yükleyin.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <a href="/api/backup" download>
                                <Button>
                                    <Download className="mr-2 h-4 w-4" /> Yedeği İndir
                                </Button>
                            </a>

                            <RestoreButton />
                            <BackupFolderButton />
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300 flex items-center gap-2">
                                <Download className="h-4 w-4" /> Önemli Not
                            </h4>
                            <p className="text-xs text-orange-700 dark:text-orange-400 mt-1 leading-relaxed">
                                Geri yükleme işlemi mevcut verilerinizin üzerine yazacaktır. İşlem öncesi güncel bir yedek almanız önerilir.
                                Geri yükleme sonrası verilerin tam olarak güncellenmesi için uygulamayı kapatıp açmanız gerekebilir.
                            </p>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

