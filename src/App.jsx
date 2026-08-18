import './styles/global.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

// Existing components
import Services from './Components/Services';
import Professionals from './Components/Professionals';
import Hero from './Components/Hero';
import Portfolio from './Components/Portfolio';
import Contact from './Components/Contact';
import Footer from './Components/Footer';
import Navbar from './Components/Navbar';
import FlooringVisualizer from './Components/FlooringVisualizer';

// Modals
import AuthModal from './Components/AuthModal';
import PrivacyModal from './Components/PrivacyModal';

// Auth
import ProtectedRoute from './Components/ProtectedRoute';
import RoleRoute from './Components/RoleRoute';

// Dashboards
import ContractorDashboard from './pages/ContractorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// Moves keyboard/screen-reader focus to main content on route change,
// since SPAs don't trigger a native "page load" announcement.
function FocusMainOnRouteChange({ mainRef }) {
  const { pathname } = useLocation();
  useEffect(() => {
    mainRef.current?.focus();
  }, [pathname, mainRef]);
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

const DASHBOARD_ROUTES = ['/contractor', '/admin'];

function Layout() {
  const [modalOpen, setModalOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const location = useLocation();
  const isDashboard = DASHBOARD_ROUTES.includes(location.pathname);

  const mainRef = useRef(null);
  const loginTriggerRef = useRef(null); // the "Contractor Login" button in Navbar

  const closeModal = () => {
    setModalOpen(false);
    // Return focus to whatever opened the modal once it closes
    loginTriggerRef.current?.focus();
  };

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <ScrollToTop />
      <FocusMainOnRouteChange mainRef={mainRef} />

      <Navbar
        onLoginClick={() => setModalOpen(true)}
        loginTriggerRef={loginTriggerRef}
      />

      <AuthModal
        isOpen={modalOpen}
        onClose={closeModal}
      />

      <PrivacyModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />

      <main id="main-content" ref={mainRef} tabIndex={-1}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/proservices" element={<Professionals onOpenPrivacy={() => setPrivacyOpen(true)} />} />
          {/* <Route path="/visualizer" element={<FlooringVisualizer />} /> */}

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={['contractor']} />}>
              <Route path="/contractor" element={<ContractorDashboard />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* Nonexistent pages */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Hide footer on dashboard pages */}
      {!isDashboard && <Footer onOpenPrivacy={() => setPrivacyOpen(true)} />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}    