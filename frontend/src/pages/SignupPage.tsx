import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const normalizedName = name.trim()
      const normalizedEmail = email.trim().toLowerCase()

      if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
        setError('Please fill in all fields')
        return
      }

      if (normalizedName.length < 2) {
        setError('Name must be at least 2 characters')
        return
      }

      if (!EMAIL_REGEX.test(normalizedEmail)) {
        setError('Please enter a valid email')
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      if (!agreedToTerms) {
        setError('You must agree to the terms and conditions')
        return
      }

      await signup(normalizedName, normalizedEmail, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
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

      {/* Signup Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-lg mb-4">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">SupplySync</h1>
            <p className="text-slate-400">Create your vendor management account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

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
                  placeholder="Create a strong password"
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

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showConfirmPassword ? (
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

            {/* Terms Agreement */}
            <label className="flex items-start gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                disabled={isLoading}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 bg-slate-700 border-slate-600 rounded checked:bg-emerald-500 cursor-pointer mt-0.5 shrink-0"
              />
              <span>
                I agree to the{' '}
                <a href="#" className="text-emerald-400 hover:text-emerald-300 transition">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="#" className="text-emerald-400 hover:text-emerald-300 transition">
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Sign Up Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold h-11 rounded-lg transition"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800/50 text-slate-400">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link to="/login">
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50 h-11"
            >
              Sign In
            </Button>
          </Link>

          {/* Demo Info */}
          <p className="text-xs text-slate-500 text-center mt-6">
            Create an account, then you will be logged in automatically.
          </p>
        </div>
      </div>
    </div>
  )
}