import { Navigate, Route, Routes } from "react-router-dom"
import DashboardPage from "@/pages/DashboardPage"
import PaymentsPage from "@/pages/PaymentsPage"
import SettingsPage from "./pages/SettingsPage"
import StockPage from "@/pages/StockPage"
import SuppliesPage from "@/pages/SuppliesPage"
import VendorsPage from "@/pages/VendorsPage"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/vendors" element={<VendorsPage />} />
      <Route path="/stock" element={<StockPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
      <Route path="/supplies" element={<SuppliesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
