import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const redirectPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()

      if (!normalizedEmail || !password.trim()) {
        setError('Please fill in all fields')
        return
      }

      if (!EMAIL_REGEX.test(normalizedEmail)) {
        setError('Please enter a valid email')
        return
      }

      await login(normalizedEmail, password, rememberMe)
      navigate(redirectPath, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-lg mb-4">
              <LogIn className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">SupplySync</h1>
            <p className="text-slate-400">Welcome back to your vendor dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={isLoading}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 bg-slate-700 border-slate-600 rounded checked:bg-emerald-500 cursor-pointer"
                />
                Remember me
              </label>
              <a href="#" className="text-emerald-400 hover:text-emerald-300 transition">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold h-11 rounded-lg transition"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800/50 text-slate-400">Don&apos;t have an account?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link to="/signup">
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50 h-11"
            >
              Create Account
            </Button>
          </Link>

          {/* Demo Credentials */}
          <p className="text-xs text-slate-500 text-center mt-6">
            Use your registered email and password to continue.
          </p>
        </div>
      </div>
    </div>
  )
}