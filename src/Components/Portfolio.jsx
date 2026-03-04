import { useState, useEffect, useCallback } from 'react';
import Masonry from 'react-masonry-css';
import '../styles/Portfolio.css';

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

export default function Portfolio() {
  const [allImages, setAllImages]       = useState([]);
  const [activeTab, setActiveTab]       = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lightbox, setLightbox]         = useState(null);

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

  const openLightbox  = (index) => setLightbox({ images: filtered, index });
  const closeLightbox = () => setLightbox(null);
  const prevImage = () => setLightbox(lb => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length }));
  const nextImage = () => setLightbox(lb => ({ ...lb, index: (lb.index + 1) % lb.images.length }));

  const handleKey = useCallback((e) => {
    if (!lightbox) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  prevImage();
    if (e.key === 'ArrowRight') nextImage();
  }, [lightbox]);

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
        {visible.map((item, i) => (
          <div key={item.id} className="masonry-item" onClick={() => openLightbox(i)}>
            <img src={item.src} alt={item.alt} />
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

      {lightbox && (
        <div className="lightbox-backdrop" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>&#x2715;</button>
          <button className="lightbox-nav lightbox-prev" onClick={e => { e.stopPropagation(); prevImage(); }}>&#8249;</button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img
              key={lightbox.index}
              src={lightbox.images[lightbox.index].src}
              alt={lightbox.images[lightbox.index].alt}
              className="lightbox-img"
            />
            <div className="lightbox-caption">
              <span>{lightbox.images[lightbox.index].alt}</span>
              <span className="lightbox-counter">{lightbox.index + 1} / {lightbox.images.length}</span>
            </div>
          </div>
          <button className="lightbox-nav lightbox-next" onClick={e => { e.stopPropagation(); nextImage(); }}>&#8250;</button>
        </div>
      )}
    </section>
  );
}