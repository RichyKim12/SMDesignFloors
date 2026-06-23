import { useRef, useEffect, useState } from 'react';
import './Footer.css';

import easternFlooring from '../assets/Brands/Eastern-Flooring-Products-1.png';
import emsertile from '../assets/Brands/emsertile.jpeg';
import floridatile from '../assets/Brands/floridatile.jfif';
import mullican from '../assets/Brands/Mullican-Flooring-Logo-Vector.svg-.png';
import wickaham from '../assets/Brands/Wickaham.png';
import chesapeake from '../assets/Brands/Screenshot_26-3-2026_19252_tse2.mm.bing.net.jpeg';
import bruce from '../assets/Brands/Screenshot_26-3-2026_19278_tse2.mm.bing.net.jpeg';
import armstrong from '../assets/Brands/Screenshot_26-3-2026_19329_images.squarespace-cdn.com.jpeg';
import mirage from '../assets/Brands/Screenshot_26-3-2026_192639_www.phillipsfloors.com.jpeg';
import arizona from '../assets/Brands/Screenshot_26-3-2026_193040_tse1.mm.bing.net.jpeg';
import daltile from '../assets/Brands/Screenshot_26-3-2026_193114_tse1.mm.bing.net.jpeg';
import shaw from '../assets/Brands/Screenshot_26-3-2026_193135_tse3.mm.bing.net.jpeg';

const BRANDS = [
  { src: easternFlooring, name: 'Eastern Flooring Products' },
  { src: emsertile,       name: 'Emser Tile' },
  { src: floridatile,     name: 'Florida Tile' },
  { src: mullican,        name: 'Mullican Flooring' },
  { src: wickaham,        name: 'Wickham' },
  { src: chesapeake,      name: 'Chesapeake Flooring' },
  { src: bruce,           name: 'Bruce Flooring' },
  { src: armstrong,       name: 'Armstrong Flooring' },
  { src: mirage,          name: 'Mirage Floors' },
  { src: arizona,         name: 'Arizona Tile' },
  { src: daltile,         name: 'Daltile' },
  { src: shaw,            name: 'Shaw Floors' },
];
// Please verify these brand names match the actual logos/spellings.

function BrandCarousel() {
  const trackRef    = useRef(null);
  const isDragging  = useRef(false);
  const startX      = useRef(0);
  const animOffset  = useRef(0);
  const currentX    = useRef(0);
  const resumeTimer = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

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
    if (isPaused) return;
    resumeTimer.current = setTimeout(() => {
      const half = trackRef.current.scrollWidth / 2;
      const pct  = Math.abs(currentX.current) / half;
      trackRef.current.style.animation = `scroll-brands 22s linear ${-pct * 22}s infinite`;
    }, 3000);
  };

  const togglePause = () => {
    setIsPaused(prev => {
      const next = !prev;
      if (trackRef.current) {
        trackRef.current.style.animationPlayState = next ? 'paused' : 'running';
      }
      return next;
    });
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

  const allBrands = [...BRANDS, ...BRANDS];

  return (
    <div className="brand-carousel">
      <div className="brand-carousel-header">
        <div className="brand-carousel-label" id="brand-carousel-heading">
          Our Trusted Brands
        </div>
        <button
          type="button"
          className="carousel-pause-btn"
          onClick={togglePause}
          aria-pressed={isPaused}
        >
          {isPaused ? '▶ Play' : '⏸ Pause'}
          <span className="sr-only"> brand logo scrolling</span>
        </button>
      </div>
      <div
        className="brand-track-wrapper"
        role="region"
        aria-labelledby="brand-carousel-heading"
      >
        <div className="brand-track" ref={trackRef}>
          {allBrands.map((brand, i) => (
            <div key={i} className="brand-box">
              <img
                src={brand.src}
                alt={brand.name}
                style={{ maxWidth: '110px', maxHeight: '50px', objectFit: 'contain' }}
              />
            </div>
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