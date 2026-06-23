import { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
  }, [])

  if (session === undefined) return <p>Loading...</p>
  return session ? <Outlet /> : <Navigate to="/" />
}