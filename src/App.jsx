import './styles/global.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
// Existing components
import Services from './Components/Services';
import Professionals from './Components/Professionals';
import Hero from './Components/Hero';
import Portfolio from './Components/Portfolio';
import Contact from './Components/Contact';
import Footer from './Components/Footer';
import Navbar from './Components/Navbar';
import FlooringVisualizer from './Components/FlooringVisualizer';
// Auth
import AuthModal from './Components/AuthModal';
import ProtectedRoute from './Components/ProtectedRoute';
import RoleRoute from './Components/RoleRoute';
// Dashboards
import ContractorDashboard from './pages/ContractorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound'

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

const DASHBOARD_ROUTES = ['/contractor', '/admin'];

function Layout() {
  const [modalOpen, setModalOpen] = useState(false);
  const location                  = useLocation();
  const isDashboard               = DASHBOARD_ROUTES.includes(location.pathname);

  return (
    <>
      <ScrollToTop />
      <Navbar onLoginClick={() => setModalOpen(true)} />
      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <Routes>
        {/* Public routes */}
        <Route path="/"            element={<HomePage />} />
        <Route path="/proservices" element={<Professionals />} />
        <Route path="/visualizer"  element={<FlooringVisualizer />} />

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

      {/* Hide footer on dashboard pages */}
      {!isDashboard && <Footer />}
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