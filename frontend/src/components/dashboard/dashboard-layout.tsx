"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ShieldCheck, Menu, X, LogOut } from "lucide-react"
import gsap from "gsap"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { MobileNav } from "./mobile-nav"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/vendors", label: "Vendors" },
  { href: "/stock", label: "Stock" },
  { href: "/payments", label: "Payments" },
  { href: "/daily-logs", label: "Daily Logs" },
  { href: "/supplies", label: "Supplies" },
  { href: "/settings", label: "Settings" },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mainRef = useRef<HTMLElement | null>(null)

  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Operator"
  const shortHandle = (user?.email?.split("@")[0] ?? "operator").toLowerCase()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useLayoutEffect(() => {
    const el = mainRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".kv-page-reveal",
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: "power2.out", stagger: 0.06 }
      )
    }, el)
    return () => ctx.revert()
  }, [pathname])

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  const activeLabel = navItems.find((item) => item.href === pathname)?.label ?? "Dashboard"

  return (
    <div className="kv-paper relative min-h-screen overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-amber/12 blur-3xl" />
        <div className="absolute -right-36 bottom-16 h-120 w-120 rounded-full bg-forest/10 blur-3xl" />
      </div>
      {/* Editorial top header */}
      <header className="kv-topbar-shell sticky top-0 z-40 border-b border-border backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          {/* Brand block */}
          <Link to="/dashboard" className="group flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-forest text-cream">
              <ShieldCheck className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber" />
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-lg tracking-tight text-forest"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
              >
                SupplySync
              </span>
              <span className="hidden h-4 w-px bg-border sm:block" />
              <span className="kv-microprint hidden text-muted-foreground sm:inline">
                Portable Ledger
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-forest text-cream"
                      : "text-muted-foreground hover:bg-cream-muted hover:text-forest"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User/account block */}
          <div className="flex items-center gap-2">
            <div className="hidden text-right md:block">
              <p className="kv-microprint-sm text-muted-foreground">Operator</p>
              <p
                className="text-sm text-forest"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
              >
                {displayName}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-cream-card text-muted-foreground transition-colors hover:border-forest hover:text-forest md:inline-flex"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-cream-card text-forest md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Decorative microprint ribbon */}
        <div className="kv-topbar-ribbon border-t border-border/60">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-hidden px-4 py-1.5 md:px-8">
            <p className="kv-microprint-sm truncate text-muted-foreground">
              SUPPLYSYNC · VENDOR FINANCE · INVENTORY CONTROL · KV/2024/
              <span className="text-forest">{shortHandle.toUpperCase().slice(0, 6).padEnd(6, "0")}</span>
            </p>
            <p className="kv-microprint-sm hidden text-muted-foreground lg:block">
              VIEWING · <span className="text-forest">{activeLabel.toUpperCase()}</span>
            </p>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        {mobileOpen && (
          <div className="kv-topbar-ribbon border-t border-border md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-forest text-cream"
                        : "text-muted-foreground hover:bg-cream-muted hover:text-forest"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-forest"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Mobile bottom nav (compact icon rail) */}
      <div className="md:hidden">
        <MobileNav />
      </div>

      {/* Main content stage */}
      <main ref={mainRef} className="relative z-10 pb-24 md:pb-12">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
          {children}
        </div>
      </main>

      {/* Footer microprint strip */}
      <footer className="border-t border-border bg-cream-card/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 md:px-8">
          <p className="kv-microprint-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SupplySync · Editorial Operations Suite
          </p>
          <p className="kv-microprint-sm text-muted-foreground">
            KV · <span className="text-forest">VERIFIED RECORDS</span> · SERIES 24
          </p>
        </div>
      </footer>
    </div>
  )
}
