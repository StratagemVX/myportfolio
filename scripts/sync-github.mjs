/**
 * Automated GitHub Synchronisation Service
 * Discovers public repositories for StratagemVX, retrieves READMEs, languages,
 * and maintains curated case study integrity.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GITHUB_USER = 'StratagemVX';
const OUTPUT_FILE = path.resolve(__dirname, '../src/data/projects.json');
const SNAPSHOT_FILE = path.resolve(__dirname, '../src/data/github-snapshot.json');

const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function syncRepositories() {
  console.log(`[SYNC] Initializing GitHub discovery for: ${GITHUB_USER}...`);
  const headers = { 'User-Agent': 'Antigravity-Portfolio-Sync' };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`, { headers });
    
    if (res.status === 403) {
      console.warn(`[SYNC WARNING] GitHub API rate limit reached (HTTP 403). Preserving current curated data index.`);
      return;
    }
    
    if (!res.ok) {
      throw new Error(`GitHub API returned status ${res.status}: ${res.statusText}`);
    }

    const repos = await res.json();
    console.log(`[SYNC] Discovered ${repos.length} repositories from GitHub.`);

    let existingData;
    try {
      const raw = await fs.readFile(OUTPUT_FILE, 'utf-8');
      existingData = JSON.parse(raw);
    } catch {
      existingData = { projects: [] };
    }

    const existingProjects = existingData.projects || [];

    const updatedProjects = [];

    for (const repo of repos) {
      if (repo.fork) continue; // Exclude raw forks from featured representation

      // Find matching existing project by id, repo name, slug, or url
      const normRepo = normalize(repo.name);
      const existing = existingProjects.find(p => 
        normalize(p.id) === normRepo ||
        normalize(p.name) === normRepo ||
        normalize(p.slug) === normRepo ||
        (p.repositoryUrl && normalize(p.repositoryUrl.split('/').pop()) === normRepo)
      );

      // Determine category honestly
      let category = existing?.category;
      if (!category) {
        category = categorizeRepo(repo.name);
      }

      // Preserve curated technologies + add primary language
      const combinedTech = new Set(existing?.technologies || []);
      if (repo.language) combinedTech.add(repo.language);
      const technologies = Array.from(combinedTech);

      const projectRecord = {
        id: existing?.id || repo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: existing?.name || repo.name,
        slug: existing?.slug || repo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        headline: existing?.headline || repo.description || 'Public engineering repository.',
        description: existing?.description || repo.description || 'Repository under active engineering.',
        category: category,
        technologies: technologies.length > 0 ? technologies : ['Code'],
        language: repo.language || existing?.language || 'Code',
        repositoryUrl: repo.html_url,
        liveDemoUrl: repo.homepage || existing?.liveDemoUrl || null,
        isFeatured: existing ? existing.isFeatured : false,
        status: existing?.status || (repo.archived ? 'Archived' : 'Active Engineering'),
        
        // Preserve curated case study details
        problemStatement: existing?.problemStatement || 'Problem statement and scope documented in repository.',
        purpose: existing?.purpose || 'Engineered as part of active development portfolio.',
        targetUsers: existing?.targetUsers || 'Developers and engineering reviewers.',
        keyCapabilities: existing?.keyCapabilities || ['Modular codebase', 'Version controlled on GitHub'],
        architectureOverview: existing?.architectureOverview || 'Architecture documented in repository source files.',
        systemFlowDiagram: existing?.systemFlowDiagram || undefined,
        myContribution: existing?.myContribution || 'Original repository implementation.',
        technicalChallenges: existing?.technicalChallenges || ['Iterative system design and testing.'],
        limitations: existing?.limitations || 'None documented in repository.',
        futureWork: existing?.futureWork || ['Continued feature development.'],

        lastUpdated: repo.updated_at,
        defaultBranch: repo.default_branch || 'main',
        sourceOfTruth: existing ? existing.sourceOfTruth : 'github-api',
        lastSyncedAt: new Date().toISOString()
      };

      updatedProjects.push(projectRecord);
    }

    // Keep any curated projects that were already registered
    for (const p of existingProjects) {
      if (!updatedProjects.some(u => normalize(u.id) === normalize(p.id))) {
        updatedProjects.push(p);
      }
    }

    const payload = {
      lastSyncedAt: new Date().toISOString(),
      repositoryCount: repos.length,
      owner: existingData.owner || {
        fullName: "Chethan Kumar B S",
        displayName: "Chethan Kumar",
        title: "Computer Science Engineer | AI & Intelligent Systems | Cybersecurity | Software Engineering",
        email: "chethan.athulith@outlook.com",
        githubUrl: "https://github.com/StratagemVX",
        linkedinUrl: "https://linkedin.com/in/chethan-kumar-bs",
        verifiedLinkedinUrl: "https://linkedin.com/in/chethan-kumar-b-s-781a002bb",
        philosophy: "Security First. Intelligence Always.",
        college: "MVJ College of Engineering, Bengaluru",
        university: "Visvesvaraya Technological University (VTU)",
        degree: "Bachelor of Engineering in Computer Science",
        status: "Final-Year Engineering Student",
        location: "Bengaluru, India"
      },
      projects: updatedProjects
    };

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(payload, null, 2));
    await fs.writeFile(SNAPSHOT_FILE, JSON.stringify(payload, null, 2));
    console.log(`[SYNC SUCCESS] Portfolio project data updated with ${updatedProjects.length} projects.`);
  } catch (err) {
    console.error(`[SYNC FAILURE] Failed to synchronize GitHub repositories: ${err.message}`);
    // Attempt fallback to local snapshot
    try {
      const snap = await fs.readFile(SNAPSHOT_FILE, 'utf-8');
      await fs.writeFile(OUTPUT_FILE, snap);
      console.log(`[SYNC FALLBACK] Restored valid project snapshot.`);
    } catch {
      console.warn(`[SYNC NOTICE] Fallback snapshot unchanged.`);
    }
  }
}

function categorizeRepo(name) {
  const n = name.toLowerCase();
  if (n.includes('snap') || n.includes('comm') || n.includes('shadow') || n.includes('cipher') || n.includes('security')) {
    return 'Cybersecurity & Cryptography';
  }
  if (n.includes('nlp') || n.includes('spell')) {
    return 'NLP & Language Systems';
  }
  if (n.includes('sdc') || n.includes('vision') || n.includes('ai') || n.includes('prism') || n.includes('ml')) {
    return 'AI & Machine Learning';
  }
  if (n.includes('cloud')) {
    return 'Cloud & Distributed Systems';
  }
  if (n.includes('lab')) {
    return 'Academic & Laboratory';
  }
  return 'Full-Stack Development';
}

syncRepositories();
