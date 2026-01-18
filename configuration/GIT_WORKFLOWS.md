# Git Workflows

> SpecFlow adapts to your git workflow. This document describes the supported patterns and how commands are generated for each.

## Supported Workflows

### 1. Solo Developer

Single developer with direct access to main branch.

```
main ◄────────── feature/branch
                      │
                      └── merge when ready
```

**Characteristics**:
- No PR/MR required
- Direct merge to main
- Fast iteration

**Generated Commands**:

`end-session.md` includes:
```bash
# Merge to main
git checkout main
git pull origin main
git merge feature/branch-name
git push origin main
git branch -d feature/branch-name
```

Or via helper script:
```bash
./scripts/merge-to-main.sh
```

**merge-to-main.sh template**:
```bash
#!/bin/bash
set -e

BRANCH=$(git branch --show-current)

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "[ERROR] Already on main branch"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "[ERROR] Uncommitted changes exist"
  exit 1
fi

echo "[INFO] Merging $BRANCH to main..."
git checkout main
git pull origin main
git merge "$BRANCH"
git push origin main

echo "[INFO] Cleaning up..."
git branch -d "$BRANCH"

echo "[OK] Merged and cleaned up"
```

---

### 2. PR Review (GitHub/GitLab/Bitbucket)

Team workflow requiring pull/merge request review.

```
main ◄──── PR Review ◄──── feature/branch
                │
                └── requires approval
```

**Characteristics**:
- PR/MR required for merge
- Review before merge
- No direct push to main

**Generated Commands**:

`end-session.md` includes:
```bash
# Push branch and create PR
git push -u origin feature/branch-name

# GitHub
gh pr create --title "feat: description" --body "Summary of changes"

# GitLab
glab mr create --title "feat: description" --description "Summary of changes"
```

**Important**: Commands do NOT merge. Merge happens after review via platform UI or CI.

**PR Template** (optional):
```markdown
## Summary
- What was changed

## Test Plan
- How to verify

## Related
- Ticket: #123
- ADR: ADR-XXX (if applicable)
```

---

### 3. CI/CD Gated

Automated merge via CI/CD pipeline after approval.

```
main ◄──── CI/CD Pipeline ◄──── MR Approval ◄──── feature/branch
                  │                    │
                  │                    └── human approval
                  └── automated merge, deploy
```

**Characteristics**:
- MR/PR triggers pipeline
- Automated checks must pass
- Merge is automated (not manual)
- May auto-deploy on merge

**Generated Commands**:

`end-session.md` includes:
```bash
# Push branch and create MR
git push -u origin feature/branch-name

# GitLab CI example
glab mr create \
  --title "feat: description" \
  --description "Summary of changes" \
  --remove-source-branch

# Then wait for pipeline and approval
```

**Important**:
- NO local merge commands
- NO merge instructions
- Merge happens via CI/CD after approval

**Status Check** (optional command):
```bash
# Check pipeline status
glab mr view

# Or
gh pr checks
```

---

## Branch Naming Conventions

### Standard Convention

```
type/short-description
```

Types:
- `feat/` - New feature
- `fix/` - Bug fix
- `refactor/` - Code restructuring
- `docs/` - Documentation
- `test/` - Test additions
- `chore/` - Maintenance

Examples:
- `feat/user-authentication`
- `fix/login-redirect`
- `refactor/api-cleanup`

### Ticket-Based Convention

```
TICKET-123-short-description
```

or

```
type/TICKET-123-description
```

Examples:
- `JIRA-456-add-export`
- `feat/GH-123-user-auth`

---

## Commit Message Conventions

### Conventional Commits

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
```
feat(auth): add password reset flow

Implements forgot password and reset functionality.
Sends email via SendGrid integration.

Closes #123
```

```
fix(api): handle null user in response

Previously threw 500 when user was deleted.
Now returns 404 with appropriate message.
```

### Simple Format

```
type: description
```

Examples:
```
feat: add user authentication
fix: resolve login redirect issue
docs: update API documentation
```

---

## Workflow Decision Guide

| Situation | Recommended Workflow |
|-----------|---------------------|
| Solo side project | Solo |
| Solo but want history of changes | Solo with good commits |
| Small team, trust-based | PR Review (optional approval) |
| Team with quality gates | PR Review (required approval) |
| Enterprise/compliance | CI/CD Gated |
| Open source | PR Review |
| Production system | CI/CD Gated |

---

## Customization Points

### Solo Workflow
- Default branch name (main/master/develop)
- Whether to use merge script or manual commands

### PR Review Workflow
- Platform (GitHub/GitLab/Bitbucket)
- Required reviewers (number or specific)
- PR template content
- Auto-assign reviewers

### CI/CD Gated Workflow
- Platform and commands
- Pipeline requirements
- Auto-merge settings
- Branch protection rules

---

## Changing Workflow

If your workflow changes (e.g., from solo to team):

1. Run `/pivot-session`
2. Update git workflow configuration
3. Commands will be regenerated
4. Update WORKFLOW.md to reflect new process

---

## Platform-Specific Commands

### GitHub

```bash
# Create PR
gh pr create --title "title" --body "body"

# Create PR with reviewers
gh pr create --title "title" --reviewer username

# Check PR status
gh pr status

# View PR checks
gh pr checks
```

### GitLab

```bash
# Create MR
glab mr create --title "title" --description "body"

# Create MR with options
glab mr create \
  --title "title" \
  --assignee username \
  --remove-source-branch

# Check MR status
glab mr view

# List pipelines
glab pipeline list
```

### Bitbucket

```bash
# Using Bitbucket CLI or API
# Commands vary by tool used
```

---

## Merge Conflict Handling

All workflows:

1. **Detect conflict**
   ```bash
   git pull origin main  # or during merge
   # CONFLICT message appears
   ```

2. **Resolve conflict**
   - Open conflicted files
   - Choose correct changes
   - Remove conflict markers

3. **Complete merge**
   ```bash
   git add .
   git commit -m "resolve merge conflicts"
   ```

4. **Continue with workflow**
   - Solo: push to main
   - PR/MR: push to branch, conflicts resolved
