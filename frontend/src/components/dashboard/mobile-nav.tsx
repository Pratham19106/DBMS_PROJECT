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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-sidebar/95 backdrop-blur-lg">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
