import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ProfileProvider } from './context/ProfileContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import WorkPage from './pages/WorkPage';
import EvidencePage from './pages/EvidencePage';
import ArchivePage from './pages/ArchivePage';
import RecruiterBriefPage from './pages/RecruiterBriefPage';
import AcademicsPage from './pages/AcademicsPage';
import ContactPage from './pages/ContactPage';
import ResumePage from './pages/ResumePage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <ProfileProvider>
        <div className="min-h-screen bg-[#101114] text-[#F0F0ED] selection:bg-[#A8B8A7] selection:text-[#101114] font-sans antialiased flex flex-col">
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/work" element={<WorkPage />} />
              <Route path="/evidence" element={<EvidencePage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/recruiter-brief" element={<RecruiterBriefPage />} />
              <Route path="/recruiter" element={<Navigate to="/recruiter-brief" replace />} />
              <Route path="/dossier" element={<Navigate to="/recruiter-brief" replace />} />
              <Route path="/executive-brief" element={<Navigate to="/recruiter-brief" replace />} />
              <Route path="/academics" element={<AcademicsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/resume" element={<ResumePage />} />
              <Route path="/project/:slug" element={<ProjectDetailPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ProfileProvider>
    </BrowserRouter>
  );
}

function NotFoundPage() {
  return (
    <div className="site-container py-32 text-center font-mono">
      <h1 className="text-4xl text-[#A8B8A7] font-display font-medium">404</h1>
      <p className="mt-3 text-[#A4A8AE] text-xs">The requested page or route does not exist.</p>
      <div className="mt-6 flex justify-center space-x-4">
        <Link
          to="/"
          className="px-4 py-2 border border-[rgba(255,255,255,0.08)] text-xs text-[#F0F0ED] hover:border-[#A8B8A7] transition-colors"
        >
          ← Return to Overview
        </Link>
        <Link
          to="/work"
          className="px-4 py-2 bg-[#A8B8A7] text-[#101114] text-xs font-medium hover:bg-[#BDCCBA] transition-colors"
        >
          Explore Work →
        </Link>
      </div>
    </div>
  );
}
