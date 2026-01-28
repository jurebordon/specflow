/**
 * Shared configuration utilities for SpecFlow CLI.
 * Contains functions used by both init and update commands.
 */

/**
 * Derive GIT_WORKFLOW boolean flags and template variables from config.
 * Used by both `specflow init` and `specflow update` to ensure consistent
 * template variable derivation.
 *
 * @param {Record<string, unknown>} config - Configuration with GIT_WORKFLOW string
 */
export function deriveGitVariables(config) {
  // Boolean flags for {{#if}} blocks in templates
  config.GIT_WORKFLOW_SOLO = config.GIT_WORKFLOW === 'solo';
  config.GIT_WORKFLOW_PR = config.GIT_WORKFLOW === 'pr-review';
  config.GIT_WORKFLOW_CICD = config.GIT_WORKFLOW === 'ci-cd-gated';
  config.GIT_WORKFLOW_PR_GITHUB = config.GIT_WORKFLOW_PR && config.GIT_PLATFORM === 'GitHub';
  config.GIT_WORKFLOW_PR_GITLAB = config.GIT_WORKFLOW_PR && config.GIT_PLATFORM === 'GitLab';

  // Derived template variables used in commands and workflow docs
  config.COMMIT_CONVENTION = 'feat|fix|refactor|docs';
  config.GIT_BRANCH_CONVENTION = config.BRANCH_CONVENTION || 'feat/description';

  if (config.GIT_WORKFLOW_SOLO) {
    config.GIT_MERGE_INSTRUCTION = 'Merge feature branch to main locally';
    config.MR_COMMAND = '';
  } else if (config.GIT_WORKFLOW_PR) {
    if (config.GIT_PLATFORM === 'GitHub') {
      config.GIT_MERGE_INSTRUCTION = 'Create PR for review (do not merge locally)';
      config.MR_COMMAND = 'gh pr create';
    } else if (config.GIT_PLATFORM === 'GitLab') {
      config.GIT_MERGE_INSTRUCTION = 'Create MR for review (do not merge locally)';
      config.MR_COMMAND = 'glab mr create';
    } else {
      config.GIT_MERGE_INSTRUCTION = 'Create PR/MR for review (do not merge locally)';
      config.MR_COMMAND = '';
    }
  } else if (config.GIT_WORKFLOW_CICD) {
    if (config.GIT_PLATFORM === 'GitLab') {
      config.GIT_MERGE_INSTRUCTION = 'Create MR and let CI/CD pipeline handle merge';
      config.MR_COMMAND = 'glab mr create';
    } else {
      config.GIT_MERGE_INSTRUCTION = 'Create PR and let CI/CD pipeline handle merge';
      config.MR_COMMAND = 'gh pr create';
    }
  }
}
