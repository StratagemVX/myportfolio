import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Menu, X, ArrowUpRight } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { displayName } = useProfile();

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Work', href: '/work' },
    { label: 'Evidence', href: '/evidence' },
    { label: 'Archive', href: '/archive' },
    { label: 'Recruiter Brief', href: '/recruiter-brief' },
    { label: 'Academics', href: '/academics' },
    { label: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/work') {
      return location.pathname === '/work' || location.pathname.startsWith('/project/');
    }
    if (path === '/recruiter-brief') {
      return (
        location.pathname === '/recruiter-brief' ||
        location.pathname === '/executive-brief' ||
        location.pathname === '/recruiter' ||
        location.pathname === '/dossier'
      );
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#101114]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)]">
      <div className="site-container h-16 flex items-center justify-between">
        {/* Brand Mark */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 rounded-md bg-[#181A1F] border border-[rgba(255,255,255,0.08)] flex items-center justify-center font-mono text-xs font-medium text-[#A8B8A7] group-hover:border-[#A8B8A7] transition-colors btn-highlight">
            CK
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-medium tracking-tight text-sm text-[#F0F0ED]">
              {displayName}
            </span>
            <span className="text-[11px] font-mono text-[#A4A8AE]">
              CS Engineer
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden lg:flex items-center space-x-6 text-[13px] font-sans">
          {navLinks.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`relative py-1 transition-colors ${
                  active ? 'text-[#F0F0ED] font-medium' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
                }`}
              >
                <span>{item.label}</span>
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A8B8A7] rounded-full" />
                )}
              </Link>
            );
          })}
          
          <Link
            to="/resume"
            className={`px-3.5 py-1.5 rounded-md text-xs font-sans font-medium transition-colors flex items-center space-x-1.5 btn-highlight ${
              location.pathname === '/resume'
                ? 'bg-[#A8B8A7] text-[#101114] border border-[#A8B8A7]'
                : 'border border-[#A8B8A7]/40 text-[#A8B8A7] hover:bg-[#A8B8A7] hover:text-[#101114]'
            }`}
          >
            <span>Résumé</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/admin"
            title="Owner Security Console"
            className={`p-1.5 transition-colors ${
              location.pathname === '/admin' ? 'text-[#A8B8A7]' : 'text-[#484D58] hover:text-[#A4A8AE]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-[#A4A8AE] hover:text-[#F0F0ED] focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#181A1F] border-b border-[rgba(255,255,255,0.08)] px-6 py-6 space-y-3 text-sm font-sans">
          {navLinks.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-1.5 transition-colors ${
                  active ? 'text-[#F0F0ED] font-medium' : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex justify-between items-center text-xs">
            <Link
              to="/resume"
              onClick={() => setMobileOpen(false)}
              className="text-[#A8B8A7] hover:underline font-medium"
            >
              View official résumé →
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="text-[#6E727A] hover:text-[#A4A8AE]"
            >
              Owner Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
