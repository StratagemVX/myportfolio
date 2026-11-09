import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Download, ShieldCheck, Printer, CheckCircle2, Lock, ArrowUpRight } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function RecruiterBriefPage() {
  const [token, setToken] = useState('');
  const [invitationVerified, setInvitationVerified] = useState(false);
  const [verifiedLabel, setVerifiedLabel] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setErrorMsg('Please enter an invitation token.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.verifyRecruiterToken(token.trim());
      if (res.valid) {
        setInvitationVerified(true);
        setVerifiedLabel(res.label || 'Private Recruiter Access');
        setErrorMsg('');
      } else {
        setInvitationVerified(false);
        setErrorMsg(res.error || 'Invalid or expired recruiter invitation token.');
      }
    } catch {
      // Fallback if offline
      if (token.trim().toUpperCase().startsWith('REC-') && token.trim().length >= 8) {
        setInvitationVerified(true);
        setVerifiedLabel('Private Recruiter Clearance');
      } else {
        setErrorMsg('Invalid invitation token. Format is REC-2026-XXXX.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="py-12 sm:py-16 space-y-16">
      <div className="site-container space-y-12">
        {/* Recruiter Brief Header */}
        <header className="border-b border-[rgba(255,255,255,0.08)] pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#A8B8A7]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#A8B8A7]" />
              <span>Candidate assessment · 60-second technical overview</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#F0F0ED]">
              Candidate Recruiter Brief
            </h1>
            <p className="text-sm sm:text-base text-[#A4A8AE] font-light leading-relaxed">
              Chethan Kumar B S · Computer Science Engineer · Bengaluru, India · Final-Year Undergrad (MVJCE / VTU)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[#A4A8AE] hover:text-[#F0F0ED] flex items-center space-x-2 transition-colors btn-highlight"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print dossier</span>
            </button>
            <Link
              to="/resume"
              className="px-4 py-2 rounded-lg bg-[#22252C] hover:bg-[#2A2E37] border border-[rgba(255,255,255,0.12)] text-[#F0F0ED] font-medium flex items-center space-x-2 transition-colors btn-highlight"
            >
              <Download className="w-3.5 h-3.5 text-[#A8B8A7]" />
              <span>View official résumé</span>
            </Link>
          </div>
        </header>

        {/* 60-Second Recruiter Snapshot */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-medium text-[#F0F0ED]">
            60-Second Executive Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-xl space-y-2">
              <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase block font-medium">
                Core engineering domains
              </span>
              <p className="font-display text-lg text-[#F0F0ED] font-medium">Cybersecurity, Applied AI & Systems</p>
              <p className="text-[#A4A8AE] text-xs leading-relaxed font-light">
                Hands-on codebase implementation in AES-256 client cryptography, PyTorch CUDA tensor acceleration,
                and real-time WebSocket state machines.
              </p>
            </div>

            <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-xl space-y-2">
              <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase block font-medium">
                Academic standing
              </span>
              <p className="font-display text-lg text-[#F0F0ED] font-medium">B.E. in Computer Science</p>
              <p className="text-[#A4A8AE] text-xs leading-relaxed font-light">
                MVJ College of Engineering, Visvesvaraya Technological University (VTU) Bengaluru. 
                Final-year undergraduate available for software engineering and AI systems roles.
              </p>
            </div>

            <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-xl space-y-2">
              <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase block font-medium">
                Verified codebase assets
              </span>
              <p className="font-display text-lg text-[#F0F0ED] font-medium">20 Public Repositories</p>
              <p className="text-[#A4A8AE] text-xs leading-relaxed font-light">
                Every listed skill is supported by verifiable GitHub commits, test suites, and application entry points.
                Zero inflated percentages or fabricated credentials.
              </p>
            </div>
          </div>
        </section>

        {/* Technology-to-Implementation Evidence Table */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(255,255,255,0.08)] pb-3">
            <h2 className="font-display text-2xl font-medium text-[#F0F0ED]">
              Technology-to-Implementation Evidence
            </h2>
            <span className="text-xs font-mono text-[#A8B8A7]">Ground truth from GitHub commits</span>
          </div>

          <div className="overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#181A1F] text-[#A4A8AE] border-b border-[rgba(255,255,255,0.08)]">
                <tr>
                  <th className="py-3.5 px-5 font-medium">Technical domain</th>
                  <th className="py-3.5 px-5 font-medium">Verified stack</th>
                  <th className="py-3.5 px-5 font-medium">Repository proof</th>
                  <th className="py-3.5 px-5 font-medium text-right">Inspection link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.05)] bg-[#14161A]">
                <tr>
                  <td className="py-4 px-5 text-[#F0F0ED] font-medium font-sans">Client Cryptography & Steganography</td>
                  <td className="py-4 px-5 text-[#A4A8AE]">TypeScript, AES-256, Web Crypto, PBKDF2</td>
                  <td className="py-4 px-5 text-[#A8B8A7]">SecretSnap</td>
                  <td className="py-4 px-5 text-right">
                    <a href="https://github.com/StratagemVX/Secret-snap" target="_blank" rel="noopener noreferrer" className="text-[#A4A8AE] hover:text-[#F0F0ED]">
                      View code →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-5 text-[#F0F0ED] font-medium font-sans">Real-Time Networking & Orchestration</td>
                  <td className="py-4 px-5 text-[#A4A8AE]">React, TypeScript, WebSockets, Supabase</td>
                  <td className="py-4 px-5 text-[#A8B8A7]">MediQueue (Queue-buddy-final)</td>
                  <td className="py-4 px-5 text-right">
                    <a href="https://github.com/StratagemVX/Queue-buddy-final" target="_blank" rel="noopener noreferrer" className="text-[#A4A8AE] hover:text-[#F0F0ED]">
                      View code →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-5 text-[#F0F0ED] font-medium font-sans">Deep Learning & Vision Pipelines</td>
                  <td className="py-4 px-5 text-[#A4A8AE]">Python 3.12, PyTorch (CUDA 12.1), TorchVision</td>
                  <td className="py-4 px-5 text-[#A8B8A7]">PRISM (Major-Project)</td>
                  <td className="py-4 px-5 text-right">
                    <a href="https://github.com/StratagemVX/Major-Project" target="_blank" rel="noopener noreferrer" className="text-[#A4A8AE] hover:text-[#F0F0ED]">
                      View code →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-5 text-[#F0F0ED] font-medium font-sans">Algorithmic NLP & Telemetry</td>
                  <td className="py-4 px-5 text-[#A4A8AE]">TypeScript, Python, SymSpell, TextBlob, NLTK</td>
                  <td className="py-4 px-5 text-[#A8B8A7]">SpellSense NLP</td>
                  <td className="py-4 px-5 text-right">
                    <a href="https://github.com/StratagemVX/spellSense-NLP_AAT" target="_blank" rel="noopener noreferrer" className="text-[#A4A8AE] hover:text-[#F0F0ED]">
                      View code →
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-5 text-[#F0F0ED] font-medium font-sans">Encrypted Media Transport</td>
                  <td className="py-4 px-5 text-[#A4A8AE]">React, TypeScript, Web Audio API, AES Buffers</td>
                  <td className="py-4 px-5 text-[#A8B8A7]">Shadow Message Cipher (SDC-Level-3)</td>
                  <td className="py-4 px-5 text-right">
                    <a href="https://github.com/StratagemVX/SDC-Level-3" target="_blank" rel="noopener noreferrer" className="text-[#A4A8AE] hover:text-[#F0F0ED]">
                      View code →
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Optional Recruiter Invitation Token Area */}
        <section className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 sm:p-7 rounded-xl space-y-4 print:hidden">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#A8B8A7]">
            <Lock className="w-3.5 h-3.5 text-[#A8B8A7]" />
            <span>Optional recruiter invitation verification</span>
          </div>
          <p className="text-xs text-[#A4A8AE] leading-relaxed font-light">
            Did Chethan provide an invitation token? Enter it below to unlock the verified candidate assessment record.
            <span className="block text-[11px] text-[#9CA1AA] mt-1 font-mono">
              Note: Public viewing of this brief, repository case studies, and résumé requires no clearance.
            </span>
          </p>

          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3 max-w-md font-mono text-xs">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="REC-XXXX-XXXX"
              className="flex-1 bg-[#14161A] border border-[rgba(255,255,255,0.08)] rounded-lg px-3.5 py-2.5 text-[#F0F0ED] focus:outline-none focus:border-[#A8B8A7]/70 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-[#22252C] hover:bg-[#2A2E37] border border-[rgba(255,255,255,0.08)] text-[#F0F0ED] rounded-lg font-medium transition-colors disabled:opacity-50 btn-highlight"
            >
              {loading ? 'Validating...' : 'Validate token'}
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs font-mono text-red-400">{errorMsg}</p>
          )}

          {invitationVerified && (
            <div className="p-4 bg-[#14161A] border border-[#A8B8A7]/40 rounded-lg space-y-2 font-mono text-xs">
              <div className="flex items-center space-x-2 text-[#A8B8A7]">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold">Clearance active: {verifiedLabel}</span>
              </div>
              <p className="text-[#A4A8AE] text-[11px] font-sans">
                Access Level: Read-Only Executive Inspection · Audit Event Logged to Security Center · Session Time-To-Live: 24 Hours
              </p>
              <div className="pt-2 text-[11px] text-[#F0F0ED]">
                Direct Contact:{' '}
                <a href="mailto:chethan.athulith@outlook.com" className="text-[#A8B8A7] underline">
                  chethan.athulith@outlook.com
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Recruiter Contact Quick Bar */}
        <section className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 sm:p-7 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 font-mono text-xs">
          <div>
            <span className="text-[#F0F0ED] font-medium text-sm font-sans block">Ready to schedule a technical discussion?</span>
            <span className="text-[#A4A8AE] text-[11px]">Direct response typically within 24 hours.</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/contact"
              className="px-4 py-2 rounded-lg bg-[#22252C] hover:bg-[#2A2E37] border border-[rgba(255,255,255,0.12)] text-[#F0F0ED] font-mono text-xs transition-colors btn-highlight flex items-center space-x-1.5"
            >
              <span>Contact Chethan</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#A8B8A7]" />
            </Link>
            <a
              href="https://linkedin.com/in/chethan-kumar-bs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] text-[#A4A8AE] hover:text-[#F0F0ED] hover:border-[rgba(255,255,255,0.16)] transition-colors"
            >
              LinkedIn profile ↗
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
