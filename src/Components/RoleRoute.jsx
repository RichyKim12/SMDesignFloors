import { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
// import { supabase } from '../lib/supabase'

export default function RoleRoute({ allowedRoles }) {
  // const [role, setRole] = useState(undefined)

  // useEffect(() => {
  //   const fetchRole = async () => {
  //     const { data: { user } } = await supabase.auth.getUser()
  //     const { data } = await supabase
  //       .from('profiles')
  //       .select('role')
  //       .eq('id', user.id)
  //       .single()
  //     setRole(data?.role)
  //   }
  //   fetchRole()
  // }, [])

  // if (role === undefined) return <p>Loading...</p>
  // return allowedRoles.includes(role) ? <Outlet /> : <Navigate to="/login" />
}