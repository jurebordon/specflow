import { select, input, confirm, checkbox } from '@inquirer/prompts';
// Note: checkbox kept for Technical Layers partial selection

/**
 * Ask setup questions: project context, git workflow, integrations,
 * technical layers, and documentation preferences.
 * Tech detection and agent config are handled by /init and init.js defaults.
 *
 * @param {object} options - CLI options (e.g. --mode, --yes)
 * @returns {Promise<Record<string, unknown>>} Partial configuration
 */
export async function askBasicQuestions(options = {}) {
  const config = {};

  // ── 1. Project Mode ──────────────────────────────────────────────
  config.PROJECT_TYPE = options.mode || await select({
    message: 'What type of project is this?',
    choices: [
      { name: 'Greenfield - Fresh project, full flexibility', value: 'greenfield' },
      { name: 'Constrained - Mandated technologies/processes', value: 'constrained' },
      { name: 'Adoption - Existing codebase, adding structure', value: 'adoption' },
    ],
  });

  // ── 2. Project Context ───────────────────────────────────────────
  config.PROJECT_NAME = await input({
    message: 'Project name:',
    default: getDirectoryName(),
  });

  config.PROJECT_DESCRIPTION = await input({
    message: 'Short description (one sentence):',
  });

  // ── 3. Git Workflow ──────────────────────────────────────────────
  config.GIT_WORKFLOW = await select({
    message: 'How do you manage code changes?',
    choices: [
      { name: 'Solo - Direct merge to main', value: 'solo' },
      { name: 'PR Review - Feature branches with review', value: 'pr-review' },
      { name: 'CI/CD Gated - Automated merge via pipeline', value: 'ci-cd-gated' },
    ],
  });

  if (config.GIT_WORKFLOW !== 'solo') {
    config.GIT_PLATFORM = await select({
      message: 'Git platform?',
      choices: [
        { name: 'GitHub', value: 'GitHub' },
        { name: 'GitLab', value: 'GitLab' },
        { name: 'Bitbucket', value: 'Bitbucket' },
      ],
    });
  } else {
    config.GIT_PLATFORM = 'GitHub';
  }

  config.DEFAULT_BRANCH = await input({
    message: 'Default branch name:',
    default: 'main',
  });

  config.BRANCH_CONVENTION = await input({
    message: 'Branch naming convention:',
    default: 'feat/description',
  });

  // ── 4. Integrations ─────────────────────────────────────────────
  const hasTicketing = await confirm({
    message: 'Do you use a ticketing system?',
    default: false,
  });

  if (hasTicketing) {
    config.TICKETING = await select({
      message: 'Which ticketing system?',
      choices: [
        { name: 'GitHub Issues', value: 'GitHub Issues' },
        { name: 'GitLab Issues', value: 'GitLab Issues' },
        { name: 'Jira', value: 'Jira' },
        { name: 'Linear', value: 'Linear' },
      ],
    });

    config.TICKET_FORMAT = await input({
      message: 'Ticket format (e.g., #123, PROJ-123):',
      default: config.TICKETING.includes('Issues') ? '#123' : 'PROJ-123',
    });
  } else {
    config.TICKETING = 'None';
    config.TICKET_FORMAT = '';
  }

  // ── 5. Technical Enforcement Layers ────────────────────────────────
  // Tech stack detection is deferred to /init (AI-powered analysis)
  const techLayersChoice = await select({
    message: 'Enable technical enforcement layers (hooks, rules, statusline)?',
    choices: [
      { name: 'Yes (recommended) - Generate all layers', value: 'yes' },
      { name: 'No - Documentation and commands only', value: 'no' },
      { name: 'Partial - Choose which layers to enable', value: 'partial' },
    ],
  });

  if (techLayersChoice === 'yes') {
    config.TECHNICAL_LAYERS = true;
    config.ENABLE_HOOKS = true;
    config.ENABLE_RULES = true;
    config.ENABLE_STATUSLINE = true;
  } else if (techLayersChoice === 'no') {
    config.TECHNICAL_LAYERS = false;
    config.ENABLE_HOOKS = false;
    config.ENABLE_RULES = false;
    config.ENABLE_STATUSLINE = false;
  } else {
    config.TECHNICAL_LAYERS = true;
    const layers = await checkbox({
      message: 'Which layers to enable?',
      choices: [
        { name: 'Hooks - Session lifecycle automation', value: 'hooks', checked: true },
        { name: 'Rules - Persistent coding guidelines', value: 'rules', checked: true },
        { name: 'Statusline - Real-time status display', value: 'statusline', checked: true },
      ],
    });
    config.ENABLE_HOOKS = layers.includes('hooks');
    config.ENABLE_RULES = layers.includes('rules');
    config.ENABLE_STATUSLINE = layers.includes('statusline');
  }

  // ── 6. Documentation ──────────────────────────────────────────────
  const docsTracked = await select({
    message: 'Should SpecFlow docs be tracked in git?',
    choices: [
      { name: 'Gitignored (recommended) - Start personal, share later', value: 'gitignored' },
      { name: 'Tracked - Team shares docs from day one', value: 'tracked' },
    ],
  });

  config.DOCS_GITIGNORED = docsTracked === 'gitignored';

  config.DOCS_PATH = await input({
    message: 'SpecFlow documentation folder:',
    default: 'docs_specflow',
  });

  config.EXISTING_DOCS_PATH = await input({
    message: 'Path to existing project documentation (leave empty if none):',
    default: '',
  });

  // ── Set date ─────────────────────────────────────────────────────
  config.DATE = new Date().toISOString().split('T')[0];
  config.CURRENT_DATE = config.DATE;

  return config;
}

/**
 * Build defaults config for --yes mode (non-interactive).
 * @returns {Record<string, unknown>}
 */
export function getDefaults() {
  return {
    PROJECT_TYPE: 'adoption',
    PROJECT_NAME: getDirectoryName(),
    PROJECT_DESCRIPTION: '',
    GIT_WORKFLOW: 'solo',
    GIT_PLATFORM: 'GitHub',
    DEFAULT_BRANCH: 'main',
    BRANCH_CONVENTION: 'feat/description',
    TICKETING: 'None',
    TICKET_FORMAT: '',
    TECHNICAL_LAYERS: true,
    ENABLE_HOOKS: true,
    ENABLE_RULES: true,
    ENABLE_STATUSLINE: true,
    DOCS_GITIGNORED: true,
    DOCS_PATH: 'docs_specflow',
    EXISTING_DOCS_PATH: '',
    DATE: new Date().toISOString().split('T')[0],
    CURRENT_DATE: new Date().toISOString().split('T')[0],
  };
}

function getDirectoryName() {
  return process.cwd().split('/').pop() || 'my-project';
}
