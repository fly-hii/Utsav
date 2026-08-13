import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import Support from './pages/Support';
import ChildSafetyStandards from './pages/ChildSafetyStandards';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/support" element={<Support />} />
            <Route path="/child-safety-standards" element={<ChildSafetyStandards />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
