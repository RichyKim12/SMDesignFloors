import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusTrap from 'focus-trap-react'
import { supabase } from '../lib/supabase'
import {
  sanitizeEmail,
  checkRateLimit,
  formatRetryTime,
  normalizeAuthError,
} from '../lib/formSecurity'
import './AuthModal.css'

export default function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const errorRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const resetState = () => {
    setError('')
    setLoginEmail('')
    setLoginPassword('')
    setLoading(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    // 1. Client-Side Rate Limiting
    const rateCheck = checkRateLimit('auth-login-attempt')
    if (!rateCheck.allowed) {
      setError(`Too many login attempts. Please wait ${formatRetryTime(rateCheck.retryAfterMs)} before trying again.`)
      setTimeout(() => errorRef.current?.focus(), 50)
      return
    }

    // 2. Input Sanitization & Basic Validation
    const cleanEmail = sanitizeEmail(loginEmail)
    if (!cleanEmail) {
      setError('Please enter a valid email address.')
      setTimeout(() => errorRef.current?.focus(), 50)
      return
    }

    if (!loginPassword) {
      setError('Please enter your password.')
      setTimeout(() => errorRef.current?.focus(), 50)
      return
    }

    setLoading(true)

    try {
      // 3. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: loginPassword,
      })

      if (authError) throw authError

      // 4. Role Fetching with Fallback Defense
      const user = authData?.user
      if (!user) throw new Error('User data unavailable after authentication.')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle() // Prevents error throw if profile row is missing

      if (profileError) {
        console.error('Error fetching profile role:', profileError)
      }

      setLoading(false)
      handleClose()

      // 5. Safe Redirection Logic
      if (profile?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/contractor')
      }

    } catch (err) {
      console.error('Login error:', err)
      // Normalize raw auth/server errors so we don't leak backend stack traces
      setError(normalizeAuthError(err) || 'Invalid login credentials. Please try again.')
      setLoading(false)
      setTimeout(() => errorRef.current?.focus(), 50)
    }
  }

  if (!isOpen) {
    return <div className="modal-overlay" aria-hidden="true" />
  }

  return (
    <div
      className={`modal-overlay ${isOpen ? 'visible' : ''}`}
      onClick={handleClose}
    >
      <FocusTrap active={isOpen}>
        <div
          className="modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>

          {/* Eyebrow */}
          <p className="modal-eyebrow">SM Design Floors</p>
          <h2 className="modal-title" id="modal-title">Sign In</h2>

          {/* Error Banner with ARIA Accessibility & Focus Management */}
          {error && (
            <div
              ref={errorRef}
              className="modal-error"
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
            >
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="yourname@example.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                maxLength={254}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="modal-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="modal-signup-prompt">
            Don't have an account?{' '}
            <button
              className="modal-signup-link"
              onClick={() => { handleClose(); navigate('/proservices') }}
            >
              Create one here
            </button>
          </p>
        </div>
      </FocusTrap>
    </div>
  )
}