import { Link } from 'react-router-dom';
import { 
  Github, 
  Shield, 
  Terminal, 
  GraduationCap,
  FileText
} from 'lucide-react';
import projectsData from '../data/projects.json';
import EngineeringWorkbench from '../components/home/EngineeringWorkbench';

export default function HomePage() {
  const featuredProjects = projectsData.projects.filter(p => p.isFeatured).slice(0, 4);

  const architecturalChapters = [
    {
      label: 'Verified codebases',
      title: 'Technical evidence matrix',
      description: 'Direct proof connecting cryptographic implementations and machine learning models to genuine GitHub commits and test suites. Zero arbitrary percentages.',
      link: '/evidence',
      linkText: 'Inspect evidence matrix',
      icon: Shield,
      highlight: true
    },
    {
      label: 'Hiring overview',
      title: 'Candidate recruiter brief',
      description: '60-second technical assessment, production readiness summary, coursework verification, and printable recruitment dossier.',
      link: '/recruiter-brief',
      linkText: 'Open recruiter brief',
      icon: FileText
    },
    {
      label: 'Codebase catalog',
      title: 'Complete 20-repo archive',
      description: 'Searchable, filterable directory of public repositories discovered through automated GitHub sync, categorized by engineering domain.',
      link: '/archive',
      linkText: 'Search repository archive',
      icon: Terminal
    },
    {
      label: 'Foundations',
      title: 'Academic record & coursework',
      description: 'Undergraduate Computer Science curriculum at MVJ College of Engineering (VTU), Bengaluru: algorithms, networks, cryptography, and operating systems.',
      link: '/academics',
      linkText: 'Review academic record',
      icon: GraduationCap
    }
  ];

  return (
    <div className="py-12 sm:py-16 space-y-24">
      <div className="site-container space-y-24">
        {/* Editorial Hero: Asymmetric 2-Column Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center pt-2 sm:pt-6">
          {/* Left Column: Narrative & Clear Positioning (6 cols) */}
          <div className="lg:col-span-6 space-y-7">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[12px] font-mono text-[#A8B8A7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A8B8A7]" />
              <span>Computer Science Engineer · Bengaluru, India</span>
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-normal tracking-tight text-[#F0F0ED] leading-[1.12]">
                Building secure, distributed web systems & applied AI.
              </h1>

              <p className="text-[#A4A8AE] text-base sm:text-lg leading-relaxed max-w-xl font-light">
                Undergraduate engineer (2027 Batch) specializing in client-side cryptography (AES-256-GCM), 
                high-concurrency Node.js microservices, and hardware-accelerated deep learning. Grounded in core Computer Science fundamentals.
              </p>
            </div>

            {/* Exactly One Primary and One Secondary Action */}
            <div className="pt-2 flex flex-wrap gap-4 items-center text-xs font-sans">
              <Link
                to="/work"
                className="px-6 py-3 rounded-md bg-[#A8B8A7] text-[#101114] font-medium hover:bg-[#BDCCBA] transition-colors btn-highlight"
              >
                Explore featured work →
              </Link>
              <Link
                to="/recruiter-brief"
                className="px-6 py-3 rounded-md bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[#F0F0ED] font-medium hover:border-[#343943] transition-colors"
              >
                Recruiter brief
              </Link>
            </div>

            {/* Quiet Credential Strip */}
            <div className="pt-6 border-t border-[rgba(255,255,255,0.06)] grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#6E727A] block">AFFILIATION</span>
                <span className="text-[#F0F0ED]">MVJCE / VTU</span>
              </div>
              <div>
                <span className="text-[10px] text-[#6E727A] block">PUBLIC REPOSITORIES</span>
                <a 
                  href="https://github.com/StratagemVX" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#A8B8A7] hover:underline"
                >
                  20 on GitHub →
                </a>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-[#6E727A] block">AVAILABILITY</span>
                <span className="text-[#A8B8A7]">Graduate Roles</span>
              </div>
            </div>
          </div>

          {/* Right Column: Genuine Interactive Engineering Workbench Visual (6 cols) */}
          <div className="lg:col-span-6">
            <EngineeringWorkbench />
          </div>
        </section>

        {/* Curated Systems Preview */}
        <section className="space-y-8">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-xs font-mono text-[#A8B8A7]">Curated systems</span>
              <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight mt-1 text-[#F0F0ED]">
                Featured engineering implementations
              </h2>
            </div>
            <Link to="/work" className="text-xs font-sans text-[#A8B8A7] hover:underline font-medium">
              View all project case studies →
            </Link>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {featuredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-xl p-7 flex flex-col justify-between space-y-6 hover:border-[#343943] transition-colors duration-150"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#A8B8A7] font-medium">{project.category}</span>
                    <span className="text-[#6E727A]">{project.language} · {project.status}</span>
                  </div>

                  <h3 className="font-display text-2xl font-medium text-[#F0F0ED]">
                    <Link to={`/project/${project.slug}`} className="hover:text-[#A8B8A7] transition-colors">
                      {project.name}
                    </Link>
                  </h3>

                  <p className="text-sm text-[#A4A8AE] leading-relaxed font-light">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.technologies.slice(0, 5).map(t => (
                      <span key={t} className="px-2.5 py-1 rounded bg-[#22252C] text-xs font-mono text-[#F0F0ED] border border-[rgba(255,255,255,0.04)]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs font-sans">
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#A4A8AE] hover:text-[#F0F0ED] flex items-center space-x-1.5 transition-colors font-mono"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>View repository</span>
                  </a>
                  <Link
                    to={`/project/${project.slug}`}
                    className="text-[#A8B8A7] hover:underline font-medium"
                  >
                    Read case study →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Architectural Sections (Varied Pacing & Content Hierarchy) */}
        <section className="space-y-8">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-5">
            <span className="text-xs font-mono text-[#A8B8A7]">Portfolio directory</span>
            <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight mt-1 text-[#F0F0ED]">
              Independent architectural sections
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {architecturalChapters.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className={`border rounded-xl p-7 flex flex-col justify-between space-y-6 transition-colors duration-150 ${
                    pillar.highlight
                      ? 'bg-[#181A1F] border-[#A8B8A7]/30 hover:border-[#A8B8A7]'
                      : 'bg-[#181A1F] border-[rgba(255,255,255,0.08)] hover:border-[#343943]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#A8B8A7]">{pillar.label}</span>
                      <Icon className="w-4 h-4 text-[#A8B8A7]" />
                    </div>
                    <h3 className="font-display text-xl font-medium text-[#F0F0ED]">
                      <Link to={pillar.link} className="hover:text-[#A8B8A7] transition-colors">
                        {pillar.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-[#A4A8AE] font-light leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
                    <Link
                      to={pillar.link}
                      className="text-xs font-sans font-medium text-[#A8B8A7] hover:underline flex items-center space-x-1"
                    >
                      <span>{pillar.linkText}</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
