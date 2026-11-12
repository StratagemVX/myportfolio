import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Github, Filter, ArrowUpRight } from 'lucide-react';
import projectsData from '../data/projects.json';
import SEOHead from '../components/SEOHead';
import { STATIC_ROUTES_SEO } from '../data/seoConfig';

export default function ArchivePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Cybersecurity & Cryptography',
    'AI & Machine Learning',
    'NLP & Language Systems',
    'Full-Stack Development',
    'Academic & Laboratory',
    'Cloud & Distributed Systems',
    'Experimental & Research'
  ];

  const filteredProjects = projectsData.projects.filter((project) => {
    const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.technologies.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      project.language.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="py-12 sm:py-16 space-y-12">
      <SEOHead {...STATIC_ROUTES_SEO['/archive']} />
      <div className="site-container space-y-10">
        {/* Header */}
        <header className="border-b border-[rgba(255,255,255,0.08)] pb-8 space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#A8B8A7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A8B8A7]" />
            <span>Repository directory · Complete index</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#F0F0ED]">
            Public Repository Archive
          </h1>
          <p className="text-sm sm:text-base text-[#A4A8AE] font-light max-w-4xl leading-relaxed">
            A comprehensive, uninflated index of all public code repositories discovered from StratagemVX on GitHub.
            Search across keywords, languages, or architectural categories.
          </p>
        </header>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between font-mono text-xs">
          <div className="relative flex-1 max-w-lg">
            <label htmlFor="archive-search-input" className="sr-only">
              Filter repositories by name, language, or stack
            </label>
            <Search className="w-4 h-4 text-[#A4A8AE] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="archive-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, language (Python, TypeScript, C++), or stack..."
              className="w-full bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg pl-10 pr-4 py-2.5 text-[#F0F0ED] placeholder-[#A4A8AE]/50 focus:outline-none focus:border-[#A8B8A7]/70 transition-colors"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-1.5">
              <label htmlFor="archive-category-filter" className="sr-only">
                Filter repositories by category
              </label>
              <Filter className="w-3.5 h-3.5 text-[#A8B8A7] shrink-0" aria-hidden="true" />
              <select
                id="archive-category-filter"
                aria-label="Filter repositories by category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-[#F0F0ED] focus:outline-none text-xs font-mono cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-[#181A1F] text-[#F0F0ED]">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs font-mono text-[#A4A8AE] tabular-nums shrink-0 hidden sm:inline">
              {filteredProjects.length} of {projectsData.projects.length}
            </span>
          </div>
        </div>

        {/* Projects Table */}
        <div className="overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#181A1F] text-[#A4A8AE] border-b border-[rgba(255,255,255,0.08)]">
              <tr>
                <th className="py-3.5 px-5 font-medium">Repository & description</th>
                <th className="py-3.5 px-5 font-medium">Classification</th>
                <th className="py-3.5 px-5 font-medium hidden md:table-cell">Primary stack</th>
                <th className="py-3.5 px-5 font-medium">Status</th>
                <th className="py-3.5 px-5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)] bg-[#14161A]">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-[#181A1F]/60 transition-colors">
                  <td className="py-4 px-5">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {project.isFeatured ? (
                          <Link
                            to={`/project/${project.slug}`}
                            className="text-[#F0F0ED] hover:text-[#A8B8A7] font-medium text-sm font-sans flex items-center space-x-1"
                          >
                            <span>{project.name}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-[#A8B8A7]" />
                          </Link>
                        ) : (
                          <span className="text-[#F0F0ED] font-medium text-sm font-sans">{project.name}</span>
                        )}
                        {project.isFeatured && (
                          <span className="text-[10px] text-[#A8B8A7] px-2 py-0.5 rounded bg-[#A8B8A7]/10 font-mono border border-[#A8B8A7]/20">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#A4A8AE] font-light max-w-xl leading-relaxed">
                        {project.headline || project.description}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-[#A8B8A7] text-xs">
                    {project.category}
                  </td>
                  <td className="py-4 px-5 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {project.technologies.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded bg-[#1F2228] text-[10px] text-[#D4D6D2] border border-[rgba(255,255,255,0.05)]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        project.status === 'Implemented'
                          ? 'bg-[#A8B8A7]/10 text-[#A8B8A7] border border-[#A8B8A7]/20'
                          : project.status === 'Experimental'
                          ? 'bg-[#22252C] text-[#A4A8AE] border border-[rgba(255,255,255,0.06)]'
                          : 'bg-[#22252C] text-[#D4D6D2]'
                      }`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-[#A4A8AE] hover:text-[#F0F0ED] text-[11px] px-2.5 py-1 rounded bg-[#181A1F] border border-[rgba(255,255,255,0.06)] hover:border-[#A8B8A7]/40 transition-colors"
                        title="GitHub Repository"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Code ↗</span>
                      </a>
                      {project.isFeatured && (
                        <Link
                          to={`/project/${project.slug}`}
                          className="text-[#A8B8A7] hover:underline text-[11px] font-mono"
                        >
                          Case study →
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
