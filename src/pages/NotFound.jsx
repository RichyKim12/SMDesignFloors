import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f0e8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <h1 style={{ fontSize: '6rem', fontWeight: 700, color: '#1a1714', margin: 0 }}>404</h1>
      <p style={{ color: '#6b5f52', marginBottom: 32 }}>This page doesn't exist.</p>
      <button
        onClick={() => navigate('/')}
        style={{
          background: '#1a1714', color: 'white',
          border: 'none', borderRadius: 10,
          padding: '10px 24px', cursor: 'pointer',
          fontSize: '0.9rem', fontWeight: 600,
        }}
      >
        Go Home
      </button>
    </div>
  );
}