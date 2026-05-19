import { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { getUserRole } from '../lib/supabase'

export default function RoleRoute({ allowedRoles }) {
  const [role, setRole] = useState(undefined)

  useEffect(() => {
    getUserRole().then(setRole)
  }, [])

  if (role === undefined) return <p>Loading...</p>
  if (!allowedRoles.includes(role)) return <Navigate to="/" replace />
  return <Outlet />
}