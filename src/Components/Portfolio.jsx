import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Masonry from 'react-masonry-css';
import FocusTrap from 'focus-trap-react';
import './Portfolio.css';

const breakpointCols = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
};

const TABS = [
  { key: 'all',      label: 'All'      },
  { key: 'flooring', label: 'Flooring' },
  { key: 'kitchen',  label: 'Kitchen'  },
  { key: 'bathroom', label: 'Bathroom' },
];

const PAGE_SIZE = 12;

// Injected once into <head> — contrast and accessibility enhanced
const LIGHTBOX_STYLES = `
  .lb-backdrop {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 99999 !important;
    background: rgba(0,0,0,0.95) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    overflow: hidden !important;
  }
  .lb-content {
    position: relative !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    max-width: 90vw !important;
    max-height: 90vh !important;
    z-index: 100000 !important;
  }
  .lb-img {
    max-width: 88vw !important;
    max-height: 80vh !important;
    object-fit: contain !important;
    display: block !important;
    box-shadow: 0 8px 60px rgba(0,0,0,0.7) !important;
  }
  .lb-caption {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    width: 100% !important;
    margin-top: 14px !important;
    color: #FFFFFF !important;
    font-size: 1rem !important;
    font-weight: 500 !important;
    letter-spacing: 0.08em !important;
    text-transform: capitalize !important;
    padding: 0 4px !important;
    font-family: 'Jost', sans-serif !important;
  }
  .lb-counter {
    color: #F5E6C8 !important;
    font-size: 0.95rem !important;
    font-weight: 600 !important;
    letter-spacing: 0.1em !important;
  }
  .lb-close {
    position: fixed !important;
    top: 24px !important;
    right: 28px !important;
    z-index: 100001 !important;
    background: rgba(0, 0, 0, 0.6) !important;
    border: 2px solid #FFFFFF !important;
    color: #FFFFFF !important;
    font-size: 1.2rem !important;
    width: 44px !important;
    height: 44px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    border-radius: 50% !important;
    transition: background 0.2s, transform 0.2s !important;
  }
  .lb-close:hover, .lb-close:focus { 
    background: #FFFFFF !important; 
    color: #000000 !important;
    outline: none !important;
  }
  .lb-prev, .lb-next {
    position: fixed !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    z-index: 100001 !important;
    background: rgba(0, 0, 0, 0.6) !important;
    border: 2px solid #FFFFFF !important;
    color: #FFFFFF !important;
    font-size: 2.2rem !important;
    width: 52px !important;
    height: 52px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    transition: background 0.2s, color 0.2s !important;
    line-height: 1 !important;
    border-radius: 4px !important;
  }
  .lb-prev:hover, .lb-next:hover, .lb-prev:focus, .lb-next:focus { 
    background: #FFFFFF !important; 
    color: #000000 !important;
    outline: none !important;
  }
  .lb-prev { left: 20px !important; }
  .lb-next { right: 20px !important; }
  @media (max-width: 700px) {
    .lb-prev, .lb-next { display: none !important; }
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('lb-styles')) {
  const style = document.createElement('style');
  style.id = 'lb-styles';
  style.textContent = LIGHTBOX_STYLES;
  document.head.appendChild(style);
}

export default function Portfolio() {
  const [allImages, setAllImages]       = useState([]);
  const [activeTab, setActiveTab]       = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lightbox, setLightbox]         = useState(null);

  const triggerRef = useRef(null);

  useEffect(() => {
    const flooringFiles = import.meta.glob('../assets/flooring/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });
    const kitchenFiles  = import.meta.glob('../assets/kitchen/*.{jpg,jpeg,png,webp}',  { eager: true, import: 'default' });
    const bathroomFiles = import.meta.glob('../assets/bathroom/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });

    const toImages = (files, cat) =>
      Object.entries(files).map(([path, src]) => ({ id: path, src, cat, alt: `${cat} project` }));

    setAllImages([
      ...toImages(flooringFiles, 'flooring'),
      ...toImages(kitchenFiles,  'kitchen'),
      ...toImages(bathroomFiles, 'bathroom'),
    ]);
  }, []);

  const filtered = activeTab === 'all'
    ? allImages
    : allImages.filter(item => item.cat === activeTab);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleTabChange = (key) => {
    setActiveTab(key);
    setVisibleCount(PAGE_SIZE);
  };

  const openLightbox = (item, event) => {
    if (event?.currentTarget) {
      triggerRef.current = event.currentTarget;
    }
    const index = filtered.findIndex(f => f.id === item.id);
    setLightbox({ images: filtered, index });
  };

  const closeLightbox = useCallback(() => {
    setLightbox(null);
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 50);
  }, []);

  const prevImage     = useCallback(() => setLightbox(lb => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length })), []);
  const nextImage     = useCallback(() => setLightbox(lb => ({ ...lb, index: (lb.index + 1) % lb.images.length })), []);

  const handleKey = useCallback((e) => {
    if (!lightbox) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  prevImage();
    if (e.key === 'ArrowRight') nextImage();
  }, [lightbox, closeLightbox, prevImage, nextImage]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightbox]);

  return (
    <section id="portfolio" className="portfolio-section">
      <div className="section-label">Our Work</div>
      <h2 className="section-title">Recent <em>Projects</em></h2>

      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Masonry
        breakpointCols={breakpointCols}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {visible.map((item) => (
          <div
            key={item.id}
            className="masonry-item"
            role="button"
            tabIndex={0}
            onClick={(e) => openLightbox(item, e)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(item, e);
              }
            }}
            aria-label={`View ${item.alt} in lightbox`}
          >
            <img src={item.src} alt={item.alt} loading="lazy" />
            <div className="masonry-overlay">
              <span className="masonry-zoom">+</span>
            </div>
          </div>
        ))}
      </Masonry>

      {hasMore && (
        <div className="gallery-load-more">
          <button className="btn-load-more" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
            Load More
            <span className="load-more-count">{filtered.length - visibleCount} remaining</span>
          </button>
        </div>
      )}

      {lightbox && createPortal(
        <div className="lb-backdrop" onClick={closeLightbox}>
          <FocusTrap active={!!lightbox}>
            <div 
              className="lb-dialog-container" 
              role="dialog" 
              aria-modal="true" 
              aria-label="Image Lightbox"
              onClick={e => e.stopPropagation()}
            >
              <button 
                className="lb-close" 
                onClick={closeLightbox}
                aria-label="Close lightbox"
              >
                ✕
              </button>

              <button 
                className="lb-prev" 
                onClick={e => { e.stopPropagation(); prevImage(); }}
                aria-label="Previous image"
              >
                &#8249;
              </button>

              <div className="lb-content">
                <img
                  key={lightbox.index}
                  src={lightbox.images[lightbox.index].src}
                  alt={lightbox.images[lightbox.index].alt}
                  className="lb-img"
                />
                <div className="lb-caption">
                  <span>{lightbox.images[lightbox.index].alt}</span>
                  <span className="lb-counter">
                    {lightbox.index + 1} / {lightbox.images.length}
                  </span>
                </div>
              </div>

              <button 
                className="lb-next" 
                onClick={e => { e.stopPropagation(); nextImage(); }}
                aria-label="Next image"
              >
                &#8250;
              </button>
            </div>
          </FocusTrap>
        </div>,
        document.body
      )}
    </section>
  );
}