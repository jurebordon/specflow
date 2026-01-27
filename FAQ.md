# Frequently Asked Questions

Common questions and troubleshooting for SpecFlow.

---

## General Questions

### What's the difference between SpecFlow and spec-kit?

| Aspect | SpecFlow | spec-kit |
|--------|----------|----------|
| Focus | Documentation + workflow | Specification → code |
| Installation | None (prompts only) | CLI tool required |
| Structure | `docs_specflow/` + `.claude/` | `.specify/` folder |
| Workflow | Session-based | Phase-based |
| Flexibility | Adapts to existing projects | Greenfield focused |

SpecFlow is lighter weight and adapts to how you already work, rather than imposing a rigid structure.

### Do I need to use Claude?

No. SpecFlow works with any AI assistant:
- Claude (Code, web, API)
- ChatGPT / GPT-4
- Cursor
- GitHub Copilot
- Any LLM that can follow prompts

The `.claude/commands/` folder is named for convenience but the prompts work anywhere.

### Can I use SpecFlow with an existing project?

Yes! That's what **Adoption Mode** is for. You don't need a PRD or tech spec - the framework adapts to document what already exists and adds structure incrementally.

### How much documentation should I create?

Start minimal:
- **CLAUDE.md** - Always (AI context)
- **ROADMAP.md** - Always (what you're working on)
- **SESSION_LOG.md** - Always (track progress)

Add more only when you need it. For solo projects, three files might be enough forever.

---

## Setup Questions

### The AI generated too much documentation. What do I do?

Delete what you don't need. SpecFlow suggests a structure, but you own it. Keep only what's useful:

```bash
# Keep only essentials for a simple project
rm docs_specflow/VISION.md docs_specflow/ADR.md
```

You can always add them back later.

### Can I customize the folder structure?

Yes. The suggested structure is:
```
docs_specflow/        # Documentation
.claude/commands/     # Session commands
.claude/agents/       # Role guides
```

But you can:
- Put everything in `docs_specflow/`
- Skip folders entirely

Just update references in CLAUDE.md.

### The setup prompt is too long. Is there a shorter version?

For quick setup, just answer these questions in chat:

```
I want to add SpecFlow to my project. Here's the context:
- Project type: [greenfield/constrained/adoption]
- Tech stack: [your stack]
- Git workflow: [solo/pr-review/ci-cd-gated]
- Ticketing: [none/github/jira/etc]

Generate a minimal CLAUDE.md, ROADMAP.md, and SESSION_LOG.md for this project.
```

---

## Session Workflow Questions

### Do I have to use sessions?

Sessions are a recommendation, not a requirement. They help by:
- Keeping work focused
- Creating a paper trail
- Making context transfer easier

But if you just want to code, code. Add session entries when it feels useful.

### What if a task spans multiple sessions?

That's fine. The task stays in "Now" across sessions. Each session log entry shows incremental progress:

```markdown
## Session: 2024-01-15
**Task**: Implement user authentication (part 1/3)
### Summary
- Set up auth middleware
- Created user model
### Next
- Add login/logout endpoints (part 2)
```

### I forgot to run /end-session. Now what?

Just add the session log entry manually. The important part is the record, not the ritual:

```markdown
## Session: 2024-01-15
**Task**: [what you worked on]
### Summary
- [what you did]
```

### Can I skip /plan-session?

Yes, if you already know what you're doing. /plan-session is useful when:
- Starting fresh
- Context-switching after a break
- Unsure what to work on

If you just finished a session and know the next step, go straight to /start-session.

---

## Git Workflow Questions

### I use a different git workflow than the three options

Customize the end-session command. The three workflows are:
1. **Solo** - Direct merge
2. **PR Review** - Create PR, wait for approval
3. **CI/CD Gated** - Create MR, no local merge

If yours is different, edit `.claude/commands/end-session.md` to match your actual process.

### I accidentally merged locally when I shouldn't have

If your workflow is CI/CD gated and you merged locally:
1. Don't push yet
2. Reset: `git reset --hard origin/main`
3. Push your feature branch properly
4. Create the MR through your normal process

### What if I need to work on multiple branches?

SpecFlow's "one task per session" is a guideline. For parallel work:
- Each branch can have its own session log entries
- Note the branch in each entry
- Use ROADMAP.md to track both tasks

---

## Documentation Questions

### ROADMAP.md is getting cluttered with done items

Periodically archive old items:
1. Keep only last 5-10 items in "Done"
2. Move older items to an archive file, or
3. Just delete them (git history has them)

### ADR.md has decisions that are no longer relevant

Never delete ADR entries. Instead, add a new entry that supersedes:

```markdown
## ADR-007: Switch from REST to GraphQL

- **Status**: Accepted
- **Supersedes**: ADR-002 (REST API design)

### Context
REST wasn't meeting our needs because...

### Decision
Moving to GraphQL...
```

### Do I need to keep PRD and TECH_SPEC in sync with reality?

No. `PRD_V0.md` and `TECH_SPEC_V0.md` are historical baselines. They show original intent.

Living reality goes in:
- **OVERVIEW.md** - What the system actually is
- **ADR.md** - Why things changed
- **VISION.md** - Current direction (if different from V0)

---

## Troubleshooting

### The AI keeps ignoring my constraints

Make constraints more prominent in CLAUDE.md:

```markdown
## ⚠️ CONSTRAINTS (READ FIRST)

Before ANY code change, verify:
- [ ] No AWS services (forbidden)
- [ ] No GPL dependencies (forbidden)
- [ ] Uses React 18+ (mandated)
```

Put constraints at the top, with emphasis.

### The AI wants to refactor everything

Add to CLAUDE.md:

```markdown
## Working Agreements

- Only change what's needed for the current task
- No drive-by refactoring
- If you see something to improve, add to ROADMAP backlog instead
```

### The AI doesn't know about recent changes

SESSION_LOG might be stale. Before starting:
```
Read the last 3 entries in SESSION_LOG.md to understand recent context.
```

Or explicitly tell it what changed since the last session.

### Generated commands don't match my project

Commands are templates. Edit them directly:
- `.claude/commands/start-session.md`
- `.claude/commands/end-session.md`

Replace placeholder commands (`{{TEST_COMMAND}}`) with your actual commands.

### I'm getting merge conflicts in documentation

SESSION_LOG.md is append-only (newest first), so conflicts are rare. If they happen:
1. Keep both entries
2. Order by date (newest first)
3. Commit the merge

For ROADMAP.md conflicts, choose the more current state.

---

## Best Practices

### How detailed should session logs be?

Enough to remind future-you (or an AI) what happened:
- **Too little**: "Fixed stuff"
- **Too much**: Line-by-line code changes
- **Just right**: "Added user auth endpoint. Used JWT with 24h expiry. Tests in test_auth.py"

### When should I create an ADR?

When you make a decision that:
- Affects architecture
- Has multiple valid alternatives
- Future-you will wonder "why did we do it this way?"

Not for routine coding decisions.

### How often should I do pivot sessions?

When:
- ROADMAP feels disconnected from reality
- You've been stuck on the same blockers for multiple sessions
- Product direction changed
- Tech stack changed

For active projects, maybe monthly. For stable projects, rarely.

### Should I use SpecFlow for tiny scripts?

Probably not. SpecFlow adds value when:
- Work spans multiple sessions
- You want to track decisions
- You're working with AI assistants regularly

For a 50-line script you'll write once, just write it.

---

## Contributing

### Found a bug or have a suggestion?

Open an issue at: [GitHub repo URL]

### Can I contribute examples for my stack?

Yes! We'd love examples for:
- Go projects
- Rust projects
- Mobile (React Native, Flutter)
- Infrastructure (Terraform, Pulumi)
- Other data tools (Airflow, Dagster)

Open a PR with your example in `examples/`.
