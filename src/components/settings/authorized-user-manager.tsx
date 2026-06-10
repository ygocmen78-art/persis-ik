"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { updateBranch } from "@/actions/branches"
import { Eye, EyeOff, UserCog, Building2 } from "lucide-react"

interface Branch {
    id: number
    name: string
    authorized_user_code?: string | null
    authorized_user_code_suffix?: string | null
    authorized_user_password?: string | null
}

interface Props {
    branches: Branch[]
}

function BranchAuthRow({ branch }: { branch: Branch }) {
    const [userCode, setUserCode] = useState(branch.authorized_user_code || "")
    const [suffix, setSuffix] = useState(branch.authorized_user_code_suffix || "")
    const [password, setPassword] = useState(branch.authorized_user_password || "")
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSave() {
        setLoading(true)
        const result = await updateBranch(branch.id, {
            name: branch.name,
            authorized_user_code: userCode,
            authorized_user_code_suffix: suffix,
            authorized_user_password: password,
        })
        if (result.success) toast.success(`${branch.name} — yetkili kullanıcı kaydedildi.`)
        else toast.error(result.message)
        setLoading(false)
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    {branch.name}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="space-y-1 md:col-span-1">
                        <Label className="text-xs">Kullanıcı Kodu</Label>
                        <div className="flex items-center gap-1">
                            <Input value={userCode} onChange={e => setUserCode(e.target.value)} placeholder="Kod" className="h-8 text-sm" />
                            <span className="text-muted-foreground text-sm">-</span>
                            <Input value={suffix} onChange={e => setSuffix(e.target.value)} placeholder="Ek" className="h-8 text-sm w-16" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Şifre</Label>
                        <div className="relative">
                            <Input
                                type={showPass ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Şifre"
                                className="h-8 text-sm pr-8"
                            />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-8 w-8" onClick={() => setShowPass(!showPass)}>
                                {showPass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Button onClick={handleSave} disabled={loading} size="sm" className="w-full">
                            {loading ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function AuthorizedUserManager({ branches }: Props) {
    if (branches.length === 0) {
        return <p className="text-muted-foreground text-sm">Henüz şube eklenmemiş.</p>
    }
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <UserCog className="h-5 w-5 text-primary" />
                <div>
                    <p className="font-medium">Yetkili Kullanıcı — Şube Bazında</p>
                    <p className="text-xs text-muted-foreground">Rapor Sorgulama açıldığında seçili şubenin yetkili kullanıcısı kullanılır.</p>
                </div>
            </div>
            {branches.map(b => <BranchAuthRow key={b.id} branch={b} />)}
        </div>
    )
}
