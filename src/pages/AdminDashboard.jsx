// src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubmissions() {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error) setSubmissions(data)
      setLoading(false)
    }
    fetchSubmissions()
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ padding: '100px 60px', background: 'var(--cream)', minHeight: '100vh' }}>
      <div className="section-label">Admin</div>
      <h2 className="section-title">Contact <em>Submissions</em></h2>

      {submissions.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--tan)', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Email</th>
              <th style={{ padding: '12px' }}>Phone</th>
              <th style={{ padding: '12px' }}>Service</th>
              <th style={{ padding: '12px' }}>Message</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px' }}>{s.name}</td>
                <td style={{ padding: '12px' }}>{s.email}</td>
                <td style={{ padding: '12px' }}>{s.phone}</td>
                <td style={{ padding: '12px' }}>{s.service}</td>
                <td style={{ padding: '12px', maxWidth: '300px' }}>{s.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}