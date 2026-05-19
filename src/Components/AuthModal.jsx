import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './AuthModal.css'

export default function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate()

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    handleClose()
    if (profile.role === 'admin') navigate('/admin')
    else navigate('/contractor')
  }

  return (
    <div
      className={`modal-overlay ${isOpen ? 'visible' : ''}`}
      onClick={handleClose}
    >
      <div className="modal-card" onClick={e => e.stopPropagation()}>

        {/* Close button */}
        <button className="modal-close" onClick={handleClose}>✕</button>

        {/* Eyebrow */}
        <p className="modal-eyebrow">SM Design Floors</p>
        <h2 className="modal-title">Sign In</h2>

        {error && <div className="modal-error">{error}</div>}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="yourname@example.com"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
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
    </div>
  )
} 