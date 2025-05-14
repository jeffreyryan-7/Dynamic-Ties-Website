import { Routes, Route } from 'react-router-dom';

import LandingPage from './pages/LandingPage.jsx';
import ExplorePage from './pages/ExplorePage.jsx';
import DatabasePage from './pages/DatabasePage.jsx';
import AnalysisPage from './pages/AnalysisPage.jsx';
import AboutPage from './pages/AboutPage.jsx';

export default function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/database" element={<DatabasePage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </main>
  );
}
