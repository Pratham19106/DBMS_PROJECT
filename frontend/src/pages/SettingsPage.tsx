import { useState } from "react"
import { Save, User, Building, Bell, Palette, IndianRupee, Settings as SettingsIcon } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { restaurantSettings } from "@/lib/mock-data"

type SettingsSectionProps = {
  code: string
  label: string
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}

function SettingsSection({ code, label, title, description, icon, children }: SettingsSectionProps) {
  return (
    <section className="kv-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-cream-muted/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-forest text-cream">
            {icon}
          </div>
          <div>
            <p className="kv-microprint-sm text-muted-foreground">
              {label} &middot; <span className="text-forest">{code}</span>
            </p>
            <h3
              className="text-base text-forest"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
            >
              {title}
            </h3>
          </div>
        </div>
        <p className="kv-microprint-sm hidden text-muted-foreground sm:block">{description}</p>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    restaurantName: restaurantSettings.name,
    ownerName: restaurantSettings.ownerName,
    contact: restaurantSettings.contact,
    cashInHand: restaurantSettings.cashInHand,
    defaultTolerance: "MEDIUM",
    lowStockAlerts: restaurantSettings.notificationPreferences.lowStockAlerts,
    overduePaymentAlerts:
      restaurantSettings.notificationPreferences.overduePaymentAlerts,
    theme: "editorial",
  })

  const handleSave = () => {
    console.log("[v0] Saving settings:", settings)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="kv-page-reveal kv-section-shell flex flex-wrap items-end justify-between gap-4 border-b border-border p-4 pb-6 sm:p-5 sm:pb-6">
          <div>
            <p className="kv-microprint text-muted-foreground">Section 06 &middot; Operator Settings</p>
            <h1
              className="mt-2 text-5xl text-forest"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 500, lineHeight: 1, letterSpacing: "-0.025em" }}
            >
              Settings
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Manage your restaurant profile, financial defaults, and notification preferences.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-cream-card px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-forest text-cream">
                <SettingsIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="kv-microprint-sm text-muted-foreground">Module</p>
                <p
                  className="text-sm text-forest"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
                >
                  ST &middot; Preferences
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              className="rounded-full bg-forest text-cream hover:bg-forest-deep"
            >
              <Save className="mr-2 h-4 w-4" />
              Save changes
            </Button>
          </div>
        </div>

        <div className="kv-page-reveal grid gap-6 lg:grid-cols-2">
          <SettingsSection
            code="01"
            label="Profile"
            title="Restaurant Profile"
            description="Your business identity"
            icon={<Building className="h-4 w-4" />}
          >
            <div className="space-y-2">
              <Label htmlFor="restaurantName" className="kv-microprint-sm text-muted-foreground">
                Restaurant Name
              </Label>
              <Input
                id="restaurantName"
                value={settings.restaurantName}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, restaurantName: e.target.value }))
                }
                className="border-border bg-background font-mono text-sm text-forest focus-visible:border-forest focus-visible:ring-amber/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName" className="kv-microprint-sm text-muted-foreground">
                Owner Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="ownerName"
                  value={settings.ownerName}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, ownerName: e.target.value }))
                  }
                  className="border-border bg-background pl-9 font-mono text-sm text-forest focus-visible:border-forest focus-visible:ring-amber/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact" className="kv-microprint-sm text-muted-foreground">
                Contact Number
              </Label>
              <Input
                id="contact"
                value={settings.contact}
                onChange={(e) => setSettings((prev) => ({ ...prev, contact: e.target.value }))}
                className="border-border bg-background font-mono text-sm text-forest focus-visible:border-forest focus-visible:ring-amber/40"
              />
            </div>
          </SettingsSection>

          <SettingsSection
            code="02"
            label="Financial"
            title="Financial Defaults"
            description="Cash and vendor settings"
            icon={<IndianRupee className="h-4 w-4" />}
          >
            <div className="space-y-2">
              <Label htmlFor="cashInHand" className="kv-microprint-sm text-muted-foreground">
                Cash In Hand
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="cashInHand"
                  type="number"
                  value={settings.cashInHand}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, cashInHand: Number(e.target.value) }))
                  }
                  className="border-border bg-background pl-9 font-mono text-sm text-forest focus-visible:border-forest focus-visible:ring-amber/40"
                />
              </div>
              <p className="kv-microprint-sm text-muted-foreground">
                Shown on the dashboard Identity Pass and used for payment planning.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultTolerance" className="kv-microprint-sm text-muted-foreground">
                Default Vendor Tolerance
              </Label>
              <Select
                value={settings.defaultTolerance}
                onValueChange={(value) =>
                  setSettings((prev) => ({ ...prev, defaultTolerance: value }))
                }
              >
                <SelectTrigger className="border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
              <p className="kv-microprint-sm text-muted-foreground">
                Applied as the starting tolerance tier when you add a new vendor.
              </p>
            </div>
          </SettingsSection>

          <SettingsSection
            code="03"
            label="Alerts"
            title="Notifications"
            description="Decide what pings you"
            icon={<Bell className="h-4 w-4" />}
          >
            <div className="flex items-center justify-between rounded-md border border-border bg-background p-4">
              <div className="space-y-0.5">
                <Label className="text-forest">Low Stock Alerts</Label>
                <p className="kv-microprint-sm text-muted-foreground">
                  Notify when commodities fall below threshold
                </p>
              </div>
              <Switch
                checked={settings.lowStockAlerts}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, lowStockAlerts: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-background p-4">
              <div className="space-y-0.5">
                <Label className="text-forest">Overdue Payment Alerts</Label>
                <p className="kv-microprint-sm text-muted-foreground">
                  Flag vendors with pending balances
                </p>
              </div>
              <Switch
                checked={settings.overduePaymentAlerts}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, overduePaymentAlerts: checked }))
                }
              />
            </div>
          </SettingsSection>

          <SettingsSection
            code="04"
            label="Appearance"
            title="Editorial Theme"
            description="Paper & ink controls"
            icon={<Palette className="h-4 w-4" />}
          >
            <div className="space-y-2">
              <Label className="kv-microprint-sm text-muted-foreground">Theme Variant</Label>
              <Select
                value={settings.theme}
                onValueChange={(value) => setSettings((prev) => ({ ...prev, theme: value }))}
              >
                <SelectTrigger className="border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editorial">Editorial (Default)</SelectItem>
                  <SelectItem value="vault">Vault Contrast</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <p className="kv-microprint-sm text-muted-foreground">
                Editorial keeps the cream &amp; forest palette across your entire ledger.
              </p>
            </div>
            <div className="rounded-md border border-dashed border-border bg-cream-muted/40 p-4">
              <p className="kv-microprint-sm text-muted-foreground">Current palette</p>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="h-8 w-8 rounded-md border border-border"
                  style={{ background: "#1a3d2a" }}
                  title="Forest"
                />
                <span
                  className="h-8 w-8 rounded-md border border-border"
                  style={{ background: "#f5f3f0" }}
                  title="Cream"
                />
                <span
                  className="h-8 w-8 rounded-md border border-border"
                  style={{ background: "#d4a574" }}
                  title="Amber"
                />
                <div className="ml-3">
                  <p
                    className="text-sm text-forest"
                    style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
                  >
                    Forest &middot; Cream &middot; Amber
                  </p>
                  <p className="kv-microprint-sm text-muted-foreground">Kavach-inspired palette</p>
                </div>
              </div>
            </div>
          </SettingsSection>
        </div>
      </div>
    </DashboardLayout>
  )
}
