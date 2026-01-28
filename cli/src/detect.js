import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * Tech stack detection rules.
 * Each entry maps a marker file to a language/framework with default commands.
 */
const DETECTION_RULES = [
  {
    files: ['package.json', 'tsconfig.json'],
    language: 'typescript',
    label: 'Node.js / TypeScript',
    commands: {
      TEST_COMMAND: 'npm test',
      BUILD_COMMAND: 'npm run build',
      LINT_COMMAND: 'eslint .',
      FORMAT_COMMAND: 'npx prettier --write .',
      TYPECHECK_COMMAND: 'npx tsc --noEmit',
    },
    booleanFlag: 'TYPESCRIPT',
  },
  {
    files: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'],
    language: 'python',
    label: 'Python',
    commands: {
      TEST_COMMAND: 'pytest',
      BUILD_COMMAND: 'python -m build',
      LINT_COMMAND: 'ruff check .',
      FORMAT_COMMAND: 'ruff format .',
      TYPECHECK_COMMAND: 'mypy .',
    },
    booleanFlag: 'PYTHON',
  },
  {
    files: ['dbt_project.yml'],
    language: 'dbt',
    label: 'DBT',
    commands: {
      TEST_COMMAND: 'dbt test',
      BUILD_COMMAND: 'dbt build',
      LINT_COMMAND: 'sqlfluff lint',
      FORMAT_COMMAND: 'sqlfluff fix',
      TYPECHECK_COMMAND: '',
    },
    booleanFlag: 'DBT',
  },
  {
    files: ['Gemfile', 'Rakefile'],
    language: 'ruby',
    label: 'Ruby',
    commands: {
      TEST_COMMAND: 'rspec',
      BUILD_COMMAND: 'bundle install',
      LINT_COMMAND: 'rubocop',
      FORMAT_COMMAND: 'rubocop -A',
      TYPECHECK_COMMAND: '',
    },
    booleanFlag: 'RUBY',
  },
  {
    files: ['go.mod'],
    language: 'go',
    label: 'Go',
    commands: {
      TEST_COMMAND: 'go test ./...',
      BUILD_COMMAND: 'go build',
      LINT_COMMAND: 'golangci-lint run',
      FORMAT_COMMAND: 'gofmt -w .',
      TYPECHECK_COMMAND: 'go vet ./...',
    },
    booleanFlag: 'GO',
  },
  {
    files: ['Cargo.toml'],
    language: 'rust',
    label: 'Rust',
    commands: {
      TEST_COMMAND: 'cargo test',
      BUILD_COMMAND: 'cargo build --release',
      LINT_COMMAND: 'cargo clippy',
      FORMAT_COMMAND: 'cargo fmt',
      TYPECHECK_COMMAND: 'cargo check',
    },
    booleanFlag: 'RUST',
  },
  {
    files: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
    language: 'java',
    label: 'Java',
    commands: {
      TEST_COMMAND: 'mvn test',
      BUILD_COMMAND: 'mvn package',
      LINT_COMMAND: 'mvn checkstyle:check',
      FORMAT_COMMAND: '',
      TYPECHECK_COMMAND: 'mvn compile',
    },
    booleanFlag: 'JAVA',
  },
];

/** Directories to skip during recursive scanning. */
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'venv', '.venv', '__pycache__', 'target',
  'dist', 'build', '.next', '.nuxt', '.cache', 'vendor', '.specflow',
]);

/**
 * Collect all file names from a directory up to `maxDepth` levels deep.
 * Returns a Set of relative paths (e.g. "tools/pyproject.toml").
 *
 * @param {string} dir - Directory to scan
 * @param {number} maxDepth - Maximum depth (0 = root only)
 * @param {number} currentDepth - Internal recursion tracker
 * @returns {Set<string>}
 */
function collectFiles(dir, maxDepth, currentDepth = 0) {
  const files = new Set();

  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isFile()) {
      files.add(entry); // Only need the filename for matching
    } else if (stat.isDirectory() && currentDepth < maxDepth && !SKIP_DIRS.has(entry) && !entry.startsWith('.')) {
      const subFiles = collectFiles(fullPath, maxDepth, currentDepth + 1);
      for (const f of subFiles) {
        files.add(f);
      }
    }
  }

  return files;
}

/**
 * Scan the project directory for known tech stack markers.
 * Scans up to `maxDepth` levels deep (default 2) to find indicator files.
 *
 * @param {string} projectDir - Absolute path to the project root
 * @param {object} options - { maxDepth: number }
 * @returns {{ detected: Array<{language: string, label: string, commands: Record<string, string>, booleanFlag: string}>, techStack: string, commands: Record<string, string>, booleanFlags: Record<string, boolean> }}
 */
export function detectTechStack(projectDir, options = {}) {
  const maxDepth = options.maxDepth ?? 3;
  const projectFiles = collectFiles(projectDir, maxDepth);
  const detected = [];

  for (const rule of DETECTION_RULES) {
    const found = rule.files.some(file => projectFiles.has(file));
    if (found) {
      detected.push(rule);
    }
  }

  // Build summary
  const techStack = detected.map(d => d.label).join(', ') || 'Unknown';

  // For single-stack projects, use commands directly.
  // For mixed-stack, use the first detected stack's commands as primary.
  const commands = detected.length > 0
    ? { ...detected[0].commands }
    : {
        TEST_COMMAND: '# No test command configured',
        BUILD_COMMAND: '# No build command configured',
        LINT_COMMAND: '# No lint command configured',
        FORMAT_COMMAND: '# No format command configured',
        TYPECHECK_COMMAND: '# No type check command configured',
      };

  // Boolean flags for conditional template blocks
  const booleanFlags = {};
  for (const rule of DETECTION_RULES) {
    booleanFlags[rule.booleanFlag] = detected.some(d => d.booleanFlag === rule.booleanFlag);
  }

  return { detected, techStack, commands, booleanFlags };
}
