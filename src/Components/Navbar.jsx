import './Navbar.css';

function ScheduleBanner() {
  const now = new Date();
  const day = now.getDay();
  const timeDecimal = now.getHours() + now.getMinutes() / 60;
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayName = days[day];

  const isSunday = day === 0;
  const isOpen = day >= 1 && day <= 6 && timeDecimal >= 10 && timeDecimal < 18;

  let text = '';
  if (isSunday)        text = 'Sunday — Closed Today';
  else if (isOpen)     text = `${dayName} — Open Today · 10:00 AM – 6:00 PM`;
  else if (timeDecimal < 10) text = `${dayName} — Opens at 10:00 AM`;
  else                 text = `${dayName} — Closed · Opens Tomorrow at 10:00 AM`;

  return (
    <div className={`schedule-banner ${isOpen ? 'open' : 'closed'}`}>
      <span className="schedule-dot" />
      <span>{text}</span>
    </div>
  );
}

export default function Navbar() {
  return (
    <>
      <nav>
        <a href="#" className="nav-logo">
          SM <span>Design</span> Floors
        </a>
        <ul className="nav-links">
          <li><a href="#services">About Us</a></li>
          <li><a href="#professionals">ProServices</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
      <ScheduleBanner />
    </>
  );
}