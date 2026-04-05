"use client"

import { useState } from "react"
import { Save, User, Building, Bell, Palette, IndianRupee } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
    theme: "dark",
  })

  const handleSave = () => {
    console.log("Saving settings:", settings)
    // In a real app, this would save to an API
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">
              Manage your restaurant profile and preferences.
            </p>
          </div>
          <Button
            onClick={handleSave}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Restaurant Profile */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <Building className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-card-foreground">
                    Restaurant Profile
                  </CardTitle>
                  <CardDescription>
                    Your business information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restaurantName" className="text-card-foreground">
                  Restaurant Name
                </Label>
                <Input
                  id="restaurantName"
                  value={settings.restaurantName}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      restaurantName: e.target.value,
                    }))
                  }
                  className="bg-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName" className="text-card-foreground">
                  Owner Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="ownerName"
                    value={settings.ownerName}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        ownerName: e.target.value,
                      }))
                    }
                    className="bg-secondary pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact" className="text-card-foreground">
                  Contact Number
                </Label>
                <Input
                  id="contact"
                  value={settings.contact}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, contact: e.target.value }))
                  }
                  className="bg-secondary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Settings */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <IndianRupee className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-card-foreground">
                    Financial Settings
                  </CardTitle>
                  <CardDescription>
                    Cash and vendor defaults
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cashInHand" className="text-card-foreground">
                  Cash In Hand
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="cashInHand"
                    type="number"
                    value={settings.cashInHand}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        cashInHand: Number(e.target.value),
                      }))
                    }
                    className="bg-secondary pl-9 font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This amount is shown on the dashboard and used for payment
                  planning.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultTolerance" className="text-card-foreground">
                  Default Vendor Tolerance
                </Label>
                <Select
                  value={settings.defaultTolerance}
                  onValueChange={(value) =>
                    setSettings((prev) => ({ ...prev, defaultTolerance: value }))
                  }
                >
                  <SelectTrigger className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Default tolerance level for new vendors.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <Bell className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-card-foreground">
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Alert preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-4">
                <div className="space-y-0.5">
                  <Label className="text-card-foreground">Low Stock Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when commodities fall below threshold
                  </p>
                </div>
                <Switch
                  checked={settings.lowStockAlerts}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, lowStockAlerts: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-4">
                <div className="space-y-0.5">
                  <Label className="text-card-foreground">
                    Overdue Payment Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified about vendors with pending payments
                  </p>
                </div>
                <Switch
                  checked={settings.overduePaymentAlerts}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      overduePaymentAlerts: checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                  <Palette className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-lg text-card-foreground">
                    Appearance
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-card-foreground">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) =>
                    setSettings((prev) => ({ ...prev, theme: value }))
                  }
                >
                  <SelectTrigger className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred color scheme.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
