import { Download, Printer, ExternalLink, FileText } from 'lucide-react';
import projectsData from '../data/projects.json';

export default function ResumePage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="py-12 sm:py-16 space-y-14">
      <div className="site-container space-y-10">
        {/* Header Bar */}
        <header className="border-b border-[rgba(255,255,255,0.08)] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#A8B8A7]">
              <FileText className="w-3.5 h-3.5 text-[#A8B8A7]" />
              <span>Curriculum vitae · Verified engineering record</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#F0F0ED]">
              Curriculum Vitae & Résumé
            </h1>
            <p className="text-sm sm:text-base text-[#A4A8AE] font-light leading-relaxed">
              Official engineering dossier of Chethan Kumar B S. Available for inline inspection, PDF download, and printing.
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
            <a
              href="/resume.pdf"
              download="Chethan_Kumar_Resume.pdf"
              className="px-4 py-2 rounded-lg bg-[#22252C] hover:bg-[#2A2E37] border border-[rgba(255,255,255,0.12)] text-[#F0F0ED] font-medium flex items-center space-x-2 transition-colors btn-highlight"
            >
              <Download className="w-3.5 h-3.5 text-[#A8B8A7]" />
              <span>Download official PDF</span>
            </a>
          </div>
        </header>

        {/* Digital Résumé Presentation Card */}
        <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 sm:p-10 space-y-10 print:bg-white print:text-black print:border-none print:p-0">
          {/* Header */}
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#F0F0ED] tracking-tight print:text-black">
                Chethan Kumar B S
              </h2>
              <p className="text-xs sm:text-sm font-mono text-[#A8B8A7] mt-1 print:text-black">
                Computer Science Engineer · AI & Intelligent Systems · Cybersecurity
              </p>
              <p className="text-xs text-[#A4A8AE] mt-1 font-sans print:text-gray-700">
                Bengaluru, India · chethan.athulith@outlook.com · github.com/StratagemVX · linkedin.com/in/chethan-kumar-bs
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-[#A4A8AE] print:text-gray-700">
              <span className="text-[10px] text-[#A8B8A7] block font-semibold print:text-black uppercase tracking-wider">
                Last updated
              </span>
              <span>November 2026</span>
            </div>
          </div>

          {/* Education */}
          <div className="space-y-3">
            <span className="text-xs font-mono text-[#A8B8A7] tracking-wider block font-semibold print:text-black uppercase">
              Education
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="font-display text-base sm:text-lg font-medium text-[#F0F0ED] print:text-black">
                  Bachelor of Engineering in Computer Science & Engineering
                </h3>
                <p className="text-sm text-[#A4A8AE] font-sans print:text-gray-700">
                  MVJ College of Engineering, Bengaluru · Visvesvaraya Technological University (VTU)
                </p>
              </div>
              <span className="text-xs font-mono text-[#A8B8A7] print:text-black">
                Final-Year Context
              </span>
            </div>
          </div>

          {/* Technical Capabilities */}
          <div className="space-y-3">
            <span className="text-xs font-mono text-[#A8B8A7] tracking-wider block font-semibold print:text-black uppercase">
              Technical expertise & evidence mapping
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-4 bg-[#14161A] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-1 print:bg-gray-100 print:text-black print:border-gray-300">
                <span className="text-[#A8B8A7] font-semibold block print:text-black text-[11px]">Languages & runtimes</span>
                <p className="text-[#F0F0ED] print:text-black">Python, TypeScript, JavaScript, C++, Java, SQL, HTML/CSS</p>
              </div>
              <div className="p-4 bg-[#14161A] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-1 print:bg-gray-100 print:text-black print:border-gray-300">
                <span className="text-[#A8B8A7] font-semibold block print:text-black text-[11px]">Cybersecurity & cryptography</span>
                <p className="text-[#F0F0ED] print:text-black">AES-256-GCM, PBKDF2, Web Crypto API, Steganography, Socket Programming</p>
              </div>
              <div className="p-4 bg-[#14161A] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-1 print:bg-gray-100 print:text-black print:border-gray-300">
                <span className="text-[#A8B8A7] font-semibold block print:text-black text-[11px]">Artificial intelligence & ML</span>
                <p className="text-[#F0F0ED] print:text-black">PyTorch (CUDA 12.1), OpenCV, Scikit-Learn, NumPy, SymSpell, TextBlob, NLTK</p>
              </div>
              <div className="p-4 bg-[#14161A] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-1 print:bg-gray-100 print:text-black print:border-gray-300">
                <span className="text-[#A8B8A7] font-semibold block print:text-black text-[11px]">Full-stack & cloud systems</span>
                <p className="text-[#F0F0ED] print:text-black">React, Node.js, Express, Supabase (PostgreSQL), MongoDB, WebSockets, Docker, Git</p>
              </div>
            </div>
          </div>

          {/* Featured Technical Projects */}
          <div className="space-y-4">
            <span className="text-xs font-mono text-[#A8B8A7] tracking-wider block font-semibold print:text-black uppercase">
              Featured engineering systems
            </span>

            <div className="space-y-4">
              {projectsData.projects
                .filter((p) => p.isFeatured)
                .slice(0, 4)
                .map((project) => (
                  <div
                    key={project.id}
                    className="p-4 sm:p-5 rounded-lg bg-[#14161A] border border-[rgba(255,255,255,0.06)] space-y-2 print:bg-white print:border-gray-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono">
                      <span className="font-display font-medium text-base text-[#F0F0ED] print:text-black">
                        {project.name} —{' '}
                        <span className="text-xs font-normal text-[#A8B8A7] font-mono print:text-black">
                          {project.category}
                        </span>
                      </span>
                      <span className="text-[#A4A8AE] print:text-gray-700">
                        {project.language} · {project.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#A4A8AE] font-sans leading-relaxed print:text-gray-800 font-light">
                      {project.description}
                    </p>
                    <p className="text-[11px] font-mono text-[#A8B8A7] print:text-black">
                      <strong>Stack:</strong> {project.technologies.join(', ')}
                    </p>
                    <p className="text-[11px] font-sans text-[#F0F0ED]/90 print:text-black font-light">
                      <strong>Contribution:</strong> {project.myContribution}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Philosophy Statement */}
          <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-[#A4A8AE] print:text-gray-700">
            <span>Philosophy: "Security First. Intelligence Always."</span>
            <span>StratagemVX · Verified GitHub Footprint</span>
          </div>
        </div>

        {/* Embedded PDF Viewer Object Frame */}
        <section className="space-y-3 print:hidden">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#A8B8A7]">Official document embed</span>
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A4A8AE] hover:text-[#F0F0ED] flex items-center space-x-1"
            >
              <span>Open raw PDF in new tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="w-full h-[650px] sm:h-[800px] rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#181A1F] overflow-hidden">
            <object data="/resume.pdf" type="application/pdf" className="w-full h-full">
              <div className="h-full flex flex-col items-center justify-center p-8 text-center font-mono text-xs space-y-4">
                <p className="text-[#A4A8AE]">PDF viewer plugin not detected in this browser.</p>
                <a
                  href="/resume.pdf"
                  download="Chethan_Kumar_Resume.pdf"
                  className="px-4 py-2 rounded-lg bg-[#22252C] hover:bg-[#2A2E37] border border-[rgba(255,255,255,0.12)] text-[#F0F0ED] font-medium transition-colors btn-highlight"
                >
                  Download PDF directly →
                </a>
              </div>
            </object>
          </div>
        </section>
      </div>
    </div>
  );
}
