# SpecFlow Principles

This document defines the core philosophy and guiding principles of SpecFlow.

## The Problem

AI coding assistants are transformative but chaotic when undirected:

- **Context evaporates** - Each session starts fresh, losing prior decisions
- **Documentation drifts** - Code evolves, docs become fiction
- **Patterns fragment** - No consistency without explicit guidance
- **Decisions vanish** - Why something was built a certain way is lost

## The Solution

SpecFlow provides **structure without rigidity**:

1. A clear documentation hierarchy that AI assistants can reference
2. A session-based workflow that captures progress and decisions
3. Adaptive setup that fits the project's reality
4. Generated commands tailored to tech stack and team workflow

## Core Principles

### 1. Specs Before Code

Define *what* before *how*. AI assistants work best when given clear requirements, not vague directions.

- Start with a PRD (what problem, for whom, what features)
- Derive a Tech Spec (how it will be built)
- Let implementation flow from these foundations

**Exception**: In adoption mode, existing code *is* the spec. Document what exists before changing it.

### 2. Three Layers of Documentation

Not all documentation changes at the same rate. SpecFlow uses three layers:

| Layer | Changes | Purpose | Examples |
|-------|---------|---------|----------|
| **Strategic** | Rarely | North star, major decisions | VISION.md, ADR.md |
| **Tactical** | Per milestone | Current state, plans | OVERVIEW.md, ROADMAP.md |
| **Operational** | Every session | Session tracking, AI guidance | SESSION_LOG.md, agent guides |

This prevents both stale docs (everything frozen) and doc churn (everything changes constantly).

See [DOCUMENTATION.md](DOCUMENTATION.md) for details.

### 3. Session-Based Work

Work happens in **sessions** - focused units with:
- A clear goal (one task from the roadmap)
- A defined workflow (plan → implement → wrap up)
- A recorded outcome (session log entry)

Sessions provide:
- **Context continuity** - Previous sessions are readable history
- **Progress visibility** - Clear record of what happened
- **Natural checkpoints** - Good times to commit, review, pivot

See [SESSIONS.md](SESSIONS.md) for the session lifecycle.

### 4. Adaptive, Not Rigid

The framework adapts to the project, not vice versa:

- **Greenfield projects** get full PRD → Tech Spec → Docs flow
- **Constrained PoCs** start with constraints, validate tech choices
- **Existing projects** absorb what exists, add structure incrementally

Setup asks questions to determine what's needed. Nothing is assumed.

### 5. No Manual Metrics

Humans (and AI) should not manually maintain:
- Test counts
- Coverage percentages
- Lines of code
- Velocity numbers

These either come from CI/automation or don't exist. Manual metrics are lies waiting to happen.

### 6. Code is Truth, Docs Must Follow

When code and documentation disagree:
1. **Code is assumed correct** (it's what actually runs)
2. **Docs must be updated** to reflect reality
3. **Never silently ignore drift** - flag it, fix it

This prevents the common failure mode of beautiful docs that describe a system that doesn't exist.

### 7. Decisions Are Append-Only

Architecture Decision Records (ADRs) are append-only:
- Never modify past decisions
- Add new decisions that supersede old ones
- Maintain the historical record

This preserves the *why* behind the codebase.

### 8. Ask, Don't Assume

When requirements or decisions are unclear:
- **AI assistants must ask** for clarification
- **Never invent** facts, metrics, or requirements
- **Use TODO placeholders** for genuinely unknown items

It's better to have explicit unknowns than confident fiction.

## What SpecFlow Is Not

- **Not a code generator** - It structures the process, not the output
- **Not a project management tool** - It complements your existing workflow
- **Not a replacement for thinking** - It helps you think more clearly
- **Not one-size-fits-all** - It adapts to your context

## Philosophy Summary

> Structure enables creativity. Guardrails prevent chaos. Documentation is memory. Sessions are rhythm.

SpecFlow gives AI assistants (and humans) the context they need to do good work, session after session, without losing the thread.
