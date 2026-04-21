"use client"

import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Store,
  Package,
  Wallet,
  ClipboardList,
  Truck,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/vendors", label: "Vendors", icon: Store },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/payments", label: "Pay", icon: Wallet },
  { href: "/daily-logs", label: "Logs", icon: ClipboardList },
  { href: "/supplies", label: "Supply", icon: Truck },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function MobileNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-cream-card/95 backdrop-blur-lg">
      <div className="flex items-center justify-around py-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                isActive
                  ? "text-forest"
                  : "text-muted-foreground hover:text-forest"
              )}
              style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  isActive ? "bg-forest text-cream" : "bg-transparent"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
