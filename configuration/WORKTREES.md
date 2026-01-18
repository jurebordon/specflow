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
│   ├── docs/
│   │   ├── ROADMAP.md
│   │   ├── SESSION_LOG.md
│   │   └── features/
│   └── src/
│
├── my-app-user-auth/          # Worktree (feat/user-auth)
│   ├── CLAUDE.md
│   ├── docs/
│   │   ├── ROADMAP.md
│   │   ├── SESSION_LOG.md
│   │   └── features/
│   │       └── user-auth/
│   │           ├── SPEC.md
│   │           ├── ROADMAP.md
│   │           └── SESSION_LOG.md
│   └── src/
│
└── my-app-api-v2/             # Worktree (feat/api-v2)
    ├── CLAUDE.md
    ├── docs/
    │   └── features/
    │       └── api-v2/
    └── src/
```

---

## Session Log Format

To avoid merge conflicts, session entries should include a feature identifier:

```markdown
## [feature-name] 2024-01-15

**Task**: Implement user authentication
**Branch**: feat/user-auth

### Summary
- Added login endpoint
- Created JWT token generation

### Next
- Add password reset flow

---
```

This format ensures:
- Entries from different features don't conflict on merge
- Git can auto-merge when both add at top of file
- Easy to filter/search by feature

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
cat docs/features/feature-b/ROADMAP.md
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
- Feature's `docs/features/feature-name/` merges in
- PROJECT-level `SESSION_LOG.md` entries merge (with feature prefix, no conflicts)
- Feature-specific SESSION_LOG stays in feature folder

### Handling Conflicts

If conflicts occur in docs:
1. Keep both entries (they're history)
2. Reorder chronologically if needed
3. Feature-prefixed entries should rarely conflict

### After Merge

The main branch now has:
- Completed feature code
- Feature documentation in `docs/features/feature-name/`
- Session history from both main and feature work

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

1. **Detect parallelizable work**: If ROADMAP.md has multiple independent "Now" items, suggest worktrees
2. **Context awareness**: Check if you're in main or a feature worktree
3. **Suggest worktree creation**: When user is blocked or wants to switch focus
4. **Feature-scoped sessions**: Always use `--feature` flag when in a feature worktree

Example suggestion:
```
I notice ROADMAP.md has two independent tasks in "Now":
- User authentication (no dependencies)
- API rate limiting (no dependencies)

These could be developed in parallel using git worktrees. Would you like me to help set up a worktree for one of these features?
```
