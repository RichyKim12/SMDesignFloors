import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Navbar.css';
import triangleLogo from '../assets/Logo/new-logo.png';
import { supabase } from '../lib/supabase';

function ScheduleBanner() {
  const now         = new Date();
  const day         = now.getDay();
  const timeDecimal = now.getHours() + now.getMinutes() / 60;
  const days        = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayName     = days[day];
  const isSunday    = day === 0;
  const isOpen      = day >= 1 && day <= 6 && timeDecimal >= 10 && timeDecimal < 18;

  let text = '';
  if (isSunday)              text = 'Sunday — Closed Today';
  else if (isOpen)           text = `${dayName} — Open Today · 10:00 AM – 6:00 PM`;
  else if (timeDecimal < 10) text = `${dayName} — Opens at 10:00 AM`;
  else                       text = `${dayName} — Closed · Opens Tomorrow at 10:00 AM`;

  return (
    <div className={`schedule-banner ${isOpen ? 'open' : 'closed'}`}>
      <span className="schedule-dot" />
      <span>{text}</span>
    </div>
  );
}

export default function Navbar({ onLoginClick }) {
  const location     = useLocation();
  const navigate     = useNavigate();
  const isDashboard  = location.pathname === '/contractor' || location.pathname === '/admin';
  const [role, setRole] = useState(null);

  useEffect(() => {
    // get current session role
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return setRole(null);
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      setRole(data?.role || null);
    });

    // listen for auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) return setRole(null);
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      setRole(data?.role || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    navigate('/');
  };

  return (
    <>
      <nav>
        {/* Logo — always visible, links home only when not on dashboard */}
        {isDashboard
          ? <div className="nav-logo" style={{ cursor: 'default' }}>
              <img src={triangleLogo} alt="SM Design Floors logo" className="nav-logo-img" />
              <span className="nav-logo-text">
                <span style={{ color: '#ff6a00d3' }}>S</span>
                <span style={{ color: '#3B8C1A' }}>.</span>
                <span style={{ color: '#f3b20dd7' }}>M</span>
                <span className="nav-logo-name">Design Floors</span>
              </span>
            </div>
          : <Link to="/" className="nav-logo">
              <img src={triangleLogo} alt="SM Design Floors logo" className="nav-logo-img" />
              <span className="nav-logo-text">
                <span style={{ color: '#ff6a00d3' }}>S</span>
                <span style={{ color: '#3B8C1A' }}>.</span>
                <span style={{ color: '#f3b20dd7' }}>M</span>
                <span className="nav-logo-name">Design Floors</span>
              </span>
            </Link>
        }

        <ul className="nav-links">
          {/* Main nav — hidden on dashboard pages */}
          {!isDashboard && (
            <>
              <li><a href="/#services">About Us</a></li>
              <li><Link to="/proservices">ProServices</Link></li>
              <li><a href="/#contact">Contact</a></li>
            </>
          )}

          {/* Dashboard button — only for logged-in contractors */}
          {role === 'contractor' && !isDashboard && (
            <li>
              <Link to="/contractor" className="nav-dashboard-btn">
                Dashboard
              </Link>
            </li>
          )}

          {/* Admin dashboard button */}
          {role === 'admin' && !isDashboard && (
            <li>
              <Link to="/admin" className="nav-dashboard-btn">
                Admin Panel
              </Link>
            </li>
          )}

          {/* Sign out on dashboard, login elsewhere */}
          {isDashboard
            ? <></>
            : !role && (
              <li>
                <button className="nav-login-btn" onClick={onLoginClick}>
                  Contractor Login
                </button>
              </li>
            )
          }
        </ul>
      </nav>
      <ScheduleBanner />
    </>
  );
}