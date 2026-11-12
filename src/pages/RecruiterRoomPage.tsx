import { useState, FormEvent } from 'react';
import { Download, ShieldCheck, Printer, CheckCircle2 } from 'lucide-react';

export default function RecruiterRoomPage() {
  const [token, setToken] = useState('');
  const [invitationVerified, setInvitationVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = (e: FormEvent) => {
    e.preventDefault();
    if (token.trim().toUpperCase().startsWith('REC-') && token.trim().length >= 8) {
      setInvitationVerified(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Invalid invitation token. Format is REC-XXXX-XXXX.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-14 space-y-12">
      {/* Recruiter Brief Header */}
      <div className="border-b border-[rgba(255,255,255,0.08)] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-[11px] font-mono text-[#A8B8A7]">
            <ShieldCheck className="w-4 h-4 text-[#A8B8A7]" />
            <span>TECHNICAL RECRUITER & HIRING MANAGER BRIEF</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-[#F0F0ED]">
            Candidate Recruiter Brief: Chethan Kumar
          </h1>
          <p className="text-[#A4A8AE] text-sm font-light">
            Computer Science Engineer · Bengaluru, India · Final-Year Undergrad (MVJCE / VTU)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[#A4A8AE] hover:text-[#F0F0ED] flex items-center space-x-1.5 transition-colors print:hidden"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT BRIEF</span>
          </button>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded bg-[#A8B8A7] text-[#101114] font-medium hover:bg-[#BDCCBA] flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD OFFICIAL RÉSUMÉ</span>
          </a>
        </div>
      </div>

      {/* 60-Second Recruiter Snapshot */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-medium text-[#F0F0ED]">
          Executive Candidate Snapshot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-lg space-y-3">
            <span className="text-[10px] text-[#A8B8A7] tracking-wider block">CORE ENGINEERING FOCUS</span>
            <p className="font-display text-base text-[#F0F0ED] font-medium">Cybersecurity & Applied AI</p>
            <p className="text-[#A4A8AE] text-xs leading-relaxed font-sans font-light">
              Demonstrated codebase implementation in AES-256 client cryptography, WebSockets orchestration, and PyTorch deep neural networks.
            </p>
          </div>

          <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-lg space-y-3">
            <span className="text-[10px] text-[#A8B8A7] tracking-wider block">ACADEMIC STANDING</span>
            <p className="font-display text-base text-[#F0F0ED] font-medium">B.E. Computer Science</p>
            <p className="text-[#A4A8AE] text-xs leading-relaxed font-sans font-light">
              MVJ College of Engineering (VTU Bengaluru). Final-year engineering student prepared for software engineering and AI systems roles.
            </p>
          </div>

          <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-lg space-y-3">
            <span className="text-[10px] text-[#A8B8A7] tracking-wider block">CODEBASE INTEGRITY</span>
            <p className="font-display text-base text-[#F0F0ED] font-medium">21 Verified Repositories</p>
            <p className="text-[#A4A8AE] text-xs leading-relaxed font-sans font-light">
              All featured skills and architectures are backed by verifiable GitHub commits, test files, and application entry points.
            </p>
          </div>
        </div>
      </section>

      {/* Technology-to-Implementation Evidence Table */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(255,255,255,0.08)] pb-3">
          <h2 className="font-display text-xl font-medium text-[#F0F0ED]">
            Technology-to-Implementation Evidence Mapping
          </h2>
          <span className="text-xs font-mono text-[#A8B8A7]">Ground truth from GitHub commits</span>
        </div>

        <div className="overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#181A1F] text-[#A4A8AE] border-b border-[rgba(255,255,255,0.08)]">
              <tr>
                <th className="py-3 px-4 font-medium">Technical Domain</th>
                <th className="py-3 px-4 font-medium">Verified Stack</th>
                <th className="py-3 px-4 font-medium">Codebase Proof</th>
                <th className="py-3 px-4 font-medium text-right">Inspection Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.06)] bg-[#101114]">
              <tr>
                <td className="py-3 px-4 text-[#F0F0ED] font-medium">Client Cryptography</td>
                <td className="py-3 px-4 text-[#A4A8AE]">TypeScript, AES-256, Web Crypto, PBKDF2</td>
                <td className="py-3 px-4 text-[#A8B8A7]">SecretSnap</td>
                <td className="py-3 px-4 text-right">
                  <a href="https://github.com/StratagemVX/Secret-snap" target="_blank" rel="noopener noreferrer" className="text-[#A4A8AE] hover:text-[#F0F0ED]" aria-label="Source code for SecretSnap on GitHub">
                    Source Code →
                  </a>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-[#F0F0ED] font-medium">Real-Time Networking</td>
                <td className="py-3 px-4 text-[#A4A8AE]">React, TypeScript, WebSockets, Supabase</td>
                <td className="py-3 px-4 text-[#A8B8A7]">MediQueue (Queue-buddy-final)</td>
                <td className="py-3 px-4 text-right">
                  <a href="https://github.com/StratagemVX/Queue-buddy-final" target="_blank" rel="noopener noreferrer" className="text-[#A4A8AE] hover:text-[#F0F0ED]" aria-label="Source code for MediQueue on GitHub">
                    Source Code →
                  </a>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-[#F0F0ED] font-medium">Deep Learning & Vision</td>
                <td className="py-3 px-4 text-[#A4A8AE]">Python 3.12, PyTorch (CUDA 12.1), TorchVision</td>
                <td className="py-3 px-4 text-[#A8B8A7]">PRISM (Major-Project)</td>
                <td className="py-3 px-4 text-right">
                  <a href="https://github.com/StratagemVX/Major-Project" target="_blank" rel="noopener noreferrer" className="text-[#A4A8AE] hover:text-[#F0F0ED]" aria-label="Source code for PRISM on GitHub">
                    Source Code →
                  </a>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-[#F0F0ED] font-medium">Algorithmic NLP</td>
                <td className="py-3 px-4 text-[#A4A8AE]">TypeScript, Python, SymSpell, TextBlob, NLTK</td>
                <td className="py-3 px-4 text-[#A8B8A7]">SpellSense NLP</td>
                <td className="py-3 px-4 text-right">
                  <a href="https://github.com/StratagemVX/spellSense-NLP_AAT" target="_blank" rel="noopener noreferrer" className="text-[#A4A8AE] hover:text-[#F0F0ED]" aria-label="Source code for SpellSense NLP on GitHub">
                    Source Code →
                  </a>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-[#F0F0ED] font-medium">Encrypted Media Transport</td>
                <td className="py-3 px-4 text-[#A4A8AE]">React, TypeScript, Web Audio API, AES Buffers</td>
                <td className="py-3 px-4 text-[#A8B8A7]">Shadow Message Cipher (SDC-Level-3)</td>
                <td className="py-3 px-4 text-right">
                  <a href="https://github.com/StratagemVX/SDC-Level-3" target="_blank" rel="noopener noreferrer" className="text-[#A4A8AE] hover:text-[#F0F0ED]" aria-label="Source code for Shadow Message Cipher on GitHub">
                    Source Code →
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Optional Recruiter Invitation Token Area */}
      <section className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-lg space-y-4 print:hidden">
        <div className="flex items-center space-x-2 text-xs font-mono text-[#A8B8A7]">
          <ShieldCheck className="w-4 h-4 text-[#A8B8A7]" />
          <span>OPTIONAL RECRUITER VERIFICATION ROOM</span>
        </div>
        <p className="text-xs text-[#A4A8AE] leading-relaxed font-sans font-light">
          Did Chethan issue you an invitation verification token? Enter it below to unlock the verified candidate assessment record.
          <span className="block text-[11px] text-[#9CA1AA] mt-1">
            Note: Public viewing of this brief and portfolio requires no token.
          </span>
        </p>

        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3 max-w-md font-mono text-xs">
          <label htmlFor="recruiter-room-token" className="sr-only">
            Recruiter invitation verification token
          </label>
          <input
            id="recruiter-room-token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="REC-XXXX-XXXX"
            className="flex-1 bg-[#101114] border border-[rgba(255,255,255,0.08)] rounded px-3 py-2 text-[#F0F0ED] focus:outline-none focus:border-[#A8B8A7]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#22252C] border border-[rgba(255,255,255,0.08)] text-[#F0F0ED] hover:border-[#A8B8A7] rounded font-medium transition-colors"
          >
            VALIDATE TOKEN
          </button>
        </form>

        {errorMsg && (
          <p className="text-xs font-mono text-red-400">{errorMsg}</p>
        )}

        {invitationVerified && (
          <div className="p-4 bg-[#101114] border border-[#A8B8A7]/40 rounded-lg space-y-2 font-mono text-xs">
            <div className="flex items-center space-x-2 text-[#A8B8A7]">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-semibold">TOKEN VALIDATED — VERIFIED RECRUITER CLEARANCE</span>
            </div>
            <p className="text-[#A4A8AE] text-[11px]">
              Access Level: Read-Only Executive Inspection · Audit Event Logged · Session Time-To-Live: 24 Hours
            </p>
            <div className="pt-2 text-[11px] text-[#F0F0ED]">
              Direct Contact: <a href="mailto:chethan.athulith@outlook.com" className="text-[#A8B8A7] underline">chethan.athulith@outlook.com</a>
            </div>
          </div>
        )}
      </section>

      {/* Recruiter Contact Quick Bar */}
      <section className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
        <div>
          <span className="text-[#F0F0ED] font-medium block">Ready to schedule a technical discussion?</span>
          <span className="text-[#A4A8AE] text-[11px]">Response time typically within 24 hours.</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:chethan.athulith@outlook.com"
            className="px-4 py-2 rounded bg-[#A8B8A7] text-[#101114] font-medium hover:bg-[#BDCCBA] transition-colors"
          >
            INITIATE CONTACT →
          </a>
          <a
            href="https://linkedin.com/in/chethan-kumar-bs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded border border-[rgba(255,255,255,0.08)] text-[#A4A8AE] hover:text-[#F0F0ED]"
          >
            LINKEDIN
          </a>
        </div>
      </section>
    </div>
  );
}
