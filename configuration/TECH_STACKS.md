# Tech Stack Command Reference

> Reference for AI agents when generating tech-adaptive commands

---

## Python

### Detection
- Files: `requirements.txt`, `pyproject.toml`, `setup.py`, `Pipfile`
- Typical structure: `src/`, `tests/`, `setup.py`

### Commands
```yaml
TEST_COMMAND: pytest
BUILD_COMMAND: python -m build
LINT_COMMAND: ruff check .
```

### Common Frameworks
- **FastAPI**: Web framework
- **Django**: Web framework
- **Flask**: Web framework
- **SQLAlchemy**: ORM

---

## DBT (Data Build Tool)

### Detection
- Files: `dbt_project.yml`
- Typical structure: `models/`, `tests/`, `macros/`

### Commands
```yaml
TEST_COMMAND: dbt test
BUILD_COMMAND: dbt build
LINT_COMMAND: sqlfluff lint
```

---

## Node.js / TypeScript

### Detection
- Files: `package.json`, `tsconfig.json`
- Typical structure: `src/`, `dist/`, `node_modules/`

### Commands
```yaml
TEST_COMMAND: npm test
BUILD_COMMAND: npm run build
LINT_COMMAND: eslint .
```

### Common Frameworks
- **React**: Frontend framework
- **Next.js**: React framework
- **Express**: Backend framework
- **NestJS**: Backend framework

---

## Ruby

### Detection
- Files: `Gemfile`, `Rakefile`
- Typical structure: `lib/`, `spec/`, `app/`

### Commands
```yaml
TEST_COMMAND: rspec
BUILD_COMMAND: bundle install
LINT_COMMAND: rubocop
```

### Common Frameworks
- **Rails**: Web framework
- **Sinatra**: Lightweight web framework

---

## Go

### Detection
- Files: `go.mod`, `go.sum`
- Typical structure: `cmd/`, `pkg/`, `internal/`

### Commands
```yaml
TEST_COMMAND: go test ./...
BUILD_COMMAND: go build
LINT_COMMAND: golangci-lint run
```

---

## Rust

### Detection
- Files: `Cargo.toml`, `Cargo.lock`
- Typical structure: `src/`, `tests/`, `target/`

### Commands
```yaml
TEST_COMMAND: cargo test
BUILD_COMMAND: cargo build --release
LINT_COMMAND: cargo clippy
```

---

## Java

### Detection
- Files: `pom.xml`, `build.gradle`, `build.gradle.kts`
- Typical structure: `src/main/`, `src/test/`

### Commands

**Maven**:
```yaml
TEST_COMMAND: mvn test
BUILD_COMMAND: mvn package
LINT_COMMAND: mvn checkstyle:check
```

**Gradle**:
```yaml
TEST_COMMAND: ./gradlew test
BUILD_COMMAND: ./gradlew build
LINT_COMMAND: ./gradlew checkstyleMain
```

---

## Mixed Stack Projects

When multiple languages are detected, store commands as arrays:

```yaml
TEST_COMMANDS:
  - context: Python
    command: pytest
  - context: DBT
    command: dbt test

BUILD_COMMANDS:
  - context: Python
    command: python -m build
  - context: DBT
    command: dbt build

LINT_COMMANDS:
  - context: Python
    command: ruff check .
  - context: SQL
    command: sqlfluff lint
```

AI agents should:
1. Detect what's being worked on (file paths, branch name)
2. Choose appropriate command from list
3. Provide all options if context is ambiguous

---

## Custom Configurations

If project has custom commands in `package.json` scripts, `Makefile`, or similar:
- Prioritize project-defined commands
- Ask user: "I found custom commands in [file]. Should I use these?"

Example:
```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "build": "vite build",
    "lint": "biome check"
  }
}
```

Use: `npm test`, `npm run build`, `npm run lint`

---

## No Build Tool Detected

If no build tool is detected:
- TEST_COMMAND: "# No test command configured"
- BUILD_COMMAND: "# No build command configured"
- LINT_COMMAND: "# No lint command configured"

AI should ask user: "No build tools detected. What commands should I use for testing/building/linting?"
