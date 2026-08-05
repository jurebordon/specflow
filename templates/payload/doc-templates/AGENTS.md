# Agent Catalog

> How to install and select specialist agents.
> See `ORCHESTRATION.md` for lifecycle rules, delegation constraints, checkpoints, and failure handling.

---

## Installing Agents

SpecFlow does not ship agents. Install community-maintained agents for specialist expertise:

**Recommended: [VoltAgent community agents](https://github.com/VoltAgent/awesome-claude-code-subagents)** — 100+ agents for backend, frontend, security, architecture, DevOps, and more.

```bash
git clone https://github.com/VoltAgent/awesome-claude-code-subagents.git
cd awesome-claude-code-subagents && ./install-agents.sh
```

Agents install to `.claude/agents/` (project-specific) or `~/.claude/agents/` (global).

---

## How Agents Work

1. Agent definitions are Markdown files in `.claude/agents/` with YAML frontmatter
2. Claude Code auto-discovers them at session start
3. Invoke via the `Task` tool with `subagent_type` matching the agent's `name` field
4. Each agent runs in an isolated context with its own system prompt and tool access

Other Agent Skills-compatible tools may call these "subagents", "workers", or "specialists". Use the same selection rules: bounded task, clear context, explicit ownership, and primary-agent integration.

---

## Delegation Patterns

These are common ways to use agents inside the session lifecycle defined in `ORCHESTRATION.md`.

### Pattern 1: Design, Implement, Test (Sequential)

Best for: **New features** that benefit from upfront design review.

```
1. Architecture specialist  →  Review design, check patterns
2. Backend/Frontend specialist  →  Implement the feature
3. Testing specialist  →  Write tests, verify coverage
```

### Pattern 2: Parallel Implementation

Best for: **Full-stack features** where backend and frontend are independent.

```
1. Architecture specialist  →  Review design (optional)
2. Backend + Frontend specialists  →  Implement in parallel
3. Testing specialist  →  Test both sides
```

Use parallel `Task` tool calls — both agents run simultaneously.

### Pattern 3: Implement, then Review (Post-hoc)

Best for: **Security-sensitive changes** or **significant refactors**.

```
1. Implement the changes (directly or with a domain specialist)
2. Security specialist  →  Audit for vulnerabilities
3. Refactoring specialist  →  Review code quality (optional)
```

### Pattern 4: Fix, then Verify (Reactive)

Best for: **Build failures**, **test failures**, or **reported bugs**.

```
1. Build/error specialist  →  Diagnose and fix
2. Testing specialist  →  Verify fix, check for regressions
```

### Pattern 5: Cleanup (Maintenance)

Best for: **Technical debt**, **dead code**, **complexity reduction**.

```
1. Refactoring specialist  →  Identify and clean up code
2. Testing specialist  →  Verify no regressions
```

---

## Task-to-Agent Quick Reference

| You're working on... | Look for an agent that... |
|----------------------|--------------------------|
| API endpoint | Specializes in backend development |
| UI component | Specializes in frontend development |
| Database migration | Specializes in backend/data |
| Auth/permissions | Backend specialist, then security specialist |
| Build won't compile | Specializes in build diagnostics |
| Dead code cleanup | Specializes in refactoring |
| New module design | Specializes in architecture |
| Code review | Security + refactoring specialists (parallel) |

---

## Guidelines

- **Don't over-orchestrate**: Simple tasks don't need agents. A one-line fix doesn't need an architecture review.
- **Provide context**: Include the roadmap task, feature name, relevant files, and constraints from `CUSTOM.md`, `WORKFLOW.md`, and feature specs.
- **Assign ownership**: If an agent may edit files, state exactly which files or modules it owns.
- **Preserve others' changes**: Agents share the codebase. They must not revert human or other-agent work.
- **One task per session still applies**: Agents help you do the task better, not do more tasks.
- **Primary agent integrates**: The primary session reviews agent output, resolves conflicts, runs verification, and writes the session log.
