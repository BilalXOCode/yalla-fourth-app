// App shell: persistent Navbar + Footer wrap the routed pages. The six routes
// map to the six pages of Yalla Fourth. In Stage 1 every page renders a styled
// placeholder; real pages are filled in stage by stage.
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import FindMatches from './pages/FindMatches.jsx';
import AccountAccess from './pages/AccountAccess.jsx';
import CreateMatch from './pages/CreateMatch.jsx';
import Support from './pages/Support.jsx';
import About from './pages/About.jsx';
import Placeholder from './pages/Placeholder.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/account" element={<AccountAccess />} />
        <Route path="/find" element={<FindMatches />} />
        <Route path="/create" element={<CreateMatch />} />
        <Route path="/support" element={<Support />} />
        <Route path="/about" element={<About />} />
        {/* Unknown routes fall back to Home */}
        <Route path="*" element={<Placeholder titleKey="home" />} />
      </Routes>
      <Footer />
    </div>
  );
}
