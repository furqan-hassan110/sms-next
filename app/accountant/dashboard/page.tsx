import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AccountantDashboard } from "@/components/dashboards/accountant-dashboard"

export default function AccountantDashboardPage() {
  return (
    <DashboardLayout>
      <AccountantDashboard />
    </DashboardLayout>
  )
}
