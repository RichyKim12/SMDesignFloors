import '../styles/Services.css';

const services = [
  {
    num: '01',
    title: 'Carpeting',
    desc: 'Professional carpet installation for every room. We help you select from a wide range of styles, textures, and materials to suit your comfort and design vision.',
    bg: 'sc-carpet',
  },
  {
    num: '02',
    title: 'Bathroom Remodel',
    desc: 'Complete bathroom transformations including tile work, shower and tub surround installation, vanity upgrades, and bespoke design consultation.',
    bg: 'sc-bathroom',
  },
  {
    num: '03',
    title: 'Kitchen Remodel',
    desc: 'Backsplash, flooring, and full kitchen overhauls. We breathe new life into kitchens with precision tile work and expert flooring solutions.',
    bg: 'sc-kitchen',
  },
  {
    num: '04',
    title: 'Hardwood Flooring',
    desc: 'Timeless hardwood installation and refinishing for any space. We source premium solid and engineered hardwood and handle everything from subfloor prep to the final finish coat.',
    bg: 'sc-hardwood',
  },
  {
    num: '05',
    title: 'Plumbing',
    desc: 'Reliable plumbing services to support your remodeling projects, from fixture installations and upgrades to full bathroom and kitchen plumbing work.',
    bg: 'sc-plumbing',
  },
  {
    num: '06',
    title: 'LVP & LVT Flooring',
    desc: 'Expert installation of luxury vinyl plank and tile flooring — durable, waterproof, and available in a wide variety of styles to complement any interior.',
    bg: 'sc-lvp',
  },
];

export default function Services() {
  return (
    <section id="services" className="services-section">
      <div className="section-label">What We Do</div>
      <h2 className="section-title">Crafted for <em>Every</em> Space</h2>

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

      <div className="services-grid">
        {services.map((s) => (
          <div className={`service-card ${s.bg}`} key={s.num}>
            <div className="service-card-bg" />
            <div className="service-card-overlay" />
            <div className="service-card-content">
              <div className="service-num">{s.num}</div>
              <h3 className="service-title">{s.title}</h3>
              <p className="service-desc">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}