import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, ArrowUp } from 'lucide-react';
import projectsData from '../data/projects.json';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const syncDate = new Date(projectsData.lastSyncedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const footerNav = [
    { label: 'Home', href: '/' },
    { label: 'Work', href: '/work' },
    { label: 'Evidence', href: '/evidence' },
    { label: 'Archive', href: '/archive' },
    { label: 'Recruiter Brief', href: '/recruiter-brief' },
    { label: 'Academics', href: '/academics' },
    { label: 'Contact', href: '/contact' },
    { label: 'Résumé', href: '/resume' },
  ];

  return (
    <footer className="border-t border-[rgba(255,255,255,0.08)] bg-[#101114] py-12 text-xs font-mono text-[#A4A8AE]">
      <div className="site-container">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[rgba(255,255,255,0.06)]">
          <div className="md:col-span-5 space-y-2">
            <p className="text-[#F0F0ED] font-sans font-medium text-sm">
              Chethan Kumar B S
            </p>
            <p className="text-[11px] text-[#A4A8AE] leading-relaxed font-light">
              Computer Science Engineer · AI & Intelligent Systems · Cybersecurity · Systems Engineering
            </p>
            <p className="text-[10px] text-[#A8B8A7]/80">
              Philosophy: "Security First. Intelligence Always."
            </p>
          </div>

          <div className="md:col-span-4 space-y-2">
            <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase block font-medium">
              Page directory
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
              {footerNav.map((item) => (
                <Link key={item.label} to={item.href} className="hover:text-[#F0F0ED] transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col justify-between items-start md:items-end space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/StratagemVX"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[#A4A8AE] hover:text-[#F0F0ED] hover:border-[#A8B8A7]/40 transition-colors"
                title="GitHub"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/in/chethan-kumar-bs"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[#A4A8AE] hover:text-[#F0F0ED] hover:border-[#A8B8A7]/40 transition-colors"
                title="LinkedIn"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="mailto:chethan.athulith@outlook.com"
                className="p-2 rounded-lg bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[#A4A8AE] hover:text-[#F0F0ED] hover:border-[#A8B8A7]/40 transition-colors"
                title="Email"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
              <button
                onClick={scrollToTop}
                className="p-2 rounded-lg bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[#A4A8AE] hover:text-[#F0F0ED] hover:border-[#A8B8A7]/40 transition-colors btn-highlight"
                title="Return to top"
                aria-label="Back to top"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
            <Link to="/admin" className="text-[10px] text-[#4A4E58] hover:text-[#A4A8AE] transition-colors">
              Owner portal
            </Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-[#6E727A]">
          <p>© {new Date().getFullYear()} Chethan Kumar B S. Built with authentic web standards.</p>
          <div className="flex items-center space-x-2 text-[#A4A8AE]/70 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A8B8A7]" />
            <span className="tabular-nums">GitHub index snapshot: {syncDate} ({projectsData.repositoryCount} repositories discovered)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
