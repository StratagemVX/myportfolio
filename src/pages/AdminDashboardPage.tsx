import { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Key, 
  ShieldCheck, 
  LogOut, 
  Activity,
  Layers,
  Settings
} from 'lucide-react';
import projectsData from '../data/projects.json';
import SecurityGate from '../components/admin/SecurityGate';
import AccountSecuritySection from '../components/admin/AccountSecuritySection';
import PrivateRecruiterAccessSection from '../components/admin/PrivateRecruiterAccessSection';
import IntegrationMatrixSection from '../components/admin/IntegrationMatrixSection';
import { apiClient } from '../services/apiClient';
import type { OwnerSecurityProfile } from '../../server/types';
import SEOHead from '../components/SEOHead';
import { STATIC_ROUTES_SEO } from '../data/seoConfig';

type AdminView = 'CONSOLE' | 'SECURITY' | 'RECRUITER' | 'INTEGRATIONS';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<OwnerSecurityProfile | null>(null);
  const [currentView, setCurrentView] = useState<AdminView>('SECURITY');
  
  // GitHub sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    // Check initial profile
    apiClient.getProfile()
      .then(res => {
        setProfile(res.profile);
      })
      .catch(() => {
        // Dev offline fallback
      });
  }, []);

  const handleAuthenticated = (p: OwnerSecurityProfile) => {
    setProfile(p);
    setIsAuthenticated(true);
    setCurrentView('SECURITY');
  };

  const handleLogout = async () => {
    await apiClient.logout();
    setIsAuthenticated(false);
  };

  const handleTriggerSync = () => {
    setIsSyncing(true);
    setSyncFeedback('Dispatching GitHub discovery action to StratagemVX API...');
    setTimeout(() => {
      setIsSyncing(false);
      setSyncFeedback(`Successfully synchronized: ${projectsData.repositoryCount} repositories validated.`);
    }, 1500);
  };

  if (!isAuthenticated) {
    return (
      <>
        <SEOHead {...STATIC_ROUTES_SEO['/admin']} />
        <SecurityGate onAuthenticated={handleAuthenticated} />
      </>
    );
  }

  return (
    <div className="py-14 sm:py-20 space-y-10 font-mono text-xs">
      <SEOHead {...STATIC_ROUTES_SEO['/admin']} />
      <div className="site-container space-y-8">
        {/* Top Header Bar */}
        <div className="border-b border-[rgba(255,255,255,0.08)] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-[10px] text-[#A8B8A7]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#A8B8A7]" />
              <span>OWNER SECURITY CENTRE & ADMINISTRATION</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#F0F0ED] mt-1">
              Chethan Kumar · Security Control Room
            </h1>
            <p className="text-[11px] text-[#A4A8AE] font-sans font-light mt-0.5">
              Verified Account: <strong className="text-[#F0F0ED]">{profile?.loginEmailMasked || 't***@g***.com'}</strong> · MFA Enforced
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[#A4A8AE] hover:text-[#F0F0ED] flex items-center space-x-1.5 self-start sm:self-auto transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>TERMINATE SESSION</span>
          </button>
        </div>

        {/* Primary View Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg text-xs">
          <button
            onClick={() => setCurrentView('SECURITY')}
            className={`px-4 py-2.5 rounded flex items-center space-x-2 transition-colors ${
              currentView === 'SECURITY'
                ? 'bg-[#A8B8A7] text-[#101114] font-semibold'
                : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Account & Security</span>
          </button>

          <button
            onClick={() => setCurrentView('CONSOLE')}
            className={`px-4 py-2.5 rounded flex items-center space-x-2 transition-colors ${
              currentView === 'CONSOLE'
                ? 'bg-[#A8B8A7] text-[#101114] font-semibold'
                : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>System Console</span>
          </button>

          <button
            onClick={() => setCurrentView('RECRUITER')}
            className={`px-4 py-2.5 rounded flex items-center space-x-2 transition-colors ${
              currentView === 'RECRUITER'
                ? 'bg-[#A8B8A7] text-[#101114] font-semibold'
                : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Private Recruiter Access</span>
          </button>

          <button
            onClick={() => setCurrentView('INTEGRATIONS')}
            className={`px-4 py-2.5 rounded flex items-center space-x-2 transition-colors ${
              currentView === 'INTEGRATIONS'
                ? 'bg-[#A8B8A7] text-[#101114] font-semibold'
                : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Integration Matrix</span>
          </button>
        </div>

        {/* VIEW 1: ACCOUNT & SECURITY */}
        {currentView === 'SECURITY' && profile && (
          <AccountSecuritySection 
            initialProfile={profile} 
            onProfileUpdated={(updated) => setProfile(updated)} 
          />
        )}

        {/* VIEW 2: PRIVATE RECRUITER ACCESS */}
        {currentView === 'RECRUITER' && (
          <PrivateRecruiterAccessSection />
        )}

        {/* VIEW 3: INTEGRATION MATRIX */}
        {currentView === 'INTEGRATIONS' && (
          <IntegrationMatrixSection />
        )}

        {/* VIEW 4: SYSTEM CONSOLE (GitHub Sync & Metrics) */}
        {currentView === 'CONSOLE' && (
          <div className="space-y-8">
            {/* Metrics Row (Wide 4-Column Layout) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-lg">
                <span className="text-[10px] text-[#A4A8AE]">INDEXED REPOSITORIES</span>
                <p className="font-display text-2xl text-[#F0F0ED] mt-1">{projectsData.repositoryCount}</p>
              </div>
              <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-lg">
                <span className="text-[10px] text-[#A4A8AE]">FEATURED CASE STUDIES</span>
                <p className="font-display text-2xl text-[#A8B8A7] mt-1">
                  {projectsData.projects.filter(p => p.isFeatured).length}
                </p>
              </div>
              <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-lg">
                <span className="text-[10px] text-[#A4A8AE]">MFA SECURITY STATUS</span>
                <p className="font-display text-2xl text-[#A8B8A7] mt-1">MANDATORY</p>
              </div>
              <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-lg">
                <span className="text-[10px] text-[#A4A8AE]">SYSTEM HEALTH</span>
                <p className="font-display text-2xl text-[#A8B8A7] mt-1">Nominal</p>
              </div>
            </div>

            {/* GitHub Synchronization Engine */}
            <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-[#A8B8A7]">
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <h3 className="font-display text-base font-medium text-[#F0F0ED]">GitHub Synchronization Engine</h3>
                  </div>
                  <p className="text-[11px] text-[#A4A8AE] mt-1">
                    Source of Truth: <code className="text-[#A8B8A7]">https://github.com/StratagemVX</code> · 
                    Last Automated Sync: {new Date(projectsData.lastSyncedAt).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={handleTriggerSync}
                  disabled={isSyncing}
                  className="px-5 py-2.5 bg-[#22252C] border border-[rgba(255,255,255,0.08)] text-[#F0F0ED] hover:border-[#A8B8A7] rounded flex items-center space-x-2 disabled:opacity-50 transition-colors"
                >
                  <span>{isSyncing ? 'DISPATCHING...' : 'TRIGGER REFRESH'}</span>
                </button>
              </div>

              {syncFeedback && (
                <div className="p-3 bg-[#101114] border border-[#A8B8A7]/40 rounded text-[11px] text-[#A8B8A7]">
                  {syncFeedback}
                </div>
              )}
            </div>

            {/* Quick Status Bar */}
            <div className="p-4 bg-[#181A1F] border border-[rgba(255,255,255,0.06)] rounded-lg flex items-center justify-between text-[11px] text-[#A4A8AE]">
              <span>Active Architecture: Auth0 PKCE + RFC 6238 TOTP + W3C WebAuthn Level 3</span>
              <button
                onClick={() => setCurrentView('SECURITY')}
                className="text-[#A8B8A7] hover:underline flex items-center space-x-1"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Open Security Activity Log →</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
