import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react"
import gsap from "gsap"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { useAuth } from "@/context/AuthContext"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".kv-auth-reveal",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.08 }
      )
      gsap.fromTo(
        ".kv-auth-card",
        { y: 40, opacity: 0, rotateX: -4 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.9, ease: "power3.out", delay: 0.1 }
      )
    }, el)
    return () => ctx.revert()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const normalizedName = name.trim()
      const normalizedEmail = email.trim().toLowerCase()

      if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
        setError("Please fill in all fields")
        return
      }

      if (normalizedName.length < 2) {
        setError("Name must be at least 2 characters")
        return
      }

      if (!EMAIL_REGEX.test(normalizedEmail)) {
        setError("Please enter a valid email")
        return
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters")
        return
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match")
        return
      }

      if (!agreedToTerms) {
        setError("You must agree to the terms and conditions")
        return
      }

      await signup(normalizedName, normalizedEmail, password)
      navigate("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const applicationNumber = "KV-24-A" + Math.floor(10000 + Math.random() * 90000)

  return (
    <div ref={rootRef} className="kv-paper relative min-h-screen overflow-hidden text-foreground">
      {/* Subtle editorial background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-amber/10 blur-3xl" />
        <div className="absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-forest/10 blur-3xl" />
      </div>

      {/* Top microprint */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-forest text-cream">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span
            className="text-lg text-forest"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
          >
            SupplySync
          </span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span className="kv-microprint-sm hidden text-muted-foreground sm:inline">
            Portable Ledger
          </span>
        </Link>
        <Link to="/login" className="kv-microprint text-muted-foreground hover:text-forest">
          Have an account? Sign in &rarr;
        </Link>
      </header>

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-16 pt-4 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pt-10">
        {/* Left editorial copy */}
        <section className="flex flex-col justify-center">
          <p className="kv-auth-reveal kv-microprint text-muted-foreground">
            New Operator Application · Series KV-24
          </p>
          <h1
            className="kv-auth-reveal mt-4 text-5xl text-forest sm:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 500, lineHeight: 1.02, letterSpacing: "-0.025em" }}
          >
            Issue your
            <span className="block text-forest/70">portable ledger.</span>
          </h1>
          <p className="kv-auth-reveal mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            Request an operator identity to manage vendors, inventory, and payments under a single
            editorial-grade ledger. Every record is notarized the moment it&apos;s entered.
          </p>

          <div className="kv-auth-reveal kv-divider mt-10" />

          <dl className="kv-auth-reveal mt-6 grid grid-cols-3 gap-6">
            {[
              { label: "ISSUED BY", value: "SupplySync" },
              { label: "TRUST MODEL", value: "Operator-Owned" },
              { label: "EXPIRY", value: "Never" },
            ].map((item) => (
              <div key={item.label}>
                <p className="kv-microprint-sm text-muted-foreground">{item.label}</p>
                <p
                  className="mt-1 text-lg text-forest"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </dl>
        </section>

        {/* Right: passport-style signup card */}
        <section className="flex items-center justify-center">
          <div
            className="kv-auth-card relative w-full max-w-md rounded-lg bg-cream-card"
            style={{ boxShadow: "0 24px 60px -24px rgba(26, 61, 42, 0.35)" }}
          >
            <div className="kv-passport-pattern relative overflow-hidden rounded-t-lg px-6 pb-10 pt-5 text-cream">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-sm border border-cream/30 bg-cream/10">
                    <ShieldCheck className="h-3 w-3 text-amber" />
                  </div>
                  <p className="kv-microprint text-cream/80">Operator Application</p>
                </div>
                <p className="kv-microprint-sm text-cream/70">APP · {applicationNumber}</p>
              </div>

              <div className="mt-6">
                <p className="kv-microprint-sm text-cream/60">Request Type</p>
                <p
                  className="mt-1 text-2xl text-cream"
                  style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                >
                  New Operator
                </p>
              </div>

              <span className="kv-corner kv-corner-tl border-amber" />
              <span className="kv-corner kv-corner-tr border-amber" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
              <div className="kv-perforation -mt-10" />

              <div className="space-y-2 pt-4">
                <label htmlFor="name" className="kv-microprint-sm flex items-center justify-between text-muted-foreground">
                  <span>Full Name</span>
                  <span className="text-forest/50">FIELD / 01</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="border-border bg-background font-mono text-sm text-forest placeholder:text-muted-foreground/60 focus-visible:border-forest focus-visible:ring-amber/40"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="kv-microprint-sm flex items-center justify-between text-muted-foreground">
                  <span>Email Address</span>
                  <span className="text-forest/50">FIELD / 02</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="operator@supplysync.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="border-border bg-background font-mono text-sm text-forest placeholder:text-muted-foreground/60 focus-visible:border-forest focus-visible:ring-amber/40"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="password" className="kv-microprint-sm flex items-center justify-between text-muted-foreground">
                    <span>Password</span>
                    <span className="text-forest/50">03</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="border-border bg-background pr-10 font-mono text-sm text-forest placeholder:text-muted-foreground/60 focus-visible:border-forest focus-visible:ring-amber/40"
                    />
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-forest"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="kv-microprint-sm flex items-center justify-between text-muted-foreground">
                    <span>Confirm</span>
                    <span className="text-forest/50">04</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="border-border bg-background pr-10 font-mono text-sm text-forest placeholder:text-muted-foreground/60 focus-visible:border-forest focus-visible:ring-amber/40"
                    />
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-forest"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-2 pt-1 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  disabled={isLoading}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-forest"
                />
                <span>
                  I certify the information is accurate and agree to SupplySync&apos;s{" "}
                  <a href="#" className="text-forest hover:text-amber-deep">Operator Terms</a> &amp;{" "}
                  <a href="#" className="text-forest hover:text-amber-deep">Privacy Policy</a>.
                </span>
              </label>

              <Button
                type="submit"
                disabled={isLoading}
                className="group h-11 w-full rounded-md bg-forest text-sm font-medium text-cream hover:bg-forest-deep"
              >
                <span className="flex items-center justify-center gap-2">
                  {isLoading ? "Issuing..." : "Issue My Ledger Pass"}
                  {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                </span>
              </Button>

              <div className="kv-divider" />
              <div className="kv-mrz-light">
                KV&lt;&lt;APPLICATION&lt;&lt;NEW&lt;&lt;IN&lt;&lt;{applicationNumber}&lt;&lt;
                <br />
                F&lt;&lt;SUPPLYSYNC&lt;&lt;OPERATOR&lt;&lt;PENDING&lt;&lt;NOTARY
              </div>

              <div className="pt-2 text-center">
                <p className="kv-microprint-sm text-muted-foreground">
                  Already enrolled?{" "}
                  <Link to="/login" className="text-forest hover:text-amber-deep">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>

            <span className="kv-corner kv-corner-bl border-forest/40" />
            <span className="kv-corner kv-corner-br border-forest/40" />
          </div>
        </section>
      </div>
    </div>
  )
}
