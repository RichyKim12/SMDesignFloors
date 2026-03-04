import '../styles/Services.css';

const serviceItems = [
  'Hardwood flooring installation and refinishing',
  'Custom tile installation and design',
  'Luxury vinyl plank (LVP) and laminate flooring',
  'Professional carpet installation',
  'Kitchen remodeling and upgrades',
  'Bathroom remodeling and custom shower installations',
  'Decorative backsplashes and detailed tile work',
];

const cards = [
  {
    num: '01',
    title: 'Flooring',
    desc: 'Hardwood, laminate, luxury vinyl, tile, and stone installation. We source premium materials and handle everything from subfloor prep to the final finish coat.',
  },
  {
    num: '02',
    title: 'Bathroom Remodeling',
    desc: 'Complete bathroom transformations including tile work, shower and tub surround installation, vanity upgrades, and bespoke design consultation.',
  },
  {
    num: '03',
    title: 'Kitchen Remodeling',
    desc: 'Backsplash, flooring, and full kitchen overhauls. We breathe new life into kitchens with precision tile work and expert flooring solutions.',
  },
];

export default function About() {
  return (
    <section id="about" className="services-section">
      <div className="section-label">Who We Are</div>
      <h2 className="section-title">About <em>Us</em></h2>

      <div className="about-block">
        <h3 className="about-heading">Our Company</h3>
        <p className="about-text">
          Established in 1997, S.M. Design Floors has built a distinguished reputation for
          delivering superior craftsmanship, dependable service, and refined design solutions.
          With more than 27 years of industry experience, we bring technical expertise,
          precision, and professionalism to every project we undertake.
        </p>
        <p className="about-text">
          Our company was founded on the principles of integrity, quality workmanship, and
          personalized service. We understand that your home is one of your most valuable
          investments, and we approach each project with the care and attention it deserves.
        </p>
      </div>

      <div className="about-block">
        <h3 className="about-heading">Our Services</h3>
        <p className="about-text" style={{ marginBottom: '20px' }}>
          S.M. Design Floors specializes in comprehensive residential flooring and interior
          remodeling services, including:
        </p>
        <ul className="about-list">
          {serviceItems.map((item) => (
            <li key={item}>
              <span className="about-bullet" />
              {item}
            </li>
          ))}
        </ul>
        <p className="about-text">
          From initial consultation through project completion, we maintain clear communication,
          meticulous attention to detail, and a commitment to achieving exceptional results.
        </p>
      </div>

      <div className="services-grid">
        {cards.map((s) => (
          <div className="service-card" key={s.num}>
            <div className="service-num">{s.num}</div>
            <h3 className="service-title">{s.title}</h3>
            <p className="service-desc">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
