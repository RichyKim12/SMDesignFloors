import './styles/global.css';
import Services from './components/Services';
import Professionals from './components/Professionals';
import Hero from './components/Hero';
import Portfolio from './components/Portfolio';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Gallery from './components/Frontend/Gallery';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';


// Standalone pages
import FlooringVisualizer from './components/FlooringVisualizer'; // your existing file

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <Portfolio />
      <Contact />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Navbar and Footer render on every route */}
      {/* <ScrollToTop /> */}
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/proservices" element={<Professionals />} />
        <Route path="/visualizer" element={<FlooringVisualizer />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
