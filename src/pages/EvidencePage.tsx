import { Link } from 'react-router-dom';
import { ArrowUpRight, Github, ShieldCheck, Cpu, Database } from 'lucide-react';
import projectsData from '../data/projects.json';
import SEOHead from '../components/SEOHead';
import { STATIC_ROUTES_SEO } from '../data/seoConfig';

export default function EvidencePage() {
  const evidenceMatrix = [
    {
      domain: 'Applied Cryptography & Privacy',
      technologies: ['AES-256-GCM', 'PBKDF2 SHA-256', 'Web Crypto API', 'HMAC Verification', 'Cipher Steganography'],
      primaryRepo: 'SecretSnap',
      repoSlug: 'secret-snap',
      repoUrl: 'https://github.com/StratagemVX/Secret-snap',
      verifiedProof:
        'Client-side ephemeral encryption pipeline, PBKDF2 salt derivation, URI fragment key isolation, and zero-knowledge message relay.'
    },
    {
      domain: 'Real-Time Encrypted Multimedia',
      technologies: ['WebRTC MediaStreams', 'Web Audio API', 'Uint8Array Buffers', 'AES Stream Transform', 'WebSocket Framing'],
      primaryRepo: 'Shadow Message Cipher (SDC-Level-3)',
      repoSlug: 'shadow-message-cipher',
      repoUrl: 'https://github.com/StratagemVX/SDC-Level-3',
      verifiedProof:
        'Binary audio buffer serialization, camera frame stream transformation into encrypted packets, and terminal UI ergonomics.'
    },
    {
      domain: 'Hardware-Accelerated Deep Learning',
      technologies: ['Python 3.12', 'PyTorch (CUDA 12.1)', 'TorchVision', 'TorchAudio', 'NumPy', 'Scikit-Learn'],
      primaryRepo: 'PRISM (Major-Project)',
      repoSlug: 'prism-risk-modeling',
      repoUrl: 'https://github.com/StratagemVX/Major-Project',
      verifiedProof:
        'CUDA native GPU kernel memory caching, modular neural network layers, outlier preprocessing pipeline, and ROC-AUC telemetry.'
    },
    {
      domain: 'Computational Linguistics & NLP',
      technologies: ['SymSpell (Symmetric Delete)', 'TextBlob', 'Levenshtein DP Matrices', 'NLTK', 'Damerau-Levenshtein'],
      primaryRepo: 'SpellSense NLP',
      repoSlug: 'spellsense-nlp',
      repoUrl: 'https://github.com/StratagemVX/spellSense-NLP_AAT',
      verifiedProof:
        'Dynamic programming distance visualization, empirical execution latency profiling in milliseconds, and candidate ranking metrics.'
    },
    {
      domain: 'Full-Stack Distributed Orchestration',
      technologies: ['React', 'TypeScript', 'Supabase (PostgreSQL)', 'WebSockets', 'Tailwind CSS', 'Row-Level Security'],
      primaryRepo: 'MediQueue (Queue-buddy-final)',
      repoSlug: 'mediqueue',
      repoUrl: 'https://github.com/StratagemVX/Queue-buddy-final',
      verifiedProof:
        'Three-portal role architecture (Patient, Doctor, Admin), live token state propagation over WebSockets, and dynamic wait times.'
    },
    {
      domain: 'Accessible Healthcare Engineering',
      technologies: ['Vite', 'React', 'TypeScript', 'Web Speech API', 'Firebase', 'Offline Caching'],
      primaryRepo: 'Arogya Mitra',
      repoSlug: 'arogya-mitra',
      repoUrl: 'https://github.com/StratagemVX/arogyamitraa',
      verifiedProof:
        'Voice-driven speech recognition wrapper, multilingual dialect toggle state, and offline symptom triage guides.'
    },
    {
      domain: 'Relational Database Engineering',
      technologies: ['MySQL', 'PostgreSQL', 'Database Schemas', 'Atomic Transactions', 'Node.js Express'],
      primaryRepo: 'Microfinance & Queue-buddy-final',
      repoSlug: 'microfinance',
      repoUrl: 'https://github.com/StratagemVX/microfinance',
      verifiedProof:
        'Normalized relational schemas, loan installment amortization calculations, and concurrency-safe token generation.'
    },
    {
      domain: 'Foundational ML Algorithms',
      technologies: ['Python', 'ID3 Decision Trees', 'ANN Backprop', 'KNN Distance Metrics', 'Entropy & Information Gain'],
      primaryRepo: 'ML-Lab',
      repoSlug: 'ml-lab',
      repoUrl: 'https://github.com/StratagemVX/Ml-lab',
      verifiedProof:
        'Implemented core machine learning algorithms from first-principles linear algebra and calculus rather than black-box libraries.'
    }
  ];

  return (
    <div className="py-12 sm:py-16 space-y-16">
      <SEOHead {...STATIC_ROUTES_SEO['/evidence']} />
      <div className="site-container space-y-12">
        {/* Header */}
        <header className="border-b border-[rgba(255,255,255,0.08)] pb-8 space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#A8B8A7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A8B8A7]" />
            <span>Engineering verification · Empirical proof</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#F0F0ED]">
            Technical Evidence & Codebase Verification
          </h1>
          <p className="text-sm sm:text-base text-[#A4A8AE] font-light max-w-4xl leading-relaxed">
            Every listed capability is directly linked to genuine commits, dependency files, and application entry points
            in the StratagemVX GitHub repositories. Arbitrary percentage bars are rejected in favor of verifiable engineering evidence.
          </p>
        </header>

        {/* Verification Manifesto Strip */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#A8B8A7]">
              <Cpu className="w-3.5 h-3.5" />
              <span>No arbitrary percentages</span>
            </div>
            <h3 className="text-[#F0F0ED] font-display text-base font-medium">Empirical ground truth</h3>
            <p className="text-[#A4A8AE] text-xs font-light leading-relaxed">
              We do not claim vague percentage metrics. Engineering proficiency is demonstrated through functioning codebases,
              test suites, and quantifiable runtime telemetry.
            </p>
          </div>

          <div className="p-6 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#A8B8A7]">
              <Database className="w-3.5 h-3.5" />
              <span>Source code inspection</span>
            </div>
            <h3 className="text-[#F0F0ED] font-display text-base font-medium">20 Indexed repositories</h3>
            <p className="text-[#A4A8AE] text-xs font-light leading-relaxed">
              Every technical claim points to exact repository URLs where reviewers can inspect syntax, dependency manifests,
              modular architectures, and commit histories.
            </p>
          </div>

          <div className="p-6 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#A8B8A7]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cryptographic standards</span>
            </div>
            <h3 className="text-[#F0F0ED] font-display text-base font-medium">Security-first architecture</h3>
            <p className="text-[#A4A8AE] text-xs font-light leading-relaxed">
              Cryptographic implementations use NIST-recommended primitives (AES-256-GCM, PBKDF2 SHA-256) via the Web Crypto API
              with zero broken custom ciphers.
            </p>
          </div>
        </section>

        {/* Full-Width Capability-to-Implementation Evidence Table */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="font-display text-2xl font-medium text-[#F0F0ED]">
              Full Evidence & Codebase Mapping
            </h2>
            <span className="text-xs font-mono text-[#A8B8A7]">
              Source: StratagemVX · Updated {new Date(projectsData.lastSyncedAt).toLocaleDateString()}
            </span>
          </div>

          <div className="overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#181A1F] text-[#A4A8AE] border-b border-[rgba(255,255,255,0.08)]">
                <tr>
                  <th className="py-3.5 px-5 font-medium">Domain & scope</th>
                  <th className="py-3.5 px-5 font-medium">Verified technologies</th>
                  <th className="py-3.5 px-5 font-medium">Codebase implementation</th>
                  <th className="py-3.5 px-5 font-medium text-right">Repository source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.05)] bg-[#14161A]">
                {evidenceMatrix.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#181A1F]/60 transition-colors">
                    <td className="py-4 px-5 align-top">
                      <span className="text-[#F0F0ED] font-medium block text-sm font-sans mb-1">{item.domain}</span>
                      <p className="text-[11px] text-[#A4A8AE] font-light max-w-sm leading-relaxed">{item.verifiedProof}</p>
                    </td>
                    <td className="py-4 px-5 align-top">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.technologies.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-[#1F2228] text-[10px] text-[#D4D6D2] border border-[rgba(255,255,255,0.05)]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-5 align-top">
                      <Link
                        to={`/project/${item.repoSlug}`}
                        className="text-[#A8B8A7] hover:underline font-medium inline-flex items-center space-x-1"
                      >
                        <span>{item.primaryRepo}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                    <td className="py-4 px-5 text-right align-top">
                      <a
                        href={item.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-[#A4A8AE] hover:text-[#F0F0ED] text-[11px] px-2.5 py-1 rounded bg-[#181A1F] border border-[rgba(255,255,255,0.06)] hover:border-[#A8B8A7]/40 transition-colors"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Inspect code</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bottom CTA to Recruiter Brief */}
        <section className="p-8 rounded-xl bg-[#181A1F] border border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <h3 className="font-display text-xl sm:text-2xl font-medium text-[#F0F0ED]">
              Need a consolidated brief for engineering recruitment?
            </h3>
            <p className="text-xs sm:text-sm text-[#A4A8AE] font-light leading-relaxed">
              The Recruiter Brief formats these verified competencies, academic standing, and architecture case studies
              into an executive 60-second assessment format.
            </p>
          </div>
          <Link
            to="/recruiter-brief"
            className="px-5 py-2.5 rounded-lg bg-[#22252C] hover:bg-[#2A2E37] border border-[rgba(255,255,255,0.12)] text-[#F0F0ED] font-mono text-xs shrink-0 transition-colors btn-highlight flex items-center space-x-2"
          >
            <span>View recruiter brief</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#A8B8A7]" />
          </Link>
        </section>
      </div>
    </div>
  );
}
