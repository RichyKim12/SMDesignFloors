import './styles/global.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import Portfolio from './components/Portfolio';
import Professionals from './components/Professionals';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Gallery from './components/Frontend/Gallery';
export default function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      <Portfolio />
      <Professionals />
      <Contact />
      <Gallery />
      <Footer />
    </>
  );
}
