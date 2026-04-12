"use client"

import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Store,
  Package,
  Wallet,
  ClipboardList,
  Truck,
  Settings,
  LogOut,
  Link2,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/context/AuthContext"

const ownerName = String(import.meta.env.VITE_OWNER_NAME ?? "Restaurant Owner")
const restaurantName = String(import.meta.env.VITE_RESTAURANT_NAME ?? "SupplySync Account")

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendors", label: "Vendors", icon: Store },
  { href: "/stock", label: "Stock & Commodities", icon: Package },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/daily-logs", label: "Daily Logs", icon: ClipboardList },
  { href: "/supplies", label: "Supplies", icon: Truck },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const displayName = user?.name?.trim() || user?.email || ownerName
  const displaySubtext = user?.email || restaurantName
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((namePart) => namePart[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border/50 bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border/50 px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Link2 className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold text-foreground">
                SupplySync
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            const linkContent = (
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-sidebar-accent",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-muted-foreground hover:text-sidebar-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkContent}</div>
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-border/50 p-4">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <Avatar className="h-9 w-9 border border-border/50">
              <AvatarImage src="/placeholder-avatar.jpg" alt={displayName} />
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">
                  {displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {displaySubtext}
                </p>
              </div>
            )}
            {!collapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover text-popover-foreground">
                  Logout
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-background text-muted-foreground shadow-md transition-transform hover:bg-accent hover:text-foreground",
            collapsed && "rotate-180"
          )}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
      </aside>
    </TooltipProvider>
  )
}
