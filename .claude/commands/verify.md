# Verify

> Validate SpecFlow project health: check files, ROADMAP consistency, SESSION_LOG format, and template syntax.

---

## Step 1: Check Required Files

Verify all required SpecFlow files exist:

**Documentation** (in `docs_specflow/`):
- `docs_specflow/.specflow-config.md`
- `docs_specflow/ROADMAP.md`
- `docs_specflow/SESSION_LOG.md`
- `docs_specflow/ADR.md`

**Project Root**:
- `CLAUDE.md`
- `README.md`

**Commands** (in `.claude/commands/`):
- `plan-session.md`
- `start-session.md`
- `end-session.md`
- `verify.md`

**Templates** (in `templates/`):
- `templates/CLAUDE.md.template`
- `templates/commands/*.template` (at least plan-session, start-session, end-session, verify)
- `templates/docs/*.template` (ROADMAP, SESSION_LOG, VISION, ADR, OVERVIEW, WORKFLOW)

Report any missing files.

---

## Step 2: Validate ROADMAP Structure

Read `docs_specflow/ROADMAP.md` and check:

- Every task has a `[feature: name]` tag
- Has "Now", "Next", "Later" (or "Done") sections
- Completed tasks (`[x]`) in "Now" should be moved to "Done"
- "Now" section has at most 3-5 active tasks

Report warnings for any issues found.

---

## Step 3: Validate SESSION_LOG Format

Read `docs_specflow/SESSION_LOG.md` and check:

- Entries follow `## [feature-name] YYYY-MM-DD` heading format
- Each entry has at minimum: Goal, Completed, Files sections
- Feature names in SESSION_LOG match feature tags in ROADMAP

Report warnings for malformed entries or orphaned features.

---

## Step 4: Validate Template Syntax

Scan all `.template` files in `templates/` for:

- Valid Handlebars syntax: matching `{{#if}}` / `{{/if}}` pairs
- Valid Handlebars syntax: matching `{{#each}}` / `{{/each}}` pairs
- No unclosed blocks
- Variable references use `{{UPPERCASE_WITH_UNDERSCORES}}` convention

```bash
# Check for unclosed Handlebars blocks
for f in $(find templates/ -name "*.template"); do
  opens=$(grep -c '{{#if\|{{#each' "$f" 2>/dev/null || echo 0)
  closes=$(grep -c '{{/if}}\|{{/each}}' "$f" 2>/dev/null || echo 0)
  if [ "$opens" != "$closes" ]; then
    echo "WARN: $f has mismatched blocks (opens: $opens, closes: $closes)"
  fi
done
```

---

## Step 5: Validate JavaScript Files

Check all `.js.template` files and generated `.js` files for syntax:

```bash
# Check hook templates (substitute a dummy value for Handlebars vars first)
for f in templates/hooks/*.js.template templates/settings/*.js.template; do
  if [ -f "$f" ]; then
    # Create temp file with Handlebars vars replaced by placeholders
    sed 's/{{[^}]*}}/placeholder/g' "$f" > /tmp/specflow-check.js
    node --check /tmp/specflow-check.js 2>&1 || echo "ERROR: $f has syntax errors"
  fi
done
```

---

## Step 6: Git Health

```bash
git status
git log --oneline -5
```

Check:
- No uncommitted changes to SpecFlow docs (unless mid-session)
- Recent commits follow convention: `feat|fix|refactor|docs: description`

---

## Step 7: Report

Present summary:

```
SpecFlow Verification Report
=============================

Files:       [X/Y] required files present
ROADMAP:     [X] tasks, [Y] warnings
SESSION_LOG: [X] entries, [Y] warnings
Templates:   [X] checked, [Y] syntax issues
JS Files:    [X] checked, [Y] errors
Git:         [clean / X issues]

Warnings:
- [list any issues found]

Suggestions:
- [actionable fixes]
```

---

## Notes

- This command is read-only — no files are modified
- Good to run after `/end-session` or at the start of a new day
- SpecFlow has no automated tests — this is the closest equivalent
- Focus on errors first, then warnings
