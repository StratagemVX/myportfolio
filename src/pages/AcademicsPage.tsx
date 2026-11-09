import { Link } from 'react-router-dom';
import { GraduationCap, CheckCircle2, Github, ArrowUpRight } from 'lucide-react';

export default function AcademicsPage() {
  const courseCategories = [
    {
      title: 'Systems & Computing Foundations',
      courses: [
        'Data Structures & Algorithms',
        'Operating Systems & Kernel Concepts',
        'Database Management Systems (RDBMS)',
        'Computer Networks & Protocols',
        'Theory of Computation & Automata'
      ]
    },
    {
      title: 'Security & Applied Cryptography',
      courses: [
        'Cryptography & Network Security',
        'Information & Cyber Security',
        'Secure Socket Programming',
        'Digital Forensics Fundamentals',
        'Access Control & Identity Systems'
      ]
    },
    {
      title: 'AI, ML & Computational Linguistics',
      courses: [
        'Machine Learning Foundations',
        'Deep Learning & Neural Networks',
        'Natural Language Processing (NLP)',
        'Computer Vision & Image Processing',
        'Pattern Recognition'
      ]
    },
    {
      title: 'Cloud & Systems Architecture',
      courses: [
        'Cloud Computing & Distributed Systems',
        'Object-Oriented Design (C++ / Java)',
        'Full-Stack Web Architectures',
        'Software Engineering Principles',
        'Containerization & Microservices'
      ]
    }
  ];

  const academicRepos = [
    {
      name: 'Cloud-AAT',
      category: 'Cloud & Distributed Systems',
      description: 'Distributed cloud computing assignment analyzing microservice patterns, containerization, and REST service contracts.',
      repoUrl: 'https://github.com/StratagemVX/Cloud-AAT',
      language: 'Java / Docker'
    },
    {
      name: 'nlplabprograms',
      category: 'Computational Linguistics',
      description: 'University NLP lab implementations including Hidden Markov Model Viterbi decoding, tokenization pipelines, and n-gram estimators.',
      repoUrl: 'https://github.com/StratagemVX/nlplabprograms',
      language: 'Python / NLTK'
    },
    {
      name: 'Ml-lab',
      category: 'Statistical Machine Learning',
      description: 'Foundational ML algorithms implemented from scratch: ID3 Decision Trees with Information Gain, KNN distance metrics, and neural backpropagation.',
      repoUrl: 'https://github.com/StratagemVX/Ml-lab',
      language: 'Python / NumPy'
    },
    {
      name: 'Lab-Clarity-Final',
      category: 'Academic Systems',
      description: 'Centralized laboratory submission and curriculum tracking platform designed for computer science coursework.',
      repoUrl: 'https://github.com/StratagemVX/Lab-Clarity-Final',
      language: 'TypeScript / React'
    }
  ];

  return (
    <div className="py-12 sm:py-16 space-y-16">
      <div className="site-container space-y-12">
        {/* Header */}
        <header className="border-b border-[rgba(255,255,255,0.08)] pb-8 space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#A8B8A7]">
            <GraduationCap className="w-3.5 h-3.5 text-[#A8B8A7]" />
            <span>Academic background · Engineering foundations</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#F0F0ED]">
            Education & Engineering Foundations
          </h1>
          <p className="text-sm sm:text-base text-[#A4A8AE] font-light max-w-4xl leading-relaxed">
            Academic grounding in computer science fundamentals, theoretical computing, applied security, 
            and hands-on software engineering. Maintained with complete factual accuracy.
          </p>
        </header>

        {/* Degree & Institutional Profile */}
        <section className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] pb-6">
            <div>
              <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase block font-medium">
                Undergraduate degree
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#F0F0ED] mt-1">
                Bachelor of Engineering in Computer Science & Engineering
              </h2>
              <p className="text-sm text-[#A4A8AE] font-sans mt-1">
                MVJ College of Engineering, Bengaluru · Visvesvaraya Technological University (VTU)
              </p>
            </div>

            <div className="flex items-center shrink-0">
              <span className="px-3 py-1 rounded-lg bg-[#22252C] text-[#A8B8A7] border border-[rgba(255,255,255,0.06)] text-xs font-mono">
                Final-Year Engineering Student (2027)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-[#9CA1AA] uppercase tracking-wider block font-medium">Location</span>
              <p className="text-[#F0F0ED] font-sans text-sm">Bengaluru, Karnataka, India</p>
              <p className="text-[#A4A8AE] text-xs font-light">Primary technology & software engineering hub</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[#9CA1AA] uppercase tracking-wider block font-medium">University affiliation</span>
              <p className="text-[#F0F0ED] font-sans text-sm">VTU (State Technological University)</p>
              <p className="text-[#A4A8AE] text-xs font-light">Standardized engineering curriculum & evaluation</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[#9CA1AA] uppercase tracking-wider block font-medium">Policy on credentials</span>
              <p className="text-[#F0F0ED] font-sans text-sm">Factual Authenticity</p>
              <p className="text-[#A4A8AE] text-xs font-light">No fabricated CGPA, ranking, or unverified honors</p>
            </div>
          </div>
        </section>

        {/* Structured Coursework Grid */}
        <section className="space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-3">
            <span className="font-mono text-xs text-[#A8B8A7]">Curriculum syllabus</span>
            <h2 className="font-display text-2xl font-medium text-[#F0F0ED] mt-1">
              Verified Undergraduate Coursework
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {courseCategories.map((group) => (
              <div
                key={group.title}
                className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 sm:p-6 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-display text-base font-medium text-[#F0F0ED] border-b border-[rgba(255,255,255,0.06)] pb-3">
                    {group.title}
                  </h3>
                  <ul className="space-y-2 pt-3 text-xs text-[#A4A8AE] font-light">
                    {group.courses.map((course) => (
                      <li key={course} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#A8B8A7] shrink-0 mt-0.5" />
                        <span>{course}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Academic Laboratory Codebases */}
        <section className="space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-mono text-xs text-[#A8B8A7]">Laboratory codebases</span>
              <h2 className="font-display text-2xl font-medium text-[#F0F0ED] mt-1">
                Academic Project Implementations
              </h2>
            </div>
            <Link to="/archive" className="text-xs font-mono text-[#A8B8A7] hover:underline inline-flex items-center space-x-1">
              <span>View all repos in archive</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {academicRepos.map((repo) => (
              <div
                key={repo.name}
                className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 flex flex-col justify-between space-y-4 group hover:border-[rgba(255,255,255,0.16)] transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#A8B8A7]">{repo.category}</span>
                    <span className="text-[#A4A8AE]">{repo.language}</span>
                  </div>
                  <h3 className="font-display text-xl font-medium text-[#F0F0ED] group-hover:text-[#A8B8A7] transition-colors">
                    {repo.name}
                  </h3>
                  <p className="text-xs text-[#A4A8AE] font-light leading-relaxed">
                    {repo.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between font-mono text-xs">
                  <span className="text-[#9CA1AA] text-[11px]">Academic GitHub repository</span>
                  <a
                    href={repo.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#A8B8A7] hover:text-[#F0F0ED] flex items-center space-x-1 transition-colors"
                    aria-label={`Inspect source for ${repo.name}`}
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>Inspect source ↗</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Banner */}
        <section className="p-8 rounded-xl bg-[#181A1F] border border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <h3 className="font-display text-xl sm:text-2xl font-medium text-[#F0F0ED]">
              Want to review production engineering implementations?
            </h3>
            <p className="text-xs sm:text-sm text-[#A4A8AE] font-light leading-relaxed">
              Explore featured case studies including SecretSnap, PRISM, and Shadow Message Cipher.
            </p>
          </div>
          <Link
            to="/work"
            className="px-5 py-2.5 rounded-lg bg-[#22252C] hover:bg-[#2A2E37] border border-[rgba(255,255,255,0.12)] text-[#F0F0ED] font-mono text-xs shrink-0 transition-colors btn-highlight flex items-center space-x-2"
          >
            <span>Explore featured work</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#A8B8A7]" />
          </Link>
        </section>
      </div>
    </div>
  );
}
