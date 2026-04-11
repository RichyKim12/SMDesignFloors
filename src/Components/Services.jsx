const services = [
  {
    num: '01',
    title: 'Bathroom Remodel',
    desc: 'Complete bathroom transformations including tile work, shower and tub surround installation, vanity upgrades, and bespoke design consultation.',
    img: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80',
  },
  {
    num: '02',
    title: 'Kitchen Remodel',
    desc: 'Backsplash, flooring, and full kitchen overhauls. We breathe new life into kitchens with precision tile work and expert flooring solutions.',
    img: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=2374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=800&q=80',
  },
  {
    num: '03',
    title: 'Hardwood Flooring',
    desc: 'Timeless hardwood installation and refinishing for any space. We source premium solid and engineered hardwood and handle everything from subfloor prep to the final finish coat.',
    img: 'https://images.unsplash.com/photo-1560185008-b033106af5c3?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGhhcmR3b29kfGVufDB8fDB8fHww?w=800&q=80',
  },
  {
    num: '04',
    title: 'Plumbing',
    desc: 'Reliable plumbing services to support your remodeling projects, from fixture installations and upgrades to full bathroom and kitchen plumbing work.',
    img: 'https://images.unsplash.com/photo-1521207418485-99c705420785?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjJ8fHBsdW1iaW5nfGVufDB8fDB8fHww?w=800&q=80',
  },
  {
    num: '05',
    title: 'LVP & LVT Flooring',
    desc: 'Expert installation of luxury vinyl plank and tile flooring — durable, waterproof, and available in a wide variety of styles to complement any interior.',
    img: 'https://images.unsplash.com/photo-1646592474084-fb3740181648?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=800&q=80',
  },
  {
    num: '06',
    title: 'Free Quote & Consulting',
    desc: 'Not sure where to start? We offer complimentary consultations and detailed project quotes. Let our experts walk you through materials, timelines, and costs — no obligation.',
    img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=800&q=80',
  },
];

const styles = {
  section: {
    padding: '120px 60px',
  },
  label: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: '#8A7A58',
    marginBottom: '16px',
  },
  title: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '3rem',
    fontWeight: 300,
    marginBottom: '60px',
    color: '#2C2519',
  },
  aboutBlock: {
    maxWidth: '820px',
    marginBottom: '60px',
  },
  aboutHeading: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.8rem',
    fontWeight: 400,
    color: '#2C2519',
    marginBottom: '20px',
  },
  aboutText: {
    fontSize: '0.95rem',
    lineHeight: 1.85,
    color: '#5C5240',
    fontWeight: 300,
    marginBottom: '18px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2px',
  },
  card: {
    position: 'relative',
    minHeight: '380px',
    overflow: 'hidden',
    cursor: 'default',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  img: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
    display: 'block',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to top, rgba(10,6,2,0.97) 0%, rgba(10,6,2,0.65) 50%, rgba(10,6,2,0.2) 100%)',
    zIndex: 1,
  },
  content: {
    position: 'relative',
    zIndex: 2,
    padding: '36px',
  },
  num: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '3rem',
    color: '#C9BA96',
    opacity: 0.75,
    lineHeight: 1,
    marginBottom: '12px',
    display: 'block',
  },
  cardTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.6rem',
    fontWeight: 400,
    marginBottom: '10px',
    color: '#f5f0e8',
  },
  desc: {
    fontSize: '0.87rem',
    lineHeight: 1.75,
    color: 'rgba(245,240,232,0.82)',
    fontWeight: 300,
  },
};

export default function Services() {
  return (
    <section id="services" style={styles.section}>
      <div style={styles.label}>What We Do</div>
      <h2 style={styles.title}>Crafted for <em style={{ fontStyle: 'italic', color: '#8A7A58' }}>Every</em> Space</h2>
      <div style={styles.aboutBlock}>
        <h3 style={styles.aboutHeading}>Our Company</h3>
        <p style={styles.aboutText}>
          Established in 1997, S.M. Design Floors has built a distinguished reputation for
          delivering superior craftsmanship, dependable service, and refined design solutions.
          With more than 27 years of industry experience, we bring technical expertise,
          precision, and professionalism to every project we undertake.
        </p>
        <p style={{ ...styles.aboutText, marginBottom: 0 }}>
          Our company was founded on the principles of integrity, quality workmanship, and
          personalized service. We understand that your home is one of your most valuable
          investments, and we approach each project with the care and attention it deserves.
        </p>
      </div>
      <div style={styles.grid}>
        {services.map((s) => (
          <div key={s.num} style={styles.card}>
            <img src={s.img} alt={s.title} style={styles.img} />
            <div style={styles.overlay} />
            <div style={styles.content}>
              <span style={styles.num}>{s.num}</span>
              <h3 style={styles.cardTitle}>{s.title}</h3>
              <p style={styles.desc}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}