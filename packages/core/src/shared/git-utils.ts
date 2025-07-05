import { execSync } from 'child_process';

export function getGitRemoteUrl(): string {
  try {
    const command = 'git config --get remote.origin.url';
    const remoteUrl = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    
    // Convert SSH URL to HTTPS URL if needed
    if (remoteUrl.startsWith('git@')) {
      return remoteUrl
        .replace(/^git@([^:]+):/, 'https://$1/')
        .replace(/\.git$/, '');
    }
    
    // Handle gitlab@gitlab.xxx.net format
    if (remoteUrl.startsWith('gitlab@')) {
      return remoteUrl
        .replace(/^gitlab@([^:]+):/, 'https://$1/')
        .replace(/\.git$/, '');
    }
    
    return remoteUrl.replace(/\.git$/, '');
  } catch (error) {
    return '';
  }
}

export function getCurrentBranch(): string {
  try {
    const command = 'git rev-parse --abbrev-ref HEAD';
    return execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    return 'main'; // Default to main if we can't get the branch
  }
}

export function getProjectRootPath(): string {
  try {
    const command = 'git rev-parse --show-toplevel';
    return execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    return '';
  }
}
