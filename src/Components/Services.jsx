import './Services.css';

const services = [
  {
    num: '01',
    title: 'Bathroom Remodeling',
    desc: 'Complete bathroom transformations including tile work, shower and tub surround installation, vanity upgrades, and bespoke design consultation.',
    img: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80',
    alt: 'Modern bathroom interior featuring a clean white bathtub, tiled wall, and ambient lighting'
  },
  {
    num: '02',
    title: 'Kitchen Remodel',
    desc: 'Backsplash, flooring, and full kitchen overhauls. We breathe new life into kitchens with precision tile work and expert flooring solutions.',
    img: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=2374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=800&q=80',
    alt: 'Updated kitchen with white cabinetry, stainless steel appliances, and tile backsplash'
  },
  {
    num: '03',
    title: 'Hardwood Flooring',
    desc: 'Timeless hardwood installation and refinishing for any space. We source premium solid and engineered hardwood and handle everything from subfloor prep to the final finish coat.',
    img: 'https://images.unsplash.com/photo-1560185008-b033106af5c3?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGhhcmR3b29kfGVufDB8fDB8fHww?w=800&q=80',
    alt: 'Living room with polished natural hardwood flooring and dining furniture'
  },
  {
    num: '04',
    title: 'Plumbing',
    desc: 'Reliable plumbing services to support your remodeling projects, from fixture installations and upgrades to full bathroom and kitchen plumbing work.',
    img: 'https://images.unsplash.com/photo-1521207418485-99c705420785?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjJ8fHBsdW1iaW5nfGVufDB8fDB8fHww?w=800&q=80',
    alt: 'Close-up of running water flowing from a sleek metal faucet'
  },
  {
    num: '05',
    title: 'LVP & LVT Flooring',
    desc: 'Expert installation of luxury vinyl plank and tile flooring that is durable, waterproof, and available in a wide variety of styles to complement any interior.',
    img: 'https://images.unsplash.com/photo-1646592474084-fb3740181648?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=800&q=80',
    alt: 'Spacious empty room showcasing light-colored wood-look vinyl plank flooring'
  },
  {
    num: '06',
    title: 'Painting',
    desc: 'Professional interior and exterior painting services designed to deliver smooth, high-quality finishes with careful surface preparation, clean lines, and durable results that refresh and protect your home.',
    img: 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Paint roller applying bright orange paint next to vertical stripes of colorful paint on a wall'
  },
  {
    num: '07',
    title: 'Electrical',
    desc: 'Licensed electrical services for residential and commercial projects providing safe, code-compliant installations, repairs, and upgrades including lighting, outlets, panel work, and troubleshooting, all delivered with precision and reliability.',
    img: 'https://plus.unsplash.com/premium_photo-1682086494759-b459f6eff2df?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fEVsZWN0cmljaWFufGVufDB8fDB8fHww',
    alt: 'Hands testing electrical wires in a wall outlet box using a voltage tester tool'
  },
  {
    num: '08',
    title: 'Cabinetry & Vanity',
    desc: 'Cabinetry and vanity installation focused on precise, professional setup of pre-built cabinets and vanities, ensuring a secure fit, proper alignment, and a clean, polished finish that enhances the functionality and look of your space.',
    img: 'https://images.unsplash.com/photo-1627362726047-1bda6d2ca237?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Custom wooden bathroom vanity drawers with brass handles and marble countertop'
  },
  {
    num: '09',
    title: 'Free Quote & Consulting',
    desc: 'Not sure where to start? We offer complimentary consultations and detailed project quotes with no obligation. A skilled handyman is available to assist with repairs, installations, and general home improvement needs.',
    img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=800&q=80',
    alt: 'Person holding a digital tablet device during a consultation'
  }
];
export default function Services() {
  return (
    <section id="services" className="svc-section">
      <div className="svc-label">What We Do</div>
      <h2 className="svc-title">Crafted for <em>Every</em> Space</h2>

      <div className="svc-about">
        <h3 className="svc-about-heading">Our Company</h3>
        <p className="svc-about-text">
          Established in 1997, S.M. Design Floors has built a distinguished reputation for
          delivering superior craftsmanship, dependable service, and refined design solutions.
          With more than 27 years of industry experience, we bring technical expertise,
          precision, and professionalism to every project we undertake.
        </p>
        <p className="svc-about-text svc-about-text--last">
          Our company was founded on the principles of integrity, quality workmanship, and
          personalized service. We understand that your home is one of your most valuable
          investments, and we approach each project with the care and attention it deserves.
        </p>
      </div>

      <div className="svc-grid">
        {services.map((s) => (
          <div key={s.num} className="svc-card">
            <img src={s.img} alt={s.alt} className="svc-card-img" />
            <div className="svc-card-overlay" />
            <div className="svc-card-content">
              <span className="svc-num">{s.num}</span>
              <h3 className="svc-card-title">{s.title}</h3>
              <p className="svc-card-desc">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}