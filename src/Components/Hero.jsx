import './Hero.css';
import imgStorefront from '../assets/Hero/image4.jpg';
import imgShowroom from '../assets/Hero/image5.JPG';
import imgWork from '../assets/Hero/image1.JPG';

export default function Hero() {
  return (
    <div className="hero">
      <div className="hero-text">
        <div className="eyebrow">Premium Remodeling · Since 1997</div>
        <h1 className="hero-title">
          Floors &amp;<br /><em>Spaces</em><br />Reimagined
        </h1>
        <p className="hero-sub">
          We craft enduring spaces through expert flooring installation, bathroom
          transformations, and kitchen remodeling—each project a testament to quality craftsmanship.
        </p>
        <div className="btn-row">
          <a href="#contact" className="btn-primary" style={{ padding: '22px 80px' }}>
            Get a Free Quote
          </a>
        </div>
      </div>

      <div className="hero-visual">
        <div className="img-box">
          <img src={imgWork} alt="Our work" />
          <div className="img-label">Our Work</div>
        </div>
        <div className="img-box">
          <img src={imgStorefront} alt="SM Floors storefront" />
          
        </div>
        <div className="img-box">
          <img src={imgShowroom} alt="Our showroom" />
          
        </div>
        
      </div>
    </div>
  );
}