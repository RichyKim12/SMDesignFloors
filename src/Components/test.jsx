import { useState } from "react";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("all");
  const [proSuccess, setProSuccess] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  const portfolioItems = [
    { id: 1, cat: "bathroom", title: "Luxury Bath Renovation", subtitle: "Master Suite · 2024", pattern: "p-marble", wide: true },
    { id: 2, cat: "flooring", title: "Hardwood Flooring", subtitle: "Living Room · 2024", pattern: "p-wood" },
    { id: 3, cat: "flooring", title: "Herringbone Tile", subtitle: "Entryway · 2023", pattern: "p-herring" },
    { id: 4, cat: "bathroom", title: "Stone Tile Bath", subtitle: "Spa Bath · 2024", pattern: "p-stone" },
    { id: 5, cat: "kitchen", title: "Kitchen Backsplash", subtitle: "Full Remodel · 2023", pattern: "p-hex" }
  ];

  const filteredItems =
    activeTab === "all"
      ? portfolioItems
      : portfolioItems.filter((item) => item.cat === activeTab);

  const handleProSubmit = (e) => {
    e.preventDefault();
    setProSuccess(true);
    e.target.reset();
    setTimeout(() => setProSuccess(false), 5000);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess(true);
    e.target.reset();
    setTimeout(() => setContactSuccess(false), 5000);
  };

  return (
    <>
      {/* NAV */}
      <nav>
        <div className="nav-logo">
          Craft<span>Stone</span> Interiors
        </div>
        <ul className="nav-links">
          <li><a href="#services">Services</a></li>
          <li><a href="#portfolio">Portfolio</a></li>
          <li><a href="#professionals">Professionals</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-text">
          <div className="eyebrow">Premium Remodeling · Since 2008</div>
          <h1 className="hero-title">
            Floors &<br /><em>Spaces</em><br />Reimagined
          </h1>
          <p className="hero-sub">
            We craft enduring spaces through expert flooring installation,
            bathroom transformations, and kitchen remodeling.
          </p>
          <div className="btn-row">
            <a href="#contact" className="btn-primary">Get a Free Quote</a>
            <a href="#portfolio" className="btn-outline">View Our Work</a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="img-box">
            <div className="p-marble"></div>
            <div className="img-label">Bathroom Remodel</div>
          </div>
          <div className="img-box">
            <div className="p-wood"></div>
            <div className="img-label">Hardwood Floors</div>
          </div>
          <div className="img-box">
            <div className="p-tile"></div>
            <div className="img-label">Tile Work</div>
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <section id="services">
        <div className="section-label">What We Do</div>
        <h2 className="section-title">
          Crafted for <em>Every</em> Space
        </h2>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio">
        <div className="section-label">Our Work</div>
        <h2 className="section-title">
          Recent <em>Projects</em>
        </h2>

        <div className="tabs">
          {["all", "flooring", "bathroom", "kitchen"].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="portfolio-grid">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className={`port-item ${activeTab === "all" && index === 0 ? "wide" : ""}`}
            >
              <div className={item.pattern} style={{ position: "absolute", inset: 0 }}></div>
              <div className="port-overlay">
                <div className="port-caption">
                  <strong>{item.title}</strong>
                  {item.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROFESSIONALS */}
      <section id="professionals">
        <div>
          <div className="form-card">
            <div className="form-title">Join Our Network</div>
            <form onSubmit={handleProSubmit}>
              <input type="text" placeholder="Full Name" required />
              <input type="email" placeholder="Email Address" required />
              <button type="submit" className="form-submit">
                Submit to Network
              </button>
            </form>
            {proSuccess && (
              <div className="success-banner show">
                ✓ Thank you! We'll be in touch soon.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact">
        <div className="form-card">
          <div className="form-title">Request a Quote</div>
          <form onSubmit={handleContactSubmit}>
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Email Address" required />
            <textarea placeholder="Project Description" required />
            <button type="submit" className="form-submit">
              Send My Request
            </button>
          </form>
          {contactSuccess && (
            <div className="success-banner show">
              ✓ Request received! We'll reach out soon.
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">
          CraftStone <span>Interiors</span>
        </div>
        <p>© 2025 CraftStone Interiors. All rights reserved.</p>
      </footer>
    </>
  );
}