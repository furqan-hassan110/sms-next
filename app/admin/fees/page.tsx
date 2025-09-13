import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { FeeManagement } from "@/components/admin/fee-management"

export default function AdminFeesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-600">Manage student fees, vouchers, and payments</p>
        </div>
        <FeeManagement />
      </div>
    </DashboardLayout>
  )
}
