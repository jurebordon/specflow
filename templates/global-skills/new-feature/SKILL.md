---
name: new-feature
description: >-
  Create a new feature with a frozen SPEC document and tagged tasks. Gathers
  feature information, writes the SPEC into the docs feature_docs directory,
  adds tagged tasks to the task file, and optionally creates a feature branch.
compatibility: Works with Claude Code, Codex CLI, and other Agent Skills-compatible tools
metadata:
  author: specflow
  config_schema: 1
---
# New Feature

> Create a feature SPEC and add tagged tasks to the central task file.

**Expected config schema: 1**

---

## Reading project config

Before doing anything else, read `.specflow/config.md` from the repository root.
This is the only place project facts come from. Do not detect a stack, derive a
test command, or infer a docs path — all of it is in that file.

**If the file does not exist**, stop and say:

> This project has not been initialised for SpecFlow. Run `specflow-init` to set
> it up.

Do not guess, do not half-run, and do not fall back to defaults. A skill that
invents `docs/ROADMAP.md` because it found no config will silently write to the
wrong file in a project that uses something else.

**If it exists**, compare `SpecFlow > Config Schema` in the file against the
schema this skill expects (stated above):

| Situation | What to do |
|---|---|
| The file's schema is **lower** | Migration is needed. Consult the migration manifest, apply only the changes it marks `auto`, and mention any `decision` items as deferrable. Then continue with the task. |
| The schemas are **equal** | Proceed. Write nothing to the config. |
| The file's schema is **higher** | This machine's SpecFlow is stale. Warn the user, proceed read-only, and change nothing. |

Three rules govern this, and none of them bend:

1. **Never lower `Config Schema`.** Recording a lower number relabels a newer
   config as older and destroys the mismatch signal permanently — the next run
   sees no problem to report.
2. **A no-op writes nothing.** The config is git-tracked. Writing it just to
   restamp a version produces a commit-worthy diff on every machine after every
   release, and a merge conflict on shared repos.
3. **Never let a migration hijack the session.** The user asked for the task in
   hand, not a setup interview. Auto-apply what is additive, offer the rest, and
   finish what was asked either way.

### Paths and conventions

- Resolve `<docs>` from `Documentation > Docs Path`, and write tasks to the file
  named by `Documentation > Tasks File`. Do not assume `ROADMAP.md`.
- Path values carry no trailing slash by convention, but **tolerate both**.

---

## Step 1: Gather feature information

Ask the user:

1. **Feature name?** kebab-case — `user-auth`, `api-v2`, `payment-integration`.
   This name is the feature tag, the SPEC directory and the branch suffix, so it
   is worth getting right up front.
2. **What is this feature?** Brief description, why it is needed, who it serves.
3. **What are the requirements?** Key functionality, inputs and outputs,
   dependencies on existing code.
4. **Success criteria?** How will we know it is done, and what validates it.
5. **Ticket reference?** — **only ask if `Integrations > Ticketing` is not
   `none`.** When it is set, show the pattern from `Integrations > Ticket
   Format` so the user knows the shape expected. Asking a project with no
   ticketing system for a ticket number is noise.

If the user supplies a spec, PRD or ticket, read it and use it instead of
interrogating them.

---

## Step 1b: Read before you write

**This is the step that decides whether the SPEC is worth anything.** Step 1
gives you five answers; the document you are about to write is declared frozen
the moment it lands. Writing it from those five answers alone produces the
skeleton with the user's words pasted in.

Before drafting, read what the project already says about this area:

- The architecture and domain docs under `<docs>` — especially anything
  describing the subsystem this feature touches
- The code it will interact with
- `<docs>/CUSTOM.md` for conventions and known gotchas
- Existing SPECs under `<docs>/feature_docs/`, for shape and for overlap

`plan-session` has a required reading list before it writes a *disposable* plan.
This skill writes the frozen one and had none. Bring back specifics: real
constraints, real interactions, real open questions. A SPEC whose Open Questions
are generic is a SPEC nobody will reread.

## Step 2: Create the feature SPEC

Write `<docs>/feature_docs/{{FEATURE_NAME}}/SPEC.md`.

**Create it, do not overwrite.** If the file already exists, stop and say so —
its requirements section is frozen, and a second run of this skill must not
silently replace a spec someone has been building against.

```markdown
# Feature: {{FEATURE_NAME}}

> Frozen north star for this feature.

---

## Requirements (Frozen)

### Overview
[What this feature does and why it exists]

### User Stories
- As a [user type], I want [goal] so that [benefit]

### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### Out of Scope
[What this feature explicitly does NOT include]

---

## Implementation Decisions

> Filled in as you build. Major decisions also go in the central ADR.

### Technical Approach
[To be filled during implementation]

### Key Decisions
- **[Decision]**: [Rationale]

---

## Dependencies

### Upstream
[Features or systems this depends on]

### Downstream
[Features or systems that depend on this]

---

## Success Criteria

### Functional
- [ ] [Measurable criterion]

### Non-Functional
- [ ] Performance: [metric]
- [ ] Security: [requirement]

---

## Open Questions

- [ ] [Unresolved question]

---

*Created*: {{CURRENT_DATE}}
```

Add a `*Ticket*:` line only when the project has ticketing configured and the
user supplied one.

> **If a hook blocks this write**, the file already exists. That guard is
> deliberate — frozen means frozen. Do not work around it; tell the user the
> feature already has a SPEC and ask whether they meant to amend it.

---

## Step 3: Add tasks to the task file

Break the feature into tasks and add them to the file named by
`Documentation > Tasks File`, under the appropriate section:

```markdown
## Now
- [ ] [First task] [feature: {{FEATURE_NAME}}]

## Next
1. [Second task] [feature: {{FEATURE_NAME}}]
2. [Third task] [feature: {{FEATURE_NAME}}]
```

**Every task must carry the `[feature: {{FEATURE_NAME}}]` tag.** Untagged tasks
are invisible to `plan-session`, which filters on exactly this — an untagged
task is a task nobody will be offered.

Append to the existing sections. Never rewrite tasks that are already there.

**One exception: retire the item this feature came from.** A backlog line like
"Decide whether to do X" is superseded the moment X becomes a feature with real
tasks. Leaving it produces a roadmap that lists the same work twice, in two
sections, at two levels of detail. Move it to Done with a pointer to the feature,
or delete it — and say which you did.

---

## Step 4: Create a feature branch

Read `Git Workflow > Branch Convention` from the config. It is a **pattern**,
not a prefix — typically something like `feat/description`. Substitute the
feature name for the descriptive part rather than appending to the whole
pattern, which would produce `feat/description/user-auth`.

For a convention of `feat/description` and a feature named `user-auth`, the
branch is `feat/user-auth`.

Then branch according to `Git Workflow > Type`:

**`solo`** — offer it; the user may prefer to keep working where they are.

Branch from the default branch, not from wherever you happen to be. Taking a
branch off an unrelated unmerged feature stacks this work on top of it.

```bash
git checkout <Git Workflow > Default Branch>
git checkout -b <branch>
```

**`team`** — create it from an up-to-date default branch:

```bash
git checkout <Git Workflow > Default Branch>
git pull
git checkout -b <branch>
```

Read the default branch from the config. **Never assume `main`** — a project on
`trunk` or `develop` would have the feature branched off whatever happened to be
checked out.

---

## Step 5: Summarise

```
Feature created: {{FEATURE_NAME}}

**Created**: <docs>/feature_docs/{{FEATURE_NAME}}/SPEC.md
**Updated**: <tasks file> — added tasks tagged [feature: {{FEATURE_NAME}}]
**Branch**: <branch, or "none — still on {{CURRENT_BRANCH}}">

**Next**:
1. Review the SPEC and confirm the requirements before building against them.
2. Commit the SPEC and the task file edit. This skill does not commit, and
   `start-session` expects a clean tree — leaving them uncommitted guarantees
   friction on the very next command.
3. Run `plan-session` — it will filter for [feature: {{FEATURE_NAME}}] tasks.
```

---

## Notes

- Feature names are kebab-case, and the same name is used for the tag, the SPEC
  directory and the branch. Consistency is what makes filtering work.
- The SPEC's requirements are frozen once written. Implementation decisions get
  appended to it as you build; major ones also go in the central ADR.
- Tasks live in the central task file with feature tags, not in per-feature
  files. Sessions likewise land in the central session log.
