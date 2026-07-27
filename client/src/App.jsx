// App shell: persistent Navbar + Footer wrap the routed pages. The six routes
// map to the six pages of Yalla Fourth. In Stage 1 every page renders a styled
// placeholder; real pages are filled in stage by stage.
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Placeholder from './pages/Placeholder.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/account" element={<Placeholder titleKey="account" />} />
        <Route path="/find" element={<Placeholder titleKey="find" />} />
        <Route path="/create" element={<Placeholder titleKey="create" />} />
        <Route path="/support" element={<Placeholder titleKey="support" />} />
        <Route path="/about" element={<Placeholder titleKey="about" />} />
        {/* Unknown routes fall back to Home */}
        <Route path="*" element={<Placeholder titleKey="home" />} />
      </Routes>
      <Footer />
    </div>
  );
}
