import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom"
import LandingPage from "@/pages/LandingPage"
import DashboardPage from "@/pages/DashboardPage"
import PaymentsPage from "@/pages/PaymentsPage"
import SettingsPage from "./pages/SettingsPage"
import StockPage from "@/pages/StockPage"
import SuppliesPage from "@/pages/SuppliesPage"
import VendorsPage from "@/pages/VendorsPage"
import DailyLogsPage from "@/pages/DailyLogsPage"
import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"
import { useAuth } from "@/context/AuthContext"

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="rounded-lg border border-border/60 bg-card px-5 py-3 text-sm text-muted-foreground">
        Validating session...
      </div>
    </div>
  )
}

function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />
  }

  return <Outlet />
}

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/daily-logs" element={<DailyLogsPage />} />
        <Route path="/supplies" element={<SuppliesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}
