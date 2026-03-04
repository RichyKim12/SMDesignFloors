import '../styles/Navbar.css';

export default function Navbar() {
  return (
    <nav className="nav">
      <a href="#" className="nav-logo">
        SM <span>Design</span> Floors
      </a>
      <ul className="nav-links">
        <li><a href="#about">About Us</a></li>
        <li><a href="#professionals">ProServices</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  );
}
