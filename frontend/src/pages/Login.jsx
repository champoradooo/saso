import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      await login(username, password)
    } catch {
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/oct.webp')",
      }}
    >

      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/25" />

      {/* Login Container */}
      <div className="w-full max-w-sm relative z-10">

        {/* Login Card */}
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl shadow-xl px-8 py-10">

          {/* Branding */}
          <div className="flex justify-center items-center gap-4 mb-4">

            {/* Olivarez College Logo */}
            <img
              src="/oct-logo.png"
              alt="Olivarez College Tagaytay Logo"
              className="w-20 h-20 object-contain"
            />

            {/* SASO Logo */}
            <img
              src="/saso-logo.jpg"
              alt="SASO Logo"
              className="w-20 h-20 object-contain"
            />

          </div>

          {/* Header */}
          <div className="text-center">

            <h1 className="text-[15px] font-bold text-foreground leading-tight">
              Olivarez College Tagaytay
            </h1>

            <p className="text-[13px] text-muted-foreground mt-0.5">
              Student Affairs and Services Office
            </p>

            <div className="mt-3 pt-3 border-t border-border">

              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                SASO Records System
              </p>

            </div>

          </div>

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 mt-6"
          >

            {/* Username */}
            <div>

              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
              />

            </div>

            {/* Password */}
            <div>

              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
              />

            </div>

            {/* Error Message */}
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20">

                <p className="text-sm text-destructive">
                  {error}
                </p>

              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
            >

              {loading ? (
                <span className="flex items-center justify-center gap-2">

                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >

                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />

                  </svg>

                  Signing in...

                </span>
              ) : (
                'Sign In'
              )}

            </button>

          </form>

        </div>

        {/* Copyright */}
        <p className="text-center text-[11px] text-white mt-10 drop-shadow">
          © {new Date().getFullYear()} Olivarez College Tagaytay. All rights reserved.
        </p>

      </div>

    </div>
  )
}