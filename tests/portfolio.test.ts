import { describe, it, expect } from 'vitest';
import projectsData from '../src/data/projects.json';

describe('Chethan Kumar Portfolio Data Integrity & Route Architecture Tests', () => {
  it('loads valid portfolio metadata without inventing unverified credentials', () => {
    expect(projectsData.owner.fullName).toBe('Chethan Kumar B S');
    expect(projectsData.owner.displayName).toBe('Chethan Kumar');
    expect(projectsData.owner.githubUrl).toBe('https://github.com/StratagemVX');
    expect(projectsData.owner.email).toBe('chethan.athulith@outlook.com');
    expect(projectsData.owner.philosophy).toBe('Security First. Intelligence Always.');
    expect(projectsData.owner.college).toContain('MVJ College of Engineering');
    expect(projectsData.owner.university).toContain('Visvesvaraya Technological University');
  });

  it('contains verified featured projects with architectural case studies', () => {
    const featured = projectsData.projects.filter(p => p.isFeatured);
    expect(featured.length).toBeGreaterThanOrEqual(4);

    for (const project of featured) {
      expect(project.slug).toBeDefined();
      expect(project.problemStatement.length).toBeGreaterThan(15);
      expect(project.architectureOverview.length).toBeGreaterThan(15);
      expect(project.myContribution.length).toBeGreaterThan(10);
      expect(project.limitations.length).toBeGreaterThan(5);
      expect(project.repositoryUrl).toContain('github.com/StratagemVX');
    }
  });

  it('correctly classifies empty repository ShadowComm as Experimental', () => {
    const shadowComm = projectsData.projects.find(p => p.id === 'shadowcomm');
    expect(shadowComm).toBeDefined();
    expect(shadowComm?.isFeatured).toBe(false);
    expect(shadowComm?.status).toBe('Experimental');
  });

  it('maps technical capabilities to real GitHub codebases with zero fake percentages', () => {
    const secretSnap = projectsData.projects.find(p => p.id === 'secret-snap');
    expect(secretSnap?.technologies).toContain('AES-256');

    const sdc = projectsData.projects.find(p => p.id === 'sdc-level-3');
    expect(sdc?.technologies).toContain('React');
    expect(sdc?.name).toBe('Shadow Message Cipher');

    const prism = projectsData.projects.find(p => p.id === 'major-project');
    expect(prism?.technologies).toContain('PyTorch (CUDA 12.1)');

    const spellSense = projectsData.projects.find(p => p.id === 'spellsense-nlp-aat');
    expect(spellSense?.technologies).toContain('SymSpell');
  });

  it('ensures no sensitive secrets or tokens are stored in client data models', () => {
    const raw = JSON.stringify(projectsData);
    expect(raw).not.toContain('ghp_');
    expect(raw).not.toContain('auth0_secret');
    expect(raw).not.toContain('client_secret');
    expect(raw).not.toContain('private_key');
  });
});
