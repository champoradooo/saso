import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await api.post(
        '/auth/forgot-password/',
        {
          email: email.trim(),
        }
      )

      setSuccess(
        response?.detail ||
        'If an account with that email exists, a password reset link has been sent.'
      )

      setEmail('')
    } catch (error) {
      console.error(
        'Forgot password error:',
        error
      )

      setError(
        error?.response?.data?.detail ||
        'Unable to process your request. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">

      <div className="w-full max-w-sm">

        <div className="bg-card border border-border rounded-2xl shadow-sm px-8 py-10">

          {/* Branding */}
          <div className="flex justify-center items-center gap-4 mb-4">

            <img
              src="/oct-logo.png"
              alt="Olivarez College Tagaytay Logo"
              className="w-20 h-20 object-contain"
            />

            <img
              src="/saso-logo.jpg"
              alt="SASO Logo"
              className="w-20 h-20 object-contain"
            />

          </div>


          {/* Header */}
          <div className="text-center">

            <h1 className="text-[15px] font-bold text-foreground">
              Forgot Password
            </h1>

            <p className="text-[13px] text-muted-foreground mt-1">
              SASO Records System
            </p>

          </div>


          <p className="text-sm text-muted-foreground text-center mt-5">
            Enter the email address associated with your
            account and we'll send you a password reset link.
          </p>


          <form
            onSubmit={handleSubmit}
            className="space-y-4 mt-6"
          >

            {/* Email */}
            <div>

              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                placeholder="Enter your email address"
              />

            </div>


            {/* Error */}
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20">

                <p className="text-sm text-destructive">
                  {error}
                </p>

              </div>
            )}


            {/* Success */}
            {success && (
              <div className="px-3 py-2.5 rounded-lg bg-green-50 border border-green-200">

                <p className="text-sm text-green-700">
                  {success}
                </p>

              </div>
            )}


            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >

              {loading
                ? 'Sending...'
                : 'Send Reset Link'}

            </button>


            {/* Back */}
            <button
              type="button"
              onClick={() =>
                navigate('/login')
              }
              className="w-full text-sm text-primary hover:underline"
            >
              ← Back to Login
            </button>

          </form>

        </div>


        <p className="text-center text-[11px] text-muted-foreground mt-10">
          © {new Date().getFullYear()} Olivarez College Tagaytay. All rights reserved.
        </p>

      </div>

    </div>
  )
}