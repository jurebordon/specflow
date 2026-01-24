# Git Worktrees for Parallel Features

> Use git worktrees to work on multiple features simultaneously without context switching overhead.

---

## When to Use Worktrees

Worktrees are ideal when:
- Two or more features have no dependencies on each other
- You need to switch between features frequently (reviews, blockers, priorities)
- You want isolated environments for each feature
- Different features need different local configurations

**AI agents should suggest worktrees** when they detect:
- Multiple "Now" items in ROADMAP.md that are independent
- A blocked feature where another could progress
- User mentions wanting to "park" current work for something else

---

## Setup

### Initial Worktree Creation

From your main repo:

```bash
# Ensure main is up to date
git checkout main && git pull

# Create worktree for feature
git worktree add ../project-feature-name -b feat/feature-name

# Navigate to worktree
cd ../project-feature-name
```

### With SpecFlow

After creating the worktree:

```bash
cd ../project-feature-name

# Initialize feature documentation
# (run /new-feature or manually create docs)
```

The feature docs live in the worktree and travel with the branch.

---

## Directory Structure

```
~/projects/
├── my-app/                    # Main worktree (main branch)
│   ├── CLAUDE.md
│   ├── docs_specflow/
│   │   ├── ROADMAP.md         # Central - tasks tagged [feature: name]
│   │   ├── SESSION_LOG.md     # Central - sessions tagged [feature-name]
│   │   └── feature_docs/
│   │       └── user-auth/
│   │           └── SPEC.md    # Feature requirements (frozen)
│   └── src/
│
├── my-app-user-auth/          # Worktree (feat/user-auth)
│   ├── CLAUDE.md
│   ├── docs_specflow/         # Same structure, diverged content
│   │   ├── ROADMAP.md
│   │   ├── SESSION_LOG.md
│   │   └── feature_docs/
│   └── src/
│
└── my-app-api-v2/             # Worktree (feat/api-v2)
    ├── CLAUDE.md
    ├── docs_specflow/
    └── src/
```

---

## Documentation Organization

SpecFlow uses **central documentation** with feature tags:

- **ROADMAP.md**: Single file with all tasks, tagged by feature `[feature: name]`
- **SESSION_LOG.md**: Single file with all sessions, prefixed by feature name `[feature-name]`

**Task format in ROADMAP.md**:
```markdown
## Now
- [ ] Fix authentication bug [feature: user-auth]
- [ ] Add API v2 endpoints [feature: api-v2]
```

**Session format in SESSION_LOG.md**:
```markdown
## [user-auth] 2024-01-15

### Goal
Fix authentication bug

### Completed
- Fixed token expiration logic
- Added test coverage
```

AI agents automatically filter tasks by detecting feature from the current branch name.

---

## Session Log Format

To avoid merge conflicts, prefix entries with feature name:

```markdown
## [user-auth] 2024-01-15

### Goal
Implement user authentication

### Completed
- Added login endpoint
- Created JWT token generation

### Next Session
- Add password reset flow

---
```

This format ensures:
- Entries from different worktrees don't conflict on merge
- Git can auto-merge when both add at top of file
- Easy to filter/search by feature name

---

## Workflow

### Starting Work on a Feature

1. Check if worktree exists: `git worktree list`
2. Navigate to worktree: `cd ../project-feature-name`
3. Run `/plan-session --feature feature-name`
4. Implement

### Switching Features

Simply change directories:
```bash
# From feature-a to feature-b
cd ../project-feature-b

# Check context
cat docs_specflow/ROADMAP.md
```

No stashing, no branch switching, no lost context.

### Completing a Feature

1. Run `/end-session` in the worktree
2. Create PR/MR from feature branch
3. After merge, clean up:
   ```bash
   cd ../project-main
   git worktree remove ../project-feature-name
   git branch -d feat/feature-name
   ```

---

## Merging Considerations

### Feature Documentation

When feature merges to main:
- `docs_specflow/ROADMAP.md` and `SESSION_LOG.md` merge with feature-tagged entries
- `docs_specflow/feature_docs/[feature-name]/SPEC.md` merges in (if created)
- Feature-prefixed session entries avoid merge conflicts

### Handling Conflicts

If conflicts occur in docs:
1. Keep both entries (they're history)
2. Reorder chronologically if needed
3. Feature-prefixed entries should rarely conflict

### After Merge

The main branch now has:
- Completed feature code
- Feature SPEC in `docs_specflow/feature_docs/[feature-name]/SPEC.md`
- Session history with feature prefix in `docs_specflow/SESSION_LOG.md`

---

## Common Commands

```bash
# List all worktrees
git worktree list

# Create worktree with new branch
git worktree add ../path -b branch-name

# Create worktree from existing branch
git worktree add ../path existing-branch

# Remove worktree (after merging)
git worktree remove ../path

# Prune stale worktree references
git worktree prune
```

---

## Best Practices

1. **Naming convention**: `project-feature-name` for worktree directories
2. **Keep main clean**: Main worktree should stay on main/master
3. **One feature per worktree**: Don't mix features in a single worktree
4. **Regular syncs**: Pull main into feature branches to avoid big merge conflicts
5. **Clean up promptly**: Remove worktrees after features merge

---

## AI Agent Guidance

When working with a user on a project using worktrees:

1. **Detect parallelizable work**: If ROADMAP.md has multiple independent "Now" items with different feature tags, suggest worktrees
2. **Context awareness**: Detect feature from branch name (e.g., `feat/user-auth` → `user-auth`)
3. **Suggest worktree creation**: When user is blocked or wants to switch focus
4. **Filter by feature**: Show only tasks tagged with the current feature

Example suggestion:
```
I notice ROADMAP.md has two independent tasks in "Now":
- User authentication [feature: user-auth]
- API rate limiting [feature: api-v2]

These could be developed in parallel using git worktrees. Would you like me to help set up a worktree for one of these features?
```
