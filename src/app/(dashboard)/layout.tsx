export const dynamic = "force-dynamic";
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { checkLicenseStatus } from "@/actions/license"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // SECURITY: Enforce Anti-Resale Activation
    const isActivated = await checkLicenseStatus();

    // If not activated, immediately redirect off the dashboard to the activation barrier
    if (!isActivated) {
        redirect("/activate");
    }

    return (
        <DashboardShell>
            {children}
        </DashboardShell>
    )
}
