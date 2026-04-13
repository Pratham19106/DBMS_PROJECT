"use client"

import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  Calendar,
  Check,
  Clock3,
  CreditCard,
  Database,
  FileText,
  HeartPulse,
  Info,
  LayoutDashboard,
  Lock,
  Radar,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

gsap.registerPlugin(ScrollTrigger)

const LandingWebGLScene = lazy(() =>
  import("@/components/landing/landing-webgl-scene").then((module) => ({
    default: module.LandingWebGLScene,
  }))
)

type ComparisonRow = {
  label: string
  sync: string
  legacy: string
}

type FeatureCard = {
  icon: LucideIcon
  title: string
  description: string
}

type WorkflowStep = {
  title: string
  subtitle: string
  description: string
  icon: LucideIcon
}

type AnalyticsRange = "daily" | "monthly" | "yearly"

type AnalyticsPoint = {
  label: string
  inflow: number
  outflow: number
}

const comparisonRows: ComparisonRow[] = [
  { label: "Bill Capture", sync: "< 40 sec", legacy: "8-15 min" },
  { label: "Due Reconciliation", sync: "99%+", legacy: "Manual errors" },
  { label: "Payment Follow-up", sync: "Priority feed", legacy: "Call + notebook" },
  { label: "Stock Alerts", sync: "Live", legacy: "End of day" },
]

const features: FeatureCard[] = [
  {
    icon: ShoppingCart,
    title: "Smart Buy Recommendations",
    description:
      "AI reads stock levels, usage patterns, and vendor context to suggest what to buy before shortages hit.",
  },
  {
    icon: CreditCard,
    title: "Smart Pay Priority Engine",
    description:
      "Rank vendor payments by due pressure, tolerance posture, and available cash so critical dues are handled first.",
  },
  {
    icon: FileText,
    title: "Daily Log Analytics",
    description:
      "Track supply bills and payment logs in one timeline so operations and finance stay aligned each day.",
  },
  {
    icon: HeartPulse,
    title: "Vendor Relationship Health",
    description:
      "Monitor payment behavior and pending balance trends to protect high-impact supplier relationships.",
  },
  {
    icon: Receipt,
    title: "Bill and Commodity Management",
    description:
      "Capture item-wise quantities, rates, and vendor links in a workflow built for real supply operations.",
  },
  {
    icon: LayoutDashboard,
    title: "Unified Dashboard Insights",
    description:
      "See dues, movement, stock risk, and recommendations from one command center without spreadsheet stitching.",
  },
]

const modulePills = [
  "Vendor Management",
  "Commodity Mapping",
  "Item-wise Bill Entry",
  "Payment Logs",
  "Outstanding Dues",
  "Low Stock Alerts",
  "Vendor Suggestion",
  "Payment Suggestion",
  "Dashboard Analytics",
  "Secure Authentication",
  "PostgreSQL Storage",
  "API-first Backend",
]

const workflowSteps: WorkflowStep[] = [
  {
    title: "Add Your Data",
    subtitle: "Vendors, commodities, and bills",
    description:
      "Set up vendors, map commodities, and start creating item-wise bills. SupplySync immediately begins structuring your operations data.",
    icon: Sparkles,
  },
  {
    title: "AI Analyzes Patterns",
    subtitle: "Dues, tolerance, and stock signals",
    description:
      "Payment behavior, current stock, and due pressure are continuously evaluated to prioritize what needs action now.",
    icon: Brain,
  },
  {
    title: "Act With Confidence",
    subtitle: "Prioritized daily recommendations",
    description:
      "Get clear guidance for what to buy, who to pay, and where to focus, so decisions are proactive instead of reactive.",
    icon: TrendingUp,
  },
]

const analyticsData: Record<AnalyticsRange, AnalyticsPoint[]> = {
  daily: [
    { label: "Mon", inflow: 45, outflow: 38 },
    { label: "Tue", inflow: 52, outflow: 45 },
    { label: "Wed", inflow: 48, outflow: 52 },
    { label: "Thu", inflow: 61, outflow: 48 },
    { label: "Fri", inflow: 55, outflow: 42 },
    { label: "Sat", inflow: 38, outflow: 35 },
    { label: "Sun", inflow: 25, outflow: 20 },
  ],
  monthly: [
    { label: "Jan", inflow: 85, outflow: 72 },
    { label: "Feb", inflow: 78, outflow: 68 },
    { label: "Mar", inflow: 92, outflow: 85 },
    { label: "Apr", inflow: 88, outflow: 75 },
    { label: "May", inflow: 95, outflow: 82 },
    { label: "Jun", inflow: 82, outflow: 78 },
  ],
  yearly: [
    { label: "2022", inflow: 75, outflow: 68 },
    { label: "2023", inflow: 82, outflow: 72 },
    { label: "2024", inflow: 90, outflow: 78 },
    { label: "2025", inflow: 95, outflow: 82 },
    { label: "2026", inflow: 100, outflow: 85 },
  ],
}

const analyticsTabs: Array<{ id: AnalyticsRange; label: string }> = [
  { id: "daily", label: "Daily" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
]

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const sceneProgressRef = useRef(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [activeRange, setActiveRange] = useState<AnalyticsRange>("monthly")

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduceMotion(query.matches)

    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      if (reduceMotion) {
        sceneProgressRef.current = 0.2
        gsap.set(".landing-reveal", { y: 0, opacity: 1 })
        gsap.set(".landing-fade-up", { y: 0, opacity: 1 })
        return
      }

      gsap.fromTo(
        ".landing-reveal",
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.09,
          duration: 0.75,
          ease: "power3.out",
        }
      )

      gsap.utils.toArray<HTMLElement>(".landing-fade-up").forEach((section) => {
        gsap.fromTo(
          section,
          { y: 48, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
            },
          }
        )
      })

      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".landing-hero",
          start: "top top",
          end: "+=140%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      })

      heroTl
        .to(".landing-hero-copy", { yPercent: -20, opacity: 0.6, ease: "none" }, 0)
        .to(".landing-hero-kpis", { yPercent: -14, opacity: 0.72, ease: "none" }, 0)

      ScrollTrigger.create({
        trigger: ".landing-scroll-track",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          sceneProgressRef.current = self.progress
        },
      })

      gsap.fromTo(
        ".landing-comparison-row",
        { opacity: 0.3, x: 16 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.08,
          duration: 0.42,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".landing-comparison",
            start: "top 72%",
          },
        }
      )

      gsap.fromTo(
        ".landing-partner-pill",
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.035,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".landing-partners-grid",
            start: "top 82%",
          },
        }
      )

      gsap.fromTo(
        ".landing-feature-card",
        { opacity: 0.2, y: 22 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#features",
            start: "top 72%",
          },
        }
      )
    }, root)

    return () => ctx.revert()
  }, [reduceMotion])

  const activeChartPoints = analyticsData[activeRange]

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen overflow-x-hidden bg-[#050505] text-white"
      style={{ fontFamily: "'Space Grotesk', 'Manrope', sans-serif" }}
    >
      <div className="landing-noise-overlay pointer-events-none fixed inset-0 z-0" />
      <div className="landing-grid-bg pointer-events-none fixed inset-0 z-0 opacity-30" />
      <div className="landing-aurora pointer-events-none fixed inset-0 z-0 opacity-40" />

      <div className="pointer-events-none fixed inset-0 z-[1] flex items-center justify-center">
        <div className="landing-scene-shell h-[62vh] w-[92vw] max-w-[760px]">
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.02] text-xs uppercase tracking-[0.24em] text-white/60">
                Initializing scene
              </div>
            }
          >
            <LandingWebGLScene progressRef={sceneProgressRef} />
          </Suspense>
        </div>
      </div>

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-7 lg:px-10">
        <div className="landing-reveal flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/5">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/70">SupplySync</p>
            <p className="text-xs text-white/50">Vendor Finance + Stock Command</p>
          </div>
        </div>

        <nav className="landing-reveal hidden items-center gap-7 text-xs uppercase tracking-[0.18em] text-white/55 md:flex">
          <a href="#workflow" className="transition-colors hover:text-white">Workflow</a>
          <a href="#features" className="transition-colors hover:text-white">Features</a>
          <a href="#analytics" className="transition-colors hover:text-white">Analytics</a>
          <a href="#trust" className="transition-colors hover:text-white">Trust</a>
          <a href="#modules" className="transition-colors hover:text-white">Modules</a>
        </nav>

        <div className="landing-reveal flex items-center gap-2">
          {!isAuthenticated && (
            <Button asChild variant="outline" className="hidden border-white/30 bg-transparent text-white hover:bg-white/10 md:inline-flex">
              <Link to="/login">Log In</Link>
            </Button>
          )}
          <Button asChild className="border border-white bg-white text-black hover:bg-white/85">
            <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
              {isAuthenticated ? "Launch App" : "Join Waitlist"}
            </Link>
          </Button>
        </div>
      </header>

      <main className="landing-scroll-track relative z-10">
        <section className="landing-hero mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 pb-20 pt-8 lg:px-10">
          <div className="landing-hero-copy max-w-3xl space-y-6">
            <p className="landing-reveal inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-1 text-[10px] uppercase tracking-[0.22em] text-white/65">
              AI copilot for vendor payments and inventory decisions
            </p>
            <h1 className="landing-reveal text-4xl font-semibold leading-[1.06] text-white md:text-7xl">
              Run vendor operations
              <span className="block text-white/80">with AI confidence.</span>
            </h1>
            <p className="landing-reveal max-w-xl font-mono text-sm leading-relaxed text-white/60 md:text-base">
              Predict stock risk, prioritize vendor payments, and improve cash visibility with
              recommendations generated from your real daily operations.
            </p>

            <div className="landing-reveal flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="border border-white bg-white text-black hover:bg-white/85">
                
              </Button>
              
            </div>

            <div className="landing-hero-kpis grid max-w-xl grid-cols-3 gap-3 pt-3">
              {[
                { label: "SMART BUY ALERTS", value: "Daily" },
                { label: "PAYMENT PRIORITY", value: "AI Ranked" },
                { label: "CASHFLOW VIEW", value: "Real-time" },
              ].map((metric) => (
                <div key={metric.label} className="landing-reveal rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2">
                  <p className="font-mono text-lg text-white">{metric.value}</p>
                  <p className="font-mono text-[10px] tracking-[0.16em] text-white/55">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="landing-comparison landing-fade-up mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-6 py-24 lg:grid-cols-[1.1fr_1fr] lg:px-10">
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold leading-tight text-white md:text-5xl">
              See your business at a glance and act faster.
            </h2>
            <p className="max-w-xl font-mono text-sm leading-relaxed text-white/60">
              From bill creation to payment closure, SupplySync keeps due movement transparent while
              surfacing stock and vendor decisions in time.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/[0.03] p-5 backdrop-blur-sm">
            <div className="mb-4 grid grid-cols-[1fr_auto_auto] gap-3 border-b border-white/15 pb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
              <span>Metric</span>
              <span>SupplySync</span>
              <span>Manual Stack</span>
            </div>
            <div className="space-y-3">
              {comparisonRows.map((row) => (
                <div
                  key={row.label}
                  className="landing-comparison-row grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                >
                  <span className="font-mono text-xs text-white/72">{row.label}</span>
                  <span className="font-mono text-sm text-white">{row.sync}</span>
                  <span className="font-mono text-sm text-white/55">{row.legacy}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-fade-up mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-24 lg:grid-cols-2 lg:px-10">
          <article className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-sm">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-red-200/65">The problems</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Operational blind spots</h3>
            <div className="mt-5 space-y-3">
              {[
                {
                  title: "Unplanned stock shortages",
                  description: "Critical items run out before teams notice, causing purchasing stress and service impact.",
                },
                {
                  title: "Missed vendor payment priorities",
                  description: "Without a ranked due list, important supplier relationships can degrade quickly.",
                },
                {
                  title: "No live cashflow visibility",
                  description: "Teams make purchasing and payment decisions without a single reliable operating view.",
                },
              ].map((problem) => (
                <div key={problem.title} className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm font-semibold text-white">{problem.title}</p>
                  <p className="mt-1 text-sm text-white/65">{problem.description}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-sm">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-200/65">The solution</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Daily recommendations that are actionable</h3>
            <div className="mt-5 space-y-3">
              {[
                {
                  title: "Smart buy recommendations",
                  description: "AI monitors inventory thresholds and demand behavior to prompt timely replenishment.",
                },
                {
                  title: "AI payment priority",
                  description: "Pay-order suggestions combine due pressure, tolerance posture, and payable exposure.",
                },
                {
                  title: "Real-time financial analytics",
                  description: "Inflow, outflow, and net movement stay visible for confident daily operations.",
                },
              ].map((outcome) => (
                <div key={outcome.title} className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm font-semibold text-white">{outcome.title}</p>
                  <p className="mt-1 text-sm text-white/65">{outcome.description}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section id="features" className="landing-fade-up mx-auto min-h-screen w-full max-w-7xl px-6 py-20 lg:px-10">
          <div className="text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">Platform capabilities</p>
            <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">Everything you need to run smarter</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/60 md:text-base">
              Six connected modules eliminate guesswork from vendor dues, inventory planning, and payment execution.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="landing-feature-card rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-sm"
              >
                <div className="inline-flex rounded-xl border border-white/15 bg-black/30 p-2">
                  <feature.icon className="h-5 w-5 text-white/90" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="analytics" className="landing-fade-up mx-auto min-h-screen w-full max-w-7xl px-6 py-20 lg:px-10">
          <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-sm md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">Analytics dashboard</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Cashflow overview</h3>
                <p className="mt-1 text-sm text-white/60">Inflow vs outflow trends across your operations timeline.</p>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-black/35 p-1">
                {analyticsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveRange(tab.id)}
                    className={`rounded-md px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                      activeRange === tab.id
                        ? "bg-white text-black"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 border-b border-white/15 py-5 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-white/55">Total Inflow</p>
                <p className="mt-2 text-lg font-semibold text-white">Track Revenue</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-300"><TrendingUp className="h-3.5 w-3.5" /> Real-time</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-white/55">Total Outflow</p>
                <p className="mt-2 text-lg font-semibold text-white">Monitor Expenses</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-300"><TrendingDown className="h-3.5 w-3.5" /> Live updates</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-white/55">Net Position</p>
                <p className="mt-2 text-lg font-semibold text-white">Clear Visibility</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-300"><TrendingUp className="h-3.5 w-3.5" /> AI insights</p>
              </div>
            </div>

            <div className="py-6">
              <div className="grid grid-cols-6 items-end gap-2 md:grid-cols-7">
                {activeChartPoints.map((point) => (
                  <div key={point.label} className="flex flex-col items-center gap-2">
                    <div className="flex h-44 w-full items-end justify-center gap-1 rounded-md border border-white/10 bg-black/25 p-2">
                      <div className="w-2.5 rounded-t bg-white/85 md:w-3" style={{ height: `${point.inflow}%` }} />
                      <div className="w-2.5 rounded-t bg-white/35 md:w-3" style={{ height: `${point.outflow}%` }} />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white/55">{point.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-black/30 p-4">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/70">
                <Info className="h-3.5 w-3.5" />
                AI-powered insight
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Connect your daily bills and payments to get recommendation signals for payment timing,
                stock positioning, and operating liquidity.
              </p>
            </div>
          </div>
        </section>

        <section className="landing-fade-up mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center px-6 py-10 lg:px-10">
          <div className="rounded-full border border-white/15 bg-white/[0.02] px-6 py-2 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">
            Scroll to morph money flow: reserve core to coin swarm to secured ledger vault
          </div>
        </section>

        <section id="trust" className="landing-fade-up mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center gap-8 px-6 py-20 lg:px-10">
          <h2 className="text-center text-3xl font-semibold text-white md:text-5xl">Built for trust</h2>

          <div className="grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-sm">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">Operational workflows</p>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center gap-3 text-white/80"><Database className="h-4 w-4 text-white/70" /> Vendor-wise ledgers with item-level bill history</li>
                <li className="flex items-center gap-3 text-white/80"><Radar className="h-4 w-4 text-white/70" /> Live outstanding dues and payment tracking</li>
                <li className="flex items-center gap-3 text-white/80"><TrendingUp className="h-4 w-4 text-white/70" /> Smart suggestions for what to buy and pay next</li>
              </ul>
            </article>

            <article className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-sm">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">Security posture</p>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center gap-3 text-white/80"><Lock className="h-4 w-4 text-white/70" /> JWT login and protected action flows</li>
                <li className="flex items-center gap-3 text-white/80"><ShieldCheck className="h-4 w-4 text-white/70" /> Validated APIs for users, vendors, bills, and payments</li>
                <li className="flex items-center gap-3 text-white/80"><Sparkles className="h-4 w-4 text-white/70" /> Consistent audit trail for due movement</li>
              </ul>
            </article>
          </div>
        </section>

        <section id="modules" className="landing-fade-up mx-auto min-h-[72vh] w-full max-w-7xl px-6 py-20 lg:px-10">
          <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.24em] text-white/55">What you can run on day one</p>
          <div className="landing-partners-grid grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {modulePills.map((name) => (
              <div
                key={name}
                className="landing-partner-pill rounded-xl border border-white/15 bg-white/[0.025] px-4 py-3 text-center font-mono text-xs uppercase tracking-[0.14em] text-white/72"
              >
                {name}
              </div>
            ))}
          </div>
        </section>

        <section className="landing-fade-up mx-auto min-h-screen w-full max-w-7xl px-6 py-20 lg:px-10">
          <div className="text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">How it works</p>
            <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">From setup to smart decisions in minutes</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-sm">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/70">
                  Step {index + 1}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/50">{step.subtitle}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/65">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-fade-up mx-auto flex min-h-[70vh] w-full max-w-7xl flex-col items-center justify-center px-6 py-16 text-center lg:px-10">
          <div className="rounded-full border border-white/15 bg-white/[0.03] px-5 py-2 text-[11px] uppercase tracking-[0.16em] text-white/70">
            <Clock3 className="mr-2 inline h-4 w-4" />
            Setup in under 15 minutes
          </div>
          <h2 className="mt-6 max-w-3xl text-3xl font-semibold leading-tight text-white md:text-6xl">
            Transform vendor management, inventory decisions, and cashflow visibility.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 md:text-base">
            Start with your existing workflow and let AI prioritize what to buy, who to pay,
            and where the next operational risk is forming.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            
          </div>
        </section>
      </main>

      <footer className="relative z-20 border-t border-white/10 bg-black/65 px-6 py-5 font-mono text-[11px] text-white/55">
        <div className="mx-auto grid w-full max-w-7xl gap-2 md:grid-cols-3 md:items-center lg:px-4">
          <div className="text-left">SupplySync</div>
          <div className="text-center">Vendor dues, payments, and inventory aligned in one workflow.</div>
          <div className="text-right">
            <a className="mr-4 hover:text-white" href="#">Privacy</a>
            <a className="hover:text-white" href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
