import { useRef, useEffect } from 'react';
import './Footer.css';

const BRAND_LOGOS = [
  <div style={{ width: 50, height: 50, background: 'var(--tan)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', color: 'white', fontWeight: 600 }}>A</div>,
  <div style={{ width: 0, height: 0, borderLeft: '28px solid transparent', borderRight: '28px solid transparent', borderBottom: '48px solid var(--tan-dark)' }} />,
  <div style={{ width: 50, height: 50, background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', color: 'var(--tan)', fontWeight: 600 }}>B</div>,
  <div style={{ width: 50, height: 50, background: 'var(--mid)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', color: 'white', fontWeight: 600 }}>C</div>,
  <div style={{ display: 'flex', gap: 6 }}>
    <div style={{ width: 16, height: 50, background: 'var(--tan)' }} />
    <div style={{ width: 16, height: 50, background: 'var(--tan-dark)' }} />
    <div style={{ width: 16, height: 50, background: 'var(--dark)' }} />
  </div>,
  <div style={{ width: 50, height: 50, border: '4px solid var(--tan-dark)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', color: 'var(--tan-dark)', fontWeight: 600 }}>D</div>,
  <div style={{ width: 50, height: 50, background: 'linear-gradient(135deg,var(--tan),var(--tan-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', color: 'white', fontWeight: 600, transform: 'rotate(45deg)' }}>
    <span style={{ transform: 'rotate(-45deg)' }}>E</span>
  </div>,
  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', fontWeight: 300, color: 'var(--dark)', letterSpacing: '0.1em', fontStyle: 'italic' }}>Brand</div>,
];

function BrandCarousel() {
  const trackRef    = useRef(null);
  const isDragging  = useRef(false);
  const startX      = useRef(0);
  const animOffset  = useRef(0);
  const currentX    = useRef(0);
  const resumeTimer = useRef(null);

  const getTrackX = () =>
    new DOMMatrixReadOnly(window.getComputedStyle(trackRef.current).transform).m41;

  const startDrag = (clientX) => {
    isDragging.current  = true;
    startX.current      = clientX;
    animOffset.current  = getTrackX();
    trackRef.current.classList.add('dragging');
    trackRef.current.style.animation  = 'none';
    trackRef.current.style.transform  = `translateX(${animOffset.current}px)`;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  };

  const moveDrag = (clientX) => {
    if (!isDragging.current) return;
    let newX = animOffset.current + (clientX - startX.current);
    const half = trackRef.current.scrollWidth / 2;
    if (newX > 0)     newX -= half;
    if (newX < -half) newX += half;
    trackRef.current.style.transform = `translateX(${newX}px)`;
    currentX.current = newX;
  };

  const stopDrag = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    trackRef.current.classList.remove('dragging');
    resumeTimer.current = setTimeout(() => {
      const half = trackRef.current.scrollWidth / 2;
      const pct  = Math.abs(currentX.current) / half;
      trackRef.current.style.animation = `scroll-brands 22s linear ${-pct * 22}s infinite`;
    }, 3000);
  };

  useEffect(() => {
    const track = trackRef.current;
    const onMouseDown  = (e) => { startDrag(e.clientX); e.preventDefault(); };
    const onMouseMove  = (e) => moveDrag(e.clientX);
    const onTouchStart = (e) => startDrag(e.touches[0].clientX);
    const onTouchMove  = (e) => moveDrag(e.touches[0].clientX);

    track.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
    track.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', stopDrag);

    return () => {
      track.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      track.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, []);

  // Duplicate logos for seamless loop
  const allLogos = [...BRAND_LOGOS, ...BRAND_LOGOS];

  return (
    <div className="brand-carousel">
      <div className="brand-carousel-label">Our Trusted Brands</div>
      <div className="brand-track-wrapper">
        <div className="brand-track" ref={trackRef}>
          {allLogos.map((logo, i) => (
            <div key={i} className="brand-box">{logo}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <>
      <BrandCarousel />
      <footer>
        <div className="footer-logo">SM <span>Design</span> Floors</div>
        <p>© 2026 SM Design Floors. All rights reserved.</p>
      </footer>
    </>
  );
}