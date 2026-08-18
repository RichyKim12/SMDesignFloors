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
  if (isSunday)          text = 'Sunday — Closed Today';
  else if (isOpen)           text = `${dayName} — Open Today · 10:00 AM – 6:00 PM`;
  else if (timeDecimal < 10) text = `${dayName} — Opens at 10:00 AM`;
  else                       text = `${dayName} — Closed · Opens Tomorrow at 10:00 AM`;

  return (
    <div className={`schedule-banner ${isOpen ? 'open' : 'closed'}`}>
      <span className="schedule-dot" />
      <span className="schedule-text">{text}</span>
    </div>
  );
}

export default function Navbar({ onLoginClick, loginTriggerRef }) {
  const location     = useLocation();
  const navigate     = useNavigate();
  const isDashboard  = location.pathname === '/contractor' || location.pathname === '/admin';
  const [role, setRole] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return setRole(null);
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      setRole(data?.role || null);
    });

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

  // Close mobile menu on page navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <nav aria-label="Main navigation">
        {/* Logo */}
        {isDashboard ? (
          <div className="nav-logo" style={{ cursor: 'default' }}>
            <img src={triangleLogo} alt="SM Design Floors logo" className="nav-logo-img" />
            <span className="nav-logo-text">
              <span style={{ color: '#FF6A00' }}>S</span>
              <span style={{ color: '#3FA815' }}>.</span>
              <span style={{ color: '#F3B20D' }}>M</span>
              <span className="nav-logo-name">Design Floors</span>
            </span>
          </div>
        ) : (
          <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
            <img src={triangleLogo} alt="SM Design Floors logo" className="nav-logo-img" />
            <span className="nav-logo-text">
              <span style={{ color: '#FF6A00' }}>S</span>
              <span style={{ color: '#3FA815' }}>.</span>
              <span style={{ color: '#F3B20D' }}>M</span>
              <span className="nav-logo-name">Design Floors</span>
            </span>
          </Link>
        )}

        {/* Mobile Hamburger Button */}
        {!isDashboard && (
          <button
            className={`nav-toggle ${isMobileMenuOpen ? 'open' : ''}`}
            aria-expanded={isMobileMenuOpen}
            aria-controls="nav-menu"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>
        )}

        {/* Navigation Links */}
        <ul
          id="nav-menu"
          className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}
        >
          {!isDashboard && (
            <>
              <li><a href="/#services" onClick={closeMobileMenu}>About Us</a></li>
              <li><Link to="/proservices" onClick={closeMobileMenu}>ProServices</Link></li>
              <li><a href="/#contact" onClick={closeMobileMenu}>Contact</a></li>
            </>
          )}

          {role === 'contractor' && !isDashboard && (
            <li>
              <Link to="/contractor" className="nav-dashboard-btn" onClick={closeMobileMenu}>
                Dashboard
              </Link>
            </li>
          )}

          {role === 'admin' && !isDashboard && (
            <li>
              <Link to="/admin" className="nav-dashboard-btn" onClick={closeMobileMenu}>
                Admin Panel
              </Link>
            </li>
          )}

          {isDashboard ? null : !role && (
            <li>
              <button
                className="nav-login-btn"
                ref={loginTriggerRef}
                onClick={() => {
                  closeMobileMenu();
                  onLoginClick();
                }}
              >
                Contractor Login
              </button>
            </li>
          )}
        </ul>
      </nav>
      <ScheduleBanner />
    </>
  );
}