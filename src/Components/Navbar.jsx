import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function ScheduleBanner() {
  const now = new Date();
  const day = now.getDay();
  const timeDecimal = now.getHours() + now.getMinutes() / 60;
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayName = days[day];

  const isSunday = day === 0;
  const isOpen   = day >= 1 && day <= 6 && timeDecimal >= 10 && timeDecimal < 18;

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

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <>
      <nav>
        {/* Logo — always goes home */}
        <Link to="/" className="nav-logo">
          SM <span>Design</span> Floors
        </Link>

        <ul className="nav-links">
          {/* Anchor links — scroll within the home page */}
          <li><a href="/#services">About Us</a></li>

          {/* React Router — navigates to its own page */}
          <li><Link to="/proservices">ProServices</Link></li>

          {/* Anchor link — scroll within home page */}
          <li><a href="/#contact">Contact</a></li>

          {/* Flooring Visualizer page */}
          <li>
            <button
              className="nav-visualizer-btn"
              onClick={() => navigate('/visualizer')}
            >
              Flooring Visualizer
            </button>
          </li>
        </ul>
      </nav>
      <ScheduleBanner />
    </>
  );
}