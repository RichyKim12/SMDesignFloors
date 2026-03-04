import '../styles/Hero.css';

export default function Hero() {
  return (
    <div className="hero">
      <div className="hero-text">
        <div className="eyebrow">Premium Remodeling · Since 1997</div>
        <h1 className="hero-title">
          Floors &amp;<br />
          <em>Spaces</em><br />
          Reimagined
        </h1>
        <p className="hero-sub">
          We craft enduring spaces through expert flooring installation, bathroom
          transformations, and kitchen remodeling—each project a testament to quality
          craftsmanship.
        </p>
        <div className="btn-row">
          <a href="#contact" className="btn-primary">Get a Free Quote</a>
          <a href="#portfolio" className="btn-outline">View Our Work</a>
        </div>
      </div>

      <div className="hero-visual">
        <div className="img-box">
          <div className="p-marble" />
          <div className="img-label">Bathroom Remodel</div>
        </div>
        <div className="img-box">
          <div className="p-wood" />
          <div className="img-label">Hardwood Floors</div>
        </div>
        <div className="img-box">
          <div className="p-tile" />
          <div className="img-label">Tile Work</div>
        </div>
      </div>
    </div>
  );
}
