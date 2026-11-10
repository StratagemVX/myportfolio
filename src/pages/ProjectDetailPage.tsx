import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Github, ExternalLink, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import projectsData from '../data/projects.json';
import MermaidDiagram from '../components/MermaidDiagram';
import SEOHead from '../components/SEOHead';
import { getProjectSEO } from '../data/seoConfig';

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const project = projectsData.projects.find((p) => p.slug === slug || p.id === slug);

  if (!project) {
    return (
      <div className="site-container py-32 text-center font-mono">
        <h1 className="text-3xl text-[#A8B8A7] font-display font-medium">Case Study Not Found</h1>
        <p className="mt-4 text-xs text-[#A4A8AE]">The requested project identifier does not exist in the verified index.</p>
        <Link
          to="/work"
          className="inline-block mt-6 px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] text-xs text-[#F0F0ED] hover:border-[#A8B8A7] transition-colors btn-highlight"
        >
          ← Back to featured projects
        </Link>
      </div>
    );
  }

  // Find next project
  const featured = projectsData.projects.filter((p) => p.isFeatured);
  const currentIndex = featured.findIndex((p) => p.id === project.id);
  const nextProject = currentIndex !== -1 && currentIndex < featured.length - 1 ? featured[currentIndex + 1] : featured[0];

  return (
    <article className="py-12 sm:py-16 space-y-14">
      <SEOHead {...getProjectSEO(project)} />
      <div className="site-container space-y-12">
        {/* Back Link */}
        <div>
          <Link
            to="/work"
            className="inline-flex items-center space-x-2 text-xs font-mono text-[#A4A8AE] hover:text-[#F0F0ED] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to featured projects</span>
          </Link>
        </div>

        {/* Case Study Header */}
        <header className="space-y-6 border-b border-[rgba(255,255,255,0.08)] pb-10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-[#A8B8A7] font-medium">{project.category}</span>
            <span className="text-[#343943]">/</span>
            <span className="text-[#F0F0ED]">{project.status}</span>
            <span className="text-[#343943]">/</span>
            <span className="text-[#A4A8AE]">Branch: {project.defaultBranch}</span>
            <span className="text-[#343943]">/</span>
            <span className="text-[#A4A8AE]">Language: {project.language}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#F0F0ED] max-w-4xl">
            {project.name}
          </h1>

          <p className="text-base sm:text-lg text-[#A8B8A7] font-light leading-relaxed max-w-4xl">
            {project.headline}
          </p>

          <div className="pt-2 flex flex-wrap gap-1.5">
            {project.technologies.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded bg-[#22252C] border border-[rgba(255,255,255,0.06)] text-xs font-mono text-[#D4D6D2]"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-3 text-xs font-mono">
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-[#181A1F] border border-[rgba(255,255,255,0.08)] text-[#F0F0ED] hover:border-[#A8B8A7]/50 flex items-center space-x-2 transition-colors btn-highlight"
            >
              <Github className="w-4 h-4 text-[#A8B8A7]" />
              <span>Inspect repository on GitHub</span>
            </a>

            {project.liveDemoUrl && (
              <a
                href={project.liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-[#22252C] hover:bg-[#2A2E37] border border-[rgba(255,255,255,0.12)] text-[#F0F0ED] font-medium flex items-center space-x-2 transition-colors btn-highlight"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#A8B8A7]" />
                <span>Live application demo</span>
              </a>
            )}
          </div>
        </header>

        {/* Problem Statement & Purpose */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 sm:p-7 rounded-xl space-y-2">
            <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase block font-medium">
              The problem statement
            </span>
            <p className="text-xs sm:text-sm text-[#A4A8AE] leading-relaxed font-light">
              {project.problemStatement}
            </p>
          </div>

          <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 sm:p-7 rounded-xl space-y-2">
            <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase block font-medium">
              Engineering purpose & target users
            </span>
            <p className="text-xs sm:text-sm text-[#A4A8AE] leading-relaxed font-light">
              {project.purpose}
            </p>
            <div className="pt-2 text-xs text-[#A4A8AE]/80 font-mono">
              <strong className="text-[#F0F0ED] font-normal">Target users: </strong>
              {project.targetUsers}
            </div>
          </div>
        </section>

        {/* System Architecture & Visual Pipeline */}
        <section className="space-y-4">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-3">
            <span className="font-mono text-xs text-[#A8B8A7]">Architecture specification</span>
            <h2 className="font-display text-2xl font-medium text-[#F0F0ED] mt-1">
              System Design & Component Pipeline
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#A4A8AE] leading-relaxed font-light max-w-4xl">
            {project.architectureOverview}
          </p>

          {project.systemFlowDiagram && (
            <div className="pt-2">
              <MermaidDiagram flowText={project.systemFlowDiagram} />
            </div>
          )}
        </section>

        {/* Key Verified Capabilities */}
        <section className="space-y-4">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-3">
            <span className="font-mono text-xs text-[#A8B8A7]">Implementation details</span>
            <h2 className="font-display text-2xl font-medium text-[#F0F0ED] mt-1">
              Key Verified Capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            {project.keyCapabilities.map((cap, i) => (
              <div
                key={i}
                className="flex items-start space-x-3 bg-[#181A1F] border border-[rgba(255,255,255,0.06)] p-4 rounded-xl"
              >
                <CheckCircle2 className="w-4 h-4 text-[#A8B8A7] shrink-0 mt-0.5" />
                <span className="text-[#F0F0ED] font-sans leading-relaxed font-light text-xs">{cap}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Verified Contribution */}
        <section className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 sm:p-7 space-y-2">
          <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase block font-medium">
            Authorship & individual contribution
          </span>
          <h3 className="font-display text-xl font-medium text-[#F0F0ED]">Implementation Role</h3>
          <p className="text-xs sm:text-sm text-[#A4A8AE] leading-relaxed font-light">
            {project.myContribution}
          </p>
        </section>

        {/* Technical Challenges Solved */}
        <section className="space-y-4">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-3">
            <span className="font-mono text-xs text-[#A8B8A7]">Engineering hurdles</span>
            <h2 className="font-display text-2xl font-medium text-[#F0F0ED] mt-1">
              Technical Challenges Solved
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            {project.technicalChallenges.map((challenge, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 rounded-xl bg-[#181A1F] border border-[rgba(255,255,255,0.06)] space-y-1.5"
              >
                <span className="text-[10px] text-[#A8B8A7] font-semibold block uppercase">
                  Challenge 0{i + 1}
                </span>
                <p className="text-[#A4A8AE] text-xs font-sans leading-relaxed font-light">{challenge}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Limitations & Planned Improvements */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 sm:p-7 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-[#A4A8AE]">
              <AlertCircle className="w-3.5 h-3.5 text-[#A8B8A7]" />
              <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase font-medium">
                Honest limitations
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#A4A8AE] leading-relaxed font-light">
              {project.limitations}
            </p>
          </div>

          <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] p-6 sm:p-7 rounded-xl space-y-2">
            <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase block font-medium">
              Future work roadmap
            </span>
            <ul className="text-xs sm:text-sm text-[#A4A8AE] space-y-1.5 list-disc list-inside font-light">
              {project.futureWork.map((fw, idx) => (
                <li key={idx}>{fw}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Next Case Study Navigation */}
        {nextProject && nextProject.id !== project.id && (
          <footer className="pt-8 border-t border-[rgba(255,255,255,0.08)] flex justify-between items-center font-mono text-xs">
            <Link
              to="/work"
              className="text-[#A4A8AE] hover:text-[#F0F0ED] transition-colors"
            >
              ← Back to all projects
            </Link>
            <Link
              to={`/project/${nextProject.slug}`}
              className="text-[#A8B8A7] hover:text-[#F0F0ED] flex items-center space-x-1.5 transition-colors"
            >
              <span>Next case study: {nextProject.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </footer>
        )}
      </div>
    </article>
  );
}
