export type ProjectCategory = 
  | 'Cybersecurity & Cryptography'
  | 'AI & Machine Learning'
  | 'Full-Stack Development'
  | 'NLP & Language Systems'
  | 'Cloud & Distributed Systems'
  | 'Academic & Laboratory'
  | 'Experimental & Research';

export type ProjectStatus = 
  | 'Implemented' 
  | 'Active Engineering' 
  | 'Experimental' 
  | 'In Progress' 
  | 'Archived';

export interface Project {
  id: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  category: ProjectCategory;
  technologies: string[];
  language: string;
  repositoryUrl: string;
  liveDemoUrl: string | null;
  isFeatured: boolean;
  status: ProjectStatus;
  
  // Detailed Case Study Fields
  problemStatement: string;
  purpose: string;
  targetUsers: string;
  keyCapabilities: string[];
  architectureOverview: string;
  systemFlowDiagram?: string;
  myContribution: string;
  technicalChallenges: string[];
  limitations: string;
  futureWork: string[];
  
  // Metadata
  lastUpdated: string;
  defaultBranch: string;
  sourceOfTruth: 'curated-sync' | 'github-api';
  lastSyncedAt: string;
}

export interface PortfolioData {
  lastSyncedAt: string;
  repositoryCount: number;
  owner: {
    fullName: string;
    displayName: string;
    title: string;
    email: string;
    githubUrl: string;
    linkedinUrl: string;
    verifiedLinkedinUrl: string;
    philosophy: string;
    college: string;
    university: string;
    degree: string;
    status: string;
    location: string;
  };
  projects: Project[];
}

export interface RecruiterToken {
  token: string;
  createdAt: string;
  expiresAt: string;
  accessCount: number;
  label: string;
  status: 'Active' | 'Revoked' | 'Expired';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  category: 'AUTH' | 'SYNC' | 'RECRUITER_TOKEN' | 'SECURITY';
  status: 'SUCCESS' | 'WARNING' | 'FAILURE';
  details: string;
}
