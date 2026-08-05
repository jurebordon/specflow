# Git Workflow

> Follow these conventions for all git operations.

Branch and convention values come from `.specflow/config.md` under
`## Git Workflow`. Read them there.

## Branches

- Create branches from the branch named in `Git Workflow > Default Branch`,
  using the pattern in `Git Workflow > Branch Convention`.
- **Never assume the default branch is `main`.** Projects use `master`,
  `develop`, `trunk` and others. A guard that checks for `main` silently passes
  on a project that uses something else — which defeats the guard.
- Examples: `feat/add-search`, `fix/null-pointer`, `refactor/auth-module`.
- Keep branches short-lived. One feature or fix per branch.

## Commits

- Follow `Git Workflow > Commit Convention`. Where that is `conventional`:
  `type: concise description` — lowercase, imperative mood, no trailing period.
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
- Make atomic commits. Each commit should compile and pass tests.
- Add a co-author line for AI-assisted work.

## Ticket references

If `Integrations > Ticketing` is anything other than `none`, include a ticket
reference in the commit body using the pattern in `Integrations > Ticket
Format`, and reference tickets in PR/MR descriptions.

## Pre-commit checks

Run every command listed under `## Commands` in the config — `### Test`,
`### Lint`, `### Build` — before committing.

**Run all entries in each list, not the first one.** These are lists precisely
because one command rarely covers a whole project: a repo with a backend and a
frontend has two test commands, and running only one means shipping a suite
nobody executed.

Fix failures before committing. Do not commit broken code.

Before treating a failure as pre-existing, check it against
`## Known Test Failures` — and check it properly: compare the observed failure
**message** against the recorded one. A test in that list can still break for a
new reason, and matching on the test's path alone will wave a real regression
through.

## Solo workflow

When `Git Workflow > Type` is `solo`:

- Work on feature branches, merge to the default branch when tests pass.
- Push frequently to keep the remote in sync.
- Delete branches after merging.
- No PR required for small fixes.

## Team workflow

When `Git Workflow > Type` is `team`:

- Always work on feature branches. Never commit directly to the default branch.
- Push the branch and open a PR/MR with a summary of changes and a test plan.
- Wait for review before merging. Do not self-merge unless explicitly allowed.
- Keep PRs small and focused. Split large changes into stacked PRs.
- Where CI runs, do not merge until the pipeline passes. Rebase on the default
  branch if behind, rather than adding merge commits.
