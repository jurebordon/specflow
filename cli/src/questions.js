import { select, input, confirm, checkbox } from '@inquirer/prompts';

/**
 * Run the full interactive setup questionnaire.
 * Returns a config object with all collected answers.
 *
 * @param {object} options - CLI options (e.g. --mode, --yes)
 * @returns {Promise<Record<string, unknown>>} Collected configuration
 */
export async function askSetupQuestions(options = {}) {
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

  // ── 5. Tech Stack Detection ──────────────────────────────────────
  // Handled separately in detect.js — questions.js only asks for manual input
  // when auto-detection is declined or finds nothing.
  config.SCAN_TECH_STACK = await confirm({
    message: 'May I scan your project to detect the tech stack?',
    default: true,
  });

  if (!config.SCAN_TECH_STACK) {
    config.TECH_STACK = await input({
      message: 'Describe your tech stack (language, framework, test tool, build tool):',
    });
  }

  // ── 5.5 Technical Enforcement Layers ──────────────────────────────
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

  // ── 6. Documentation Tracking ────────────────────────────────────
  const docsTracked = await select({
    message: 'Should docs_specflow/ be tracked in git?',
    choices: [
      { name: 'Gitignored (recommended) - Start personal, share later', value: 'gitignored' },
      { name: 'Tracked - Team shares docs from day one', value: 'tracked' },
    ],
  });

  config.DOCS_GITIGNORED = docsTracked === 'gitignored';
  config.DOCS_PATH = 'docs_specflow';

  // ── 7. Agent Roles ───────────────────────────────────────────────
  config.AGENT_ROLES = await checkbox({
    message: 'Which AI agent roles are relevant? (select all that apply)',
    choices: [
      { name: 'Backend - API, services, data access', value: 'backend', checked: true },
      { name: 'Frontend - UI components, state management', value: 'frontend', checked: true },
      { name: 'QA - Testing, quality assurance', value: 'qa', checked: true },
      { name: 'Architecture - Design decisions (advisory)', value: 'architecture', checked: true },
      { name: 'Build Error Resolver - Build failures, type errors', value: 'build-error-resolver' },
      { name: 'Security Reviewer - Security auditing (advisory)', value: 'security-reviewer' },
      { name: 'Refactor Cleaner - Dead code, complexity reduction', value: 'refactor-cleaner' },
    ],
  });

  // Agent model tiers — use defaults (only ask if user wants to customize)
  config.AGENT_MODEL_BASE = 'sonnet';
  config.AGENT_MODEL_QA = 'sonnet';
  config.AGENT_MODEL_ARCHITECTURE = 'opus';
  config.AGENT_MODEL_BACKEND = 'sonnet';
  config.AGENT_MODEL_FRONTEND = 'sonnet';
  config.AGENT_MODEL_BUILD_ERROR = 'sonnet';
  config.AGENT_MODEL_SECURITY = 'opus';
  config.AGENT_MODEL_REFACTOR = 'sonnet';

  const customizeTiers = await confirm({
    message: 'Customize agent model tiers? (defaults: sonnet for most, opus for architecture/security)',
    default: false,
  });

  if (customizeTiers) {
    const tierChoices = [
      { name: 'opus - Strongest reasoning', value: 'opus' },
      { name: 'sonnet - Balanced (default)', value: 'sonnet' },
      { name: 'haiku - Fastest/cheapest', value: 'haiku' },
    ];

    for (const role of config.AGENT_ROLES) {
      const varName = `AGENT_MODEL_${role.toUpperCase().replace(/-/g, '_')}`;
      const currentDefault = config[varName] || 'sonnet';
      config[varName] = await select({
        message: `Model tier for ${role}:`,
        choices: tierChoices,
        default: currentDefault,
      });
    }
  }

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
    SCAN_TECH_STACK: true,
    TECHNICAL_LAYERS: true,
    ENABLE_HOOKS: true,
    ENABLE_RULES: true,
    ENABLE_STATUSLINE: true,
    DOCS_GITIGNORED: true,
    DOCS_PATH: 'docs_specflow',
    AGENT_ROLES: ['backend', 'frontend', 'qa', 'architecture'],
    AGENT_MODEL_BASE: 'sonnet',
    AGENT_MODEL_QA: 'sonnet',
    AGENT_MODEL_ARCHITECTURE: 'opus',
    AGENT_MODEL_BACKEND: 'sonnet',
    AGENT_MODEL_FRONTEND: 'sonnet',
    AGENT_MODEL_BUILD_ERROR: 'sonnet',
    AGENT_MODEL_SECURITY: 'opus',
    AGENT_MODEL_REFACTOR: 'sonnet',
    DATE: new Date().toISOString().split('T')[0],
    CURRENT_DATE: new Date().toISOString().split('T')[0],
  };
}

function getDirectoryName() {
  return process.cwd().split('/').pop() || 'my-project';
}
