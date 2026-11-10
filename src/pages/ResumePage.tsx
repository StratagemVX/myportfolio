import { Download, Printer, ExternalLink, FileText, ArrowUpRight } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { STATIC_ROUTES_SEO } from '../data/seoConfig';

export default function ResumePage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="py-12 sm:py-16 space-y-14">
      <SEOHead {...STATIC_ROUTES_SEO['/resume']} />
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
              Official engineering dossier of Chethan Kumar B S. Available for inline inspection, PDF download, and high-fidelity printing.
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
                CHETHAN KUMAR B S
              </h2>
              <p className="text-xs sm:text-sm font-mono text-[#A8B8A7] mt-1 print:text-black">
                Full Stack Engineer · Computer Science Undergraduate (2027 Batch)
              </p>
              <p className="text-xs text-[#A4A8AE] mt-1 font-sans print:text-gray-700">
                Bengaluru, Karnataka · +91 9380469287 · karnashaiva81@gmail.com · github.com/StratagemVX · linkedin.com/in/chethan-kumar-bs
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-[#A4A8AE] print:text-gray-700">
              <span className="text-[10px] text-[#A8B8A7] block font-semibold print:text-black uppercase tracking-wider">
                Status
              </span>
              <span>Available for 2027 Roles</span>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="space-y-3">
            <span className="text-xs font-mono text-[#A8B8A7] tracking-wider block font-semibold print:text-black uppercase">
              Professional Summary
            </span>
            <p className="text-sm text-[#A4A8AE] font-light leading-relaxed print:text-gray-800">
              Full Stack Engineer and Computer Science undergraduate (2027 Batch) with hands-on expertise in engineering high-throughput distributed web applications, event-driven microservices, and secure backend architectures using React.js, Next.js, Node.js, and PostgreSQL. Experienced in implementing cryptographic security protocols (AES-256), optimizing complex relational databases (ACID transactions, B-tree indexing, Redis caching), and designing responsive, high-concurrency systems. Grounded in core Computer Science fundamentals (DSA, DBMS, OS, Computer Networks) with a passion for building scalable, production-ready full-stack software.
            </p>
          </div>

          {/* Technical Skills */}
          <div className="space-y-3">
            <span className="text-xs font-mono text-[#A8B8A7] tracking-wider block font-semibold print:text-black uppercase">
              Technical Skills
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-4 bg-[#14161A] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-1 print:bg-gray-100 print:text-black print:border-gray-300">
                <span className="text-[#A8B8A7] font-semibold block print:text-black text-[11px]">Languages</span>
                <p className="text-[#F0F0ED] print:text-black">JavaScript (ES6+), TypeScript, Python, SQL, C++, C, HTML5, CSS3</p>
              </div>
              <div className="p-4 bg-[#14161A] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-1 print:bg-gray-100 print:text-black print:border-gray-300">
                <span className="text-[#A8B8A7] font-semibold block print:text-black text-[11px]">Frontend Development</span>
                <p className="text-[#F0F0ED] print:text-black">React.js, Next.js 14, Redux Toolkit, Tailwind CSS, Responsive Web Design, SSR/SSG, WebSockets</p>
              </div>
              <div className="p-4 bg-[#14161A] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-1 print:bg-gray-100 print:text-black print:border-gray-300">
                <span className="text-[#A8B8A7] font-semibold block print:text-black text-[11px]">Backend & APIs</span>
                <p className="text-[#F0F0ED] print:text-black">Node.js, Express.js, RESTful API Design, Socket.io, Microservices Architecture, JWT, RBAC, Middleware</p>
              </div>
              <div className="p-4 bg-[#14161A] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-1 print:bg-gray-100 print:text-black print:border-gray-300">
                <span className="text-[#A8B8A7] font-semibold block print:text-black text-[11px]">Databases & Caching</span>
                <p className="text-[#F0F0ED] print:text-black">PostgreSQL, MySQL, Redis, Database Normalization (3NF), Query Optimization, Indexing, Connection Pooling</p>
              </div>
              <div className="p-4 bg-[#14161A] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-1 print:bg-gray-100 print:text-black print:border-gray-300">
                <span className="text-[#A8B8A7] font-semibold block print:text-black text-[11px]">DevOps & Tools</span>
                <p className="text-[#F0F0ED] print:text-black">Git, GitHub, Docker, Postman, Linux/Bash, Vite, VS Code, CI/CD Basics, Vercel</p>
              </div>
              <div className="p-4 bg-[#14161A] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-1 print:bg-gray-100 print:text-black print:border-gray-300">
                <span className="text-[#A8B8A7] font-semibold block print:text-black text-[11px]">Core CS & Security</span>
                <p className="text-[#F0F0ED] print:text-black">Data Structures & Algorithms, OOP, DBMS, Operating Systems, Computer Networks, AES-256 Encryption, OWASP Web Security</p>
              </div>
            </div>
          </div>

          {/* Key Engineering Projects */}
          <div className="space-y-4">
            <span className="text-xs font-mono text-[#A8B8A7] tracking-wider block font-semibold print:text-black uppercase">
              Key Engineering Projects
            </span>

            <div className="space-y-4">
              {/* Project 1: PRISM */}
              <div className="p-4 sm:p-5 rounded-lg bg-[#14161A] border border-[rgba(255,255,255,0.06)] space-y-3 print:bg-white print:border-gray-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono">
                  <span className="font-display font-medium text-base text-[#F0F0ED] print:text-black">
                    PRISM — Platform for Real-time Intelligence & Secure Management
                  </span>
                  <a 
                    href="https://github.com/StratagemVX/PRISM" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#A8B8A7] hover:underline flex items-center space-x-1"
                  >
                    <span>StratagemVX/PRISM</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs font-mono text-[#A8B8A7] print:text-gray-700">
                  Next.js, Node.js, PostgreSQL, Redis, WebSockets, Docker · Final Year Capstone Project · Full Stack Enterprise Monitoring & Security Platform
                </p>
                <ul className="text-xs text-[#A4A8AE] font-sans leading-relaxed print:text-gray-800 space-y-1.5 list-disc list-inside font-light">
                  <li>Architected an end-to-end full-stack intelligence platform enabling real-time telemetry streaming, role-based access control (RBAC), and automated threat detection workflows.</li>
                  <li>Engineered high-throughput Node.js microservices integrated with Socket.io/WebSockets, achieving sub-45ms bidirectional state synchronization across 500+ simulated concurrent active sessions.</li>
                  <li>Designed normalized PostgreSQL relational schemas coupled with a Redis in-memory caching tier, slashing repetitive analytical query response latency by 65%.</li>
                  <li>Implemented AES-256-GCM encrypted payload channels and JWT session verification with rate-limiting middleware, ensuring strict OWASP API compliance.</li>
                  <li>Containerized microservices using Docker and orchestrated unified developer environments with structured logging and environment isolation.</li>
                </ul>
              </div>

              {/* Project 2: Self-Destructive Encrypted Messaging System */}
              <div className="p-4 sm:p-5 rounded-lg bg-[#14161A] border border-[rgba(255,255,255,0.06)] space-y-3 print:bg-white print:border-gray-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono">
                  <span className="font-display font-medium text-base text-[#F0F0ED] print:text-black">
                    Self-Destructive Encrypted Messaging System
                  </span>
                  <a 
                    href="https://github.com/StratagemVX/secure-messenger" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#A8B8A7] hover:underline flex items-center space-x-1"
                  >
                    <span>StratagemVX/secure-messenger</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs font-mono text-[#A8B8A7] print:text-gray-700">
                  React.js, Node.js, Express.js, PostgreSQL, Web Crypto API · Production-Ready Ephemeral Communication Architecture
                </p>
                <ul className="text-xs text-[#A4A8AE] font-sans leading-relaxed print:text-gray-800 space-y-1.5 list-disc list-inside font-light">
                  <li>Built a zero-knowledge, privacy-focused messaging application executing client-side end-to-end encryption via AES-256-GCM algorithms.</li>
                  <li>Designed automated Time-To-Live (TTL) expiration protocols and asynchronous purge cron routines to irreversibly wipe expired message data and metadata from PostgreSQL storage.</li>
                  <li>Developed an interactive React interface featuring real-time self-destruct timers, dynamic read receipts, and defensive sanitization against Cross-Site Scripting (XSS).</li>
                  <li>Configured backend RESTful endpoints with CORS policies, Helmet security headers, and connection pooling (pg-pool) sustaining high request throughput.</li>
                </ul>
              </div>

              {/* Project 3: High-Concurrency Railway Reservation & Transit Engine */}
              <div className="p-4 sm:p-5 rounded-lg bg-[#14161A] border border-[rgba(255,255,255,0.06)] space-y-3 print:bg-white print:border-gray-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono">
                  <span className="font-display font-medium text-base text-[#F0F0ED] print:text-black">
                    High-Concurrency Railway Reservation & Transit Engine
                  </span>
                  <a 
                    href="https://github.com/StratagemVX/railway-dbms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#A8B8A7] hover:underline flex items-center space-x-1"
                  >
                    <span>StratagemVX/railway-dbms</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs font-mono text-[#A8B8A7] print:text-gray-700">
                  React.js, Node.js, Express.js, PostgreSQL, SQL · Enterprise Database Management System & Administrative Portal
                </p>
                <ul className="text-xs text-[#A4A8AE] font-sans leading-relaxed print:text-gray-800 space-y-1.5 list-disc list-inside font-light">
                  <li>Designed an enterprise relational database architecture modeling train schedules, dynamic routes, passenger manifests, and tiered seat inventory.</li>
                  <li>Engineered ACID-compliant SQL transactions and row-level locking mechanisms, eliminating race conditions and over-booking anomalies during simultaneous seat reservations.</li>
                  <li>Optimized multi-table JOIN operations across 100,000+ synthetic passenger records using composite B-tree indexes, reducing overall query latency from 320ms to 42ms.</li>
                  <li>Constructed an administrative management dashboard with React and REST APIs for real-time dispatch monitoring and automated booking analytics.</li>
                </ul>
              </div>

              {/* Project 4: AI-Powered Developer Intelligence Portfolio */}
              <div className="p-4 sm:p-5 rounded-lg bg-[#14161A] border border-[rgba(255,255,255,0.06)] space-y-3 print:bg-white print:border-gray-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono">
                  <span className="font-display font-medium text-base text-[#F0F0ED] print:text-black">
                    AI-Powered Developer Intelligence Portfolio
                  </span>
                  <a 
                    href="https://github.com/StratagemVX/portfolio" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#A8B8A7] hover:underline flex items-center space-x-1"
                  >
                    <span>StratagemVX/portfolio</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs font-mono text-[#A8B8A7] print:text-gray-700">
                  Next.js 14, React, TypeScript, Tailwind CSS, REST API · Modern Responsive Web Platform with Dynamic Integrations
                </p>
                <ul className="text-xs text-[#A4A8AE] font-sans leading-relaxed print:text-gray-800 space-y-1.5 list-disc list-inside font-light">
                  <li>Engineered an AI-themed interactive developer portfolio utilizing Next.js 14 Server-Side Rendering (SSR) and Incremental Static Regeneration (ISR), achieving a 99+ Google Lighthouse performance rating.</li>
                  <li>Integrated GitHub REST API to dynamically fetch and display live repository metrics, commit velocity, and deployment statistics.</li>
                  <li>Implemented modular Tailwind CSS component architectures with fluid dark-mode transitions, responsive layouts, and zero Cumulative Layout Shift (CLS).</li>
                </ul>
              </div>
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
                  Bachelor of Engineering in Computer Science and Engineering
                </h3>
                <p className="text-sm text-[#A4A8AE] font-sans print:text-gray-700">
                  MVJ College of Engineering, Bengaluru · Visvesvaraya Technological University (VTU)
                </p>
                <p className="text-xs text-[#A4A8AE]/80 mt-1 font-mono print:text-gray-600">
                  <strong>Relevant Coursework:</strong> Data Structures & Algorithms, Object-Oriented Programming, Database Management Systems (DBMS), Operating Systems, Computer Networks, Software Engineering, Web Technologies.
                </p>
              </div>
              <span className="text-xs font-mono text-[#A8B8A7] print:text-black shrink-0">
                Expected 2027 · Bengaluru, India
              </span>
            </div>
          </div>

          {/* Technical Achievements & Certifications */}
          <div className="space-y-3">
            <span className="text-xs font-mono text-[#A8B8A7] tracking-wider block font-semibold print:text-black uppercase">
              Technical Achievements & Certifications
            </span>
            <ul className="text-xs text-[#A4A8AE] font-sans leading-relaxed print:text-gray-800 space-y-2 list-disc list-inside font-light">
              <li>
                <strong className="text-[#F0F0ED] font-medium font-mono">Algorithmic Problem Solving:</strong> Solved 200+ Data Structures & Algorithms problems across LeetCode and GeeksforGeeks, focusing on Graph Algorithms, Dynamic Programming, Trees, and Array manipulation.
              </li>
              <li>
                <strong className="text-[#F0F0ED] font-medium font-mono">Engineering Leadership:</strong> Spearheaded full-stack architecture, database modeling, and cryptographic integration for final year capstone project PRISM.
              </li>
              <li>
                <strong className="text-[#F0F0ED] font-medium font-mono">Certifications:</strong> Full Stack Web Development (React, Node.js), Python for Software Systems, SQL & Relational Database Design, Data Structures & Algorithms in C++.
              </li>
            </ul>
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

          <div className="w-full h-[650px] sm:h-[850px] rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#181A1F] overflow-hidden">
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
