# New Feature

> Create a new feature SPEC and add tasks to ROADMAP for SpecFlow development.

---

## Step 1: Gather Feature Information

Ask the user:

1. **Feature name?** (kebab-case, e.g., `cli-tool`, `mcp-integration`, `vscode-extension`)

2. **What is this feature?**
   - Brief description
   - Why is it needed?
   - Target users

3. **What are the requirements?**
   - Key functionality
   - Templates/prompts to create or modify
   - Dependencies on existing structure

4. **Success criteria?**
   - How will we know it's done?
   - What validation is needed?

---

## Step 2: Create Feature SPEC

Create `docs_specflow/feature_docs/{{FEATURE_NAME}}/SPEC.md`:

```markdown
# Feature: {{FEATURE_NAME}}

> Frozen north star for this feature.

---

## Requirements (Frozen)

### Overview
[What this feature does and why it exists]

### User Stories
- As a SpecFlow user, I want [goal] so that [benefit]

### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Out of Scope
[What this feature explicitly does NOT include]

---

## Implementation Decisions

> Document decisions as you build. Major changes → also add to central ADR.md

### Technical Approach
[High-level approach - to be filled during implementation]

### Key Decisions
- **[Decision]**: [Rationale]

---

## Dependencies

### Upstream
[Features or components this depends on]

### Downstream
[Features that depend on this]

---

## Success Criteria

### Functional
- [ ] [Measurable criterion]

### Non-Functional
- [ ] Documentation: Clear examples and instructions
- [ ] Validation: Manual testing completed

---

## Open Questions

- [ ] [Unresolved question 1]
- [ ] [Unresolved question 2]

---

*Created*: {{DATE}}
```

---

## Step 3: Add Tasks to ROADMAP

Update `docs_specflow/ROADMAP.md`:

Break feature into tasks and add to appropriate section (Now/Next/Later):

```markdown
## Now
- [ ] [First task for {{FEATURE_NAME}}] [feature: {{FEATURE_NAME}}]

## Next
1. [Second task for {{FEATURE_NAME}}] [feature: {{FEATURE_NAME}}]
2. [Third task for {{FEATURE_NAME}}] [feature: {{FEATURE_NAME}}]
```

**Important**: Every task MUST have `[feature: {{FEATURE_NAME}}]` tag.

---

## Step 4: Create Feature Branch

```bash
git checkout main && git pull
git checkout -b feat/{{FEATURE_NAME}}
```

---

## Step 5: Summarize

Provide summary to user:

```
Feature created: {{FEATURE_NAME}}

**Created**:
- docs_specflow/feature_docs/{{FEATURE_NAME}}/SPEC.md

**Updated**:
- docs_specflow/ROADMAP.md (added tasks with [feature: {{FEATURE_NAME}}] tags)

**Branch**: feat/{{FEATURE_NAME}}

**Next Steps**:
1. Review SPEC.md and confirm requirements
2. Run `/plan-session` to start working on first task
   - AI will automatically filter ROADMAP for [feature: {{FEATURE_NAME}}] tasks
3. Or manually update ROADMAP.md with more detailed tasks

**Working on this feature**:
- All your sessions will be tagged with [{{FEATURE_NAME}}] in SESSION_LOG.md
- All tasks should have [feature: {{FEATURE_NAME}}] tag in ROADMAP.md
- Update SPEC.md as decisions are made during implementation
```

---

## Notes

- Feature name should be kebab-case
- SPEC.md is the frozen north star - requirements shouldn't change often
- Implementation decisions get added to SPEC.md as you build
- Major decisions also go in central ADR.md
- Tasks live in central ROADMAP.md with feature tags
- Sessions live in central SESSION_LOG.md with feature tags
