import { useMemo } from "react"
import { Link } from "react-router-dom"
import {
  ArrowUpRight,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  Wallet,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { DebtDistributionChart } from "@/components/dashboard/debt-distribution-chart"
import { FinancialAnalysis } from "@/components/dashboard/financial-analysis"
import { SmartRecommendations } from "@/components/dashboard/smart-recommendations"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useDashboardData } from "@/components/dashboard/dashboard-data"
import { useAuth } from "@/context/AuthContext"

function formatCurrencyShort(value: number): string {
  if (value >= 10000000) return `Rs ${(value / 10000000).toFixed(2)}Cr`
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(2)}L`
  if (value >= 1000) return `Rs ${(value / 1000).toFixed(1)}k`
  return `Rs ${value.toLocaleString("en-IN")}`
}

function buildDidHandle(seed: string): string {
  const cleanSeed = seed.replace(/[^a-z0-9]/gi, "").toLowerCase() || "operator"
  const suffix = cleanSeed.slice(-6).padStart(6, "0")
  return `did:supplysync:0x${suffix}_${Math.floor(Math.random() * 9000 + 1000).toString(16)}`
}

export default function DashboardPage() {
  const { data, loading, error, hasData } = useDashboardData()
  const { user } = useAuth()

  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Operator"
  const handle = (user?.email?.split("@")[0] ?? "operator").toLowerCase()
  const memberSince = useMemo(() => {
    const d = new Date()
    return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" })
  }, [])
  const did = useMemo(() => buildDidHandle(user?.id ?? user?.email ?? "operator"), [user?.id, user?.email])

  const metrics = data.metrics
  const mrzLine = `KV<<${displayName.toUpperCase().replace(/\s+/g, "<")}<<IN<<${handle.slice(0, 8).toUpperCase().padEnd(8, "0")}<<240614<<F<<4870`

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Section header */}
        <div className="kv-page-reveal flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kv-microprint text-muted-foreground">Identity Vault</p>
            <h1
              className="mt-2 text-5xl text-forest sm:text-6xl"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 500, lineHeight: 1, letterSpacing: "-0.025em" }}
            >
              {displayName}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              @{handle}.supplysync &middot; Member since {memberSince}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              className="rounded-full border-border bg-cream-card text-forest hover:border-forest"
            >
              <Link to="/vendors">
                <Plus className="mr-2 h-4 w-4" /> Add Vendor
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-forest text-cream hover:bg-forest-deep"
            >
              <Link to="/payments">
                <Share2 className="mr-2 h-4 w-4" /> Record Payment
              </Link>
            </Button>
          </div>
        </div>

        {/* Two-column identity pass + connected platforms */}
        <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          {/* Identity Pass — editorial passport card */}
          <div className="kv-page-reveal kv-passport-pro relative overflow-hidden rounded-xl text-cream shadow-[0_20px_55px_-28px_rgba(15,39,25,0.75)]">
            {/* Header strip */}
            <div className="flex items-center justify-between border-b border-cream/15 px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber" />
                <p className="kv-microprint text-cream/85">SupplySync Identity Pass</p>
              </div>
              <p className="kv-microprint-sm text-cream/70">
                SERIES &middot; <span className="text-amber">KV-24</span>
              </p>
            </div>

            {/* Body */}
            <div className="grid gap-8 px-6 py-7 md:grid-cols-[1.55fr_1fr]">
              <div>
                <p className="kv-microprint-sm text-cream/60">Holder</p>
                <h2
                  className="mt-1 text-4xl text-cream sm:text-5xl"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500, lineHeight: 1, letterSpacing: "-0.02em" }}
                >
                  {displayName}
                </h2>
                <p className="mt-2 text-sm text-cream/75">
                  @{handle}.supplysync &middot; Independent Operator
                </p>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  {[
                    { label: "VENDORS", value: loading ? "--" : metrics.activeVendors.toString() },
                    { label: "OUTSTANDING", value: loading ? "--" : formatCurrencyShort(metrics.totalOutstandingDebt) },
                    { label: "CASH", value: loading ? "--" : formatCurrencyShort(metrics.cashInHand) },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="kv-microprint-sm text-cream/60">{item.label}</p>
                      <p
                        className="mt-1 text-2xl text-cream"
                        style={{ fontFamily: "var(--font-serif)", fontWeight: 500, lineHeight: 1.1 }}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-7">
                  <p className="kv-microprint-sm text-cream/60">Decentralised Identifier</p>
                  <p className="mt-1 break-all font-mono text-xs text-cream/90">{did}</p>
                </div>
              </div>

              {/* QR surrogate panel */}
              <div className="flex flex-col items-center justify-start">
                <div className="kv-qr-float relative flex h-36 w-36 items-center justify-center rounded-md bg-cream p-2 shadow-md">
                  {/* Simulated QR pattern using grid */}
                  <div className="grid h-full w-full grid-cols-8 grid-rows-8 gap-0.5">
                    {Array.from({ length: 64 }).map((_, i) => {
                      // Deterministic pattern based on handle + index
                      const seed = (handle.charCodeAt((i % handle.length) || 0) + i * 7) % 13
                      const on = seed > 5
                      return (
                        <span
                          key={i}
                          className={on ? "rounded-[1px] bg-forest" : "bg-cream"}
                        />
                      )
                    })}
                  </div>
                  {/* Center logo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-forest text-cream shadow">
                      <ShieldCheck className="h-4 w-4 text-amber" />
                    </div>
                  </div>
                </div>
                <div className="kv-verified-badge mt-3">
                  <Sparkles className="h-3 w-3" />
                  Verified on-chain
                </div>
              </div>
            </div>

            {/* MRZ strip */}
            <div className="border-t border-cream/15 bg-cream/5 px-6 py-3">
              <p className="kv-mrz truncate">{mrzLine}</p>
            </div>

            {/* Decorative corners */}
            <span className="kv-corner kv-corner-tl border-amber" />
            <span className="kv-corner kv-corner-tr border-amber" />
            <span className="kv-corner kv-corner-bl border-amber/60" />
            <span className="kv-corner kv-corner-br border-amber/60" />
          </div>

          {/* Right rail: "Connected platforms" style quick links */}
          <div className="kv-page-reveal kv-card overflow-hidden p-6">
            <div className="flex items-center justify-between">
              <h3
                className="text-lg text-forest"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
              >
                Connected modules
              </h3>
              <p className="kv-microprint-sm text-muted-foreground">
                {metrics.activeVendors} active
              </p>
            </div>
            <div className="kv-divider my-4" />
            <ul className="space-y-3">
              {[
                {
                  code: "VN",
                  name: "Vendors",
                  meta: `${metrics.activeVendors} linked`,
                  href: "/vendors",
                  active: metrics.activeVendors > 0,
                },
                {
                  code: "SK",
                  name: "Stock & Commodities",
                  meta: metrics.lowStockAlerts > 0 ? `${metrics.lowStockAlerts} low` : "All stable",
                  href: "/stock",
                  active: true,
                },
                {
                  code: "PY",
                  name: "Payments",
                  meta: formatCurrencyShort(metrics.totalOutstandingDebt) + " due",
                  href: "/payments",
                  active: true,
                },
                {
                  code: "DL",
                  name: "Daily Logs",
                  meta: "Timeline",
                  href: "/daily-logs",
                  active: true,
                },
                {
                  code: "SP",
                  name: "Supplies",
                  meta: "Bill capture",
                  href: "/supplies",
                  active: true,
                },
              ].map((mod) => (
                <li key={mod.code}>
                  <Link
                    to={mod.href}
                    className="flex items-center gap-3 rounded-md border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-cream-muted/60"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background font-mono text-xs font-semibold text-forest">
                      {mod.code}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-forest">{mod.name}</p>
                      <p className="kv-microprint-sm text-muted-foreground">{mod.meta}</p>
                    </div>
                    {mod.active ? (
                      <span className="kv-verified-badge">
                        <Sparkles className="h-3 w-3" /> Linked
                      </span>
                    ) : (
                      <span className="kv-microprint text-forest">Connect &rarr;</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* KPI row */}
        <div className="kv-page-reveal space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="kv-microprint text-muted-foreground">Operating Metrics</p>
              <h2
                className="mt-1 text-2xl text-forest"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
              >
                At a glance
              </h2>
            </div>
            <Link to="/daily-logs" className="kv-microprint text-forest hover:text-amber-deep">
              View ledger &rarr;
            </Link>
          </div>
          <KPICards metrics={data.metrics} loading={loading} />
        </div>

        {/* Financial analysis */}
        <div className="kv-page-reveal">
          <FinancialAnalysis />
        </div>

        {/* AI recommendations */}
        <div className="kv-page-reveal space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="kv-microprint text-muted-foreground">Editorial Intelligence</p>
              <h2
                className="mt-1 text-2xl text-forest"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
              >
                Recommendations for today
              </h2>
            </div>
            <span className="kv-verified-badge">
              <Sparkles className="h-3 w-3" /> AI Notarized
            </span>
          </div>
          <SmartRecommendations
            buyRecommendation={data.smartBuyRecommendation}
            payRecommendation={data.smartPayRecommendation}
            loading={loading}
          />
        </div>

        {error && (
          <Alert className="kv-page-reveal border-destructive/40 bg-destructive/5 text-destructive">
            <AlertTitle>Dashboard data issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Debt distribution */}
        <div className="kv-page-reveal">
          <DebtDistributionChart data={data.debtDistribution} loading={loading} />
        </div>

        {!loading && !hasData && !error && (
          <Alert className="kv-page-reveal border-amber/50 bg-amber/10 text-forest">
            <AlertTitle
              className="text-forest"
              style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
            >
              Your ledger is waiting for its first entry
            </AlertTitle>
            <AlertDescription className="text-forest/80">
              Add vendors, bills, payments, and commodities to unlock analytics and recommendations.
              <div className="mt-3 flex gap-2">
                <Button asChild variant="outline" className="rounded-full border-forest bg-cream-card text-forest">
                  <Link to="/vendors">
                    <Store className="mr-2 h-4 w-4" /> Add a vendor
                  </Link>
                </Button>
                <Button asChild className="rounded-full bg-forest text-cream hover:bg-forest-deep">
                  <Link to="/supplies">
                    <Wallet className="mr-2 h-4 w-4" /> Log a bill
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  )
}

