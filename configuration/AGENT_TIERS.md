# Agent Tiers Reference

> Reference for AI agents when selecting model tiers and understanding agent roles during INIT.

---

## Model Tiers

| Tier | Model | Strengths | Best For |
|------|-------|-----------|----------|
| **opus** | Claude Opus | Deepest reasoning, nuanced analysis, complex trade-offs | Architecture design, security auditing, multi-step planning |
| **sonnet** | Claude Sonnet | Balanced speed and capability, strong implementation | General development, testing, refactoring, bug fixing |
| **haiku** | Claude Haiku | Fastest response, lowest cost | Simple lookups, formatting, repetitive tasks |

### Choosing a Tier

- **Default to sonnet** for most agents — it handles implementation work well
- **Use opus** for advisory roles that require deep reasoning (architecture, security)
- **Use haiku** for high-volume, low-complexity tasks where speed matters most
- Users can override any default during INIT via `.specflow-config.md`

---

## Agent Catalog

### Core Agents

| Agent | Variable | Default Tier | Tools | Role |
|-------|----------|-------------|-------|------|
| **Base** | `AGENT_MODEL_BASE` | `sonnet` | read, edit, search, terminal | Core behavior and guidelines for all agents. Extended by role-specific agents. |
| **QA** | `AGENT_MODEL_QA` | `sonnet` | read, edit, search, terminal | Testing, coverage analysis, test infrastructure. Writes and maintains tests. |
| **Architecture** | `AGENT_MODEL_ARCHITECTURE` | `opus` | read, search | System design, technical decisions, ADR management. Advisory only — does not modify code. |
| **Backend** | `AGENT_MODEL_BACKEND` | `sonnet` | read, edit, search, terminal | API endpoints, business logic, data access, server-side testing. |
| **Frontend** | `AGENT_MODEL_FRONTEND` | `sonnet` | read, edit, search, terminal | UI components, state management, accessibility, client-side testing. |

### Specialist Agents

| Agent | Variable | Default Tier | Tools | Role |
|-------|----------|-------------|-------|------|
| **Build Error Resolver** | `AGENT_MODEL_BUILD_ERROR` | `sonnet` | read, edit, search, terminal | Diagnoses and fixes build failures, type errors, dependency issues. Fast iteration focus. |
| **Security Reviewer** | `AGENT_MODEL_SECURITY` | `opus` | read, search | Security auditing, OWASP top 10, auth review, secret detection. Advisory only — reports findings without modifying code. |
| **Refactor Cleaner** | `AGENT_MODEL_REFACTOR` | `sonnet` | read, edit, search, terminal | Dead code removal, complexity reduction, naming improvement, structural cleanup. |

---

## Tool Access Patterns

Agents follow two access patterns based on their role:

| Pattern | Tools | Used By | Rationale |
|---------|-------|---------|-----------|
| **Full access** | read, edit, search, terminal | Base, QA, Backend, Frontend, Build Error Resolver, Refactor Cleaner | Implementation agents that modify code directly |
| **Read-only** | read, search | Architecture, Security Reviewer | Advisory agents that analyze and recommend but don't change code |

Advisory agents (read-only) produce findings and recommendations. A separate implementing agent applies the changes. This separation prevents advisory agents from making unsupervised modifications.

---

## Default Tier Rationale

### Why opus for Architecture and Security Reviewer

These agents deal with:
- **Complex trade-offs** — weighing multiple factors with long-term implications
- **Deep analysis** — reading large amounts of code to find subtle issues
- **Nuanced judgment** — distinguishing acceptable risk from vulnerability, or pragmatic design from technical debt

The stronger reasoning of opus justifies the higher cost for these advisory roles.

### Why sonnet for everything else

Implementation agents:
- Execute well-defined tasks (write this test, fix this error, refactor this function)
- Benefit more from speed than from deeper reasoning
- Run more frequently, making cost a factor
- Follow patterns established by advisory agents

Sonnet provides the right balance of capability and efficiency for hands-on work.

### When to consider haiku

Use haiku for agents that:
- Perform repetitive, well-structured tasks
- Don't require complex reasoning
- Run at high frequency where latency matters
- Handle simple lookups or formatting

No agents default to haiku, but users can set any agent to haiku via `AGENT_MODEL_*` variables if cost optimization is a priority.

---

## Customization

### During INIT

Section 7.5 of SETUP_QUESTIONS asks users to confirm or override model tiers. Present the defaults table and let users adjust:

```
Agent Model Tiers (accept defaults or customize):

  Base Agent:            sonnet (default) / opus / haiku
  QA Agent:              sonnet (default) / opus / haiku
  Architecture Agent:    opus (default) / sonnet / haiku
  Backend Agent:         sonnet (default) / opus / haiku
  Frontend Agent:        sonnet (default) / opus / haiku
  Build Error Resolver:  sonnet (default) / opus / haiku
  Security Reviewer:     opus (default) / sonnet / haiku
  Refactor Cleaner:      sonnet (default) / opus / haiku
```

### In .specflow-config.md

Tiers are stored as variables and substituted into agent template frontmatter:

```yaml
AGENT_MODEL_BASE: sonnet
AGENT_MODEL_QA: sonnet
AGENT_MODEL_ARCHITECTURE: opus
AGENT_MODEL_BACKEND: sonnet
AGENT_MODEL_FRONTEND: sonnet
AGENT_MODEL_BUILD_ERROR: sonnet
AGENT_MODEL_SECURITY: opus
AGENT_MODEL_REFACTOR: sonnet
```

### Agent Template Frontmatter

Each agent template uses the variable in its YAML frontmatter:

```yaml
---
name: Architecture Agent
model: {{AGENT_MODEL_ARCHITECTURE}}
extends: base.md
tools:
  - read
  - search
---
```

The Handlebars variable is replaced with the actual tier value during INIT.

---

## Adding New Agents

When creating a new agent template:

1. **Determine the role** — what problem does this agent solve?
2. **Choose tool access** — does it modify code (full access) or advise (read-only)?
3. **Set default tier** — use opus for reasoning-heavy advisory roles, sonnet for implementation
4. **Add a variable** — create `AGENT_MODEL_<NAME>` in the config schema
5. **Update references** — add to SETUP_QUESTIONS.md Section 7 and 7.5, INIT.md variable table
6. **Update this document** — add the agent to the catalog table above
