import { Link } from 'react-router-dom';
import { ArrowUpRight, Github, ExternalLink, Terminal } from 'lucide-react';
import projectsData from '../data/projects.json';
import SEOHead from '../components/SEOHead';
import { STATIC_ROUTES_SEO } from '../data/seoConfig';

export default function WorkPage() {
  const featuredProjects = projectsData.projects.filter((p) => p.isFeatured);

  return (
    <div className="py-12 sm:py-16 space-y-16">
      <SEOHead {...STATIC_ROUTES_SEO['/work']} />
      <div className="site-container space-y-12">
        {/* Page Header */}
        <header className="border-b border-[rgba(255,255,255,0.08)] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#A8B8A7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A8B8A7]" />
              <span>Systems engineering · Capstone portfolio</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#F0F0ED]">
              Featured Technical Systems
            </h1>
            <p className="text-sm sm:text-base text-[#A4A8AE] font-light leading-relaxed">
              Production-ready distributed services, client-side cryptographic protocols, and algorithmic pipelines
              selected from verified GitHub repositories. Each entry highlights concrete problem spaces, architectural
              mechanisms, and honest engineering trade-offs.
            </p>
          </div>

          <div className="flex items-center shrink-0">
            <Link
              to="/archive"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-xs font-mono text-[#A4A8AE] hover:text-[#F0F0ED] hover:border-[#A8B8A7]/40 transition-colors btn-highlight"
            >
              <span>Explore all {projectsData.projects.length} repositories</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#A8B8A7]" />
            </Link>
          </div>
        </header>

        {/* Featured Projects Grid: Wide 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {featuredProjects.map((project) => (
            <article
              key={project.id}
              className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 sm:p-8 hover:border-[rgba(255,255,255,0.16)] transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-6">
                {/* Header Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="text-[#A8B8A7] font-medium">{project.category}</span>
                    <span className="text-[#343943]">/</span>
                    <span className="text-[#A4A8AE]">{project.language}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                      project.status === 'Implemented'
                        ? 'bg-[#A8B8A7]/10 text-[#A8B8A7] border border-[#A8B8A7]/20'
                        : 'bg-[#22252C] text-[#A4A8AE] border border-[rgba(255,255,255,0.06)]'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Project Title & Headline */}
                <div className="space-y-2">
                  <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#F0F0ED] group-hover:text-[#A8B8A7] transition-colors">
                    <Link to={`/project/${project.slug}`} className="inline-flex items-center space-x-2">
                      <span>{project.name}</span>
                      <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </h2>
                  <p className="text-xs font-mono text-[#A8B8A7]/90 font-light leading-relaxed">
                    {project.headline}
                  </p>
                </div>

                <p className="text-sm text-[#A4A8AE] leading-relaxed font-light">
                  {project.description}
                </p>

                {/* Technical Architecture & Scope Spec */}
                <div className="border border-[rgba(255,255,255,0.06)] rounded-lg divide-y divide-[rgba(255,255,255,0.05)] bg-[#14161A] text-xs">
                  <div className="p-3.5 space-y-1">
                    <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase block font-medium">
                      Problem space
                    </span>
                    <p className="text-[#A4A8AE] text-xs leading-relaxed font-light">
                      {project.problemStatement}
                    </p>
                  </div>
                  <div className="p-3.5 space-y-1">
                    <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase block font-medium">
                      System architecture
                    </span>
                    <p className="text-[#A4A8AE] text-xs leading-relaxed font-light">
                      {project.architectureOverview}
                    </p>
                  </div>
                </div>

                {/* Dual Specifications: Verified Contribution & Honest Limitations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-[#1B1E24] rounded-lg border border-[rgba(255,255,255,0.05)] space-y-1">
                    <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase block font-medium">
                      Verified contribution
                    </span>
                    <p className="text-[#F0F0ED] text-xs leading-relaxed font-light">
                      {project.myContribution}
                    </p>
                  </div>
                  <div className="p-3.5 bg-[#1B1E24] rounded-lg border border-[rgba(255,255,255,0.05)] space-y-1">
                    <span className="text-[10px] font-mono tracking-wider text-[#9CA1AA] uppercase block font-medium">
                      Honest limitation
                    </span>
                    <p className="text-[#A4A8AE] text-xs leading-relaxed font-light">
                      {project.limitations}
                    </p>
                  </div>
                </div>

                {/* Technologies Stack */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded bg-[#22252C] text-xs font-mono text-[#D4D6D2] border border-[rgba(255,255,255,0.05)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-8 pt-5 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between font-mono text-xs">
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#A4A8AE] hover:text-[#F0F0ED] flex items-center space-x-1.5 transition-colors"
                  aria-label={`GitHub repository for ${project.name}`}
                >
                  <Github className="w-4 h-4" />
                  <span>Repository</span>
                </a>

                <div className="flex items-center space-x-3">
                  {project.liveDemoUrl && (
                    <a
                      href={project.liveDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#A8B8A7] hover:underline flex items-center space-x-1 text-xs"
                      aria-label={`Live demo for ${project.name}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Live demo</span>
                    </a>
                  )}
                  <Link
                    to={`/project/${project.slug}`}
                    className="px-3.5 py-1.5 rounded-lg bg-[#22252C] border border-[rgba(255,255,255,0.08)] text-[#A8B8A7] hover:border-[#A8B8A7] hover:text-[#F0F0ED] transition-colors btn-highlight"
                    aria-label={`Read case study for ${project.name}`}
                  >
                    Read case study →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Coursework & Labs Callout */}
        <section className="p-8 rounded-xl bg-[#181A1F] border border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#A8B8A7]">
              <Terminal className="w-3.5 h-3.5" />
              <span>Complete repository directory</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-medium text-[#F0F0ED]">
              Looking for coursework repositories, utilities, or lab modules?
            </h3>
            <p className="text-xs sm:text-sm text-[#A4A8AE] font-light leading-relaxed">
              The public repository archive indexes all {projectsData.projects.length} repositories with full-text search,
              classification filters, and live GitHub synchronization metadata.
            </p>
          </div>
          <Link
            to="/archive"
            className="px-5 py-2.5 rounded-lg bg-[#22252C] hover:bg-[#2A2E37] border border-[rgba(255,255,255,0.12)] text-[#F0F0ED] font-mono text-xs shrink-0 transition-colors btn-highlight flex items-center space-x-2"
          >
            <span>Open complete archive</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#A8B8A7]" />
          </Link>
        </section>
      </div>
    </div>
  );
}
