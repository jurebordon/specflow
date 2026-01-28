# Migration Guide

> For users upgrading from SpecFlow versions before the 2026-01-20 refactoring.

---

## What Changed

The 2026-01-20 refactoring ([ADR-007](../docs_specflow/ADR.md)) simplified SpecFlow from a multi-option system to a single, opinionated structure. Key changes:

| Area | Before | After |
|------|--------|-------|
| **Config location** | `.specflow-config.md` at project root | `docs_specflow/.specflow-config.md` |
| **Docs folder** | Configurable (`docs/`, `docs_specflow/`, custom) | Always `docs_specflow/` |
| **Doc depth** | Minimal / Standard / Full | Always full set |
| **Doc organization** | Central or per-feature | Central with `[feature: name]` tags |
| **Feature tracking** | Per-feature ROADMAP/SESSION_LOG in `docs/features/` | Single ROADMAP.md + SESSION_LOG.md with feature tags |
| **Feature specs** | Per-feature full doc set | `feature_docs/<name>/SPEC.md` only (frozen north star) |
| **Agent path** | `.ai/agents/` | `.claude/agents/` |
| **Tech commands** | Manual configuration | Auto-detected (TEST/BUILD/LINT/FORMAT/TYPECHECK) |
| **Technical layers** | Not available | Hooks, rules, statusline (opt-in) |
| **Installation** | Manual git clone only | CLI (`npx specflow-ai init`) or manual |

---

## Prerequisites

Update your local SpecFlow clone to get the latest templates:

```bash
cd your-project/.specflow
git pull
```

Or use the CLI instead of migrating manually:

```bash
# The CLI handles everything — recommended for most users
npx specflow-ai init
```

> **Note**: The CLI will detect an existing project and ask before overwriting files. However, it creates a fresh setup rather than migrating in place. If you have significant content in your existing docs, follow the manual steps below to preserve it.

---

## Manual Migration Steps

### Step 1: Create the New Docs Folder

```bash
mkdir -p docs_specflow/feature_docs
```

### Step 2: Move Configuration

Move `.specflow-config.md` from project root into `docs_specflow/`:

```bash
mv .specflow-config.md docs_specflow/.specflow-config.md
```

Then update the config file contents. Add these fields if missing:

```markdown
## Tech Stack
- **Languages**: [your languages]
- **Frameworks**: [your frameworks]
- **Test Command**: [e.g., pytest / npm test]
- **Build Command**: [e.g., npm run build]
- **Lint Command**: [e.g., ruff check . / eslint .]

## Technical Layers
- **Hooks**: disabled
- **Rules**: disabled
- **Statusline**: disabled
- **Format Command**: [e.g., ruff format . / npx prettier --write .]
- **Typecheck Command**: [e.g., mypy . / npx tsc --noEmit]
```

See `.specflow/configuration/TECH_STACKS.md` for command suggestions by language.

### Step 3: Migrate Documentation Files

Move your existing docs into `docs_specflow/`. The exact source path depends on your old configuration:

```bash
# Adjust the source path to match your old setup (docs/, docs_specflow/, etc.)
OLD_DOCS="docs"

mv "$OLD_DOCS/ROADMAP.md"      docs_specflow/ROADMAP.md
mv "$OLD_DOCS/SESSION_LOG.md"  docs_specflow/SESSION_LOG.md
mv "$OLD_DOCS/VISION.md"       docs_specflow/VISION.md
mv "$OLD_DOCS/ADR.md"          docs_specflow/ADR.md
mv "$OLD_DOCS/OVERVIEW.md"     docs_specflow/OVERVIEW.md
mv "$OLD_DOCS/WORKFLOW.md"     docs_specflow/WORKFLOW.md
```

If any of these files don't exist, generate them from templates:

```bash
# Templates are in .specflow/templates/docs/
ls .specflow/templates/docs/
```

### Step 4: Add Feature Tags to ROADMAP.md

Every task in your ROADMAP needs a `[feature: name]` tag. Use `[feature: infrastructure]` for project-wide work.

**Before:**
```markdown
## Now
- [ ] Add login endpoint
- [ ] Create user profile page
- [ ] Fix CI pipeline
```

**After:**
```markdown
## Now
- [ ] Add login endpoint [feature: user-auth]
- [ ] Create user profile page [feature: user-auth]
- [ ] Fix CI pipeline [feature: infrastructure]
```

Ensure your ROADMAP has these sections: **Now**, **Next**, **Later**, **Done**.

### Step 5: Add Feature Tags to SESSION_LOG.md

Session entries need the `[feature-name] YYYY-MM-DD` heading format.

**Before:**
```markdown
## 2026-01-15

### Goal
Implement login endpoint
```

**After:**
```markdown
## [user-auth] 2026-01-15

### Goal
Implement login endpoint
```

Entries also need at minimum: **Goal**, **Completed**, and **Files Changed** (or **Files Created** / **Files Modified**) sections.

### Step 6: Migrate Per-Feature Docs

If you had per-feature documentation directories (e.g., `docs/features/user-auth/`), consolidate them:

1. **SPEC.md** — Move to `docs_specflow/feature_docs/<name>/SPEC.md` (this is the only per-feature file in the new model)
2. **Per-feature ROADMAP** — Merge tasks into the central `docs_specflow/ROADMAP.md` with `[feature: name]` tags
3. **Per-feature SESSION_LOG** — Merge entries into the central `docs_specflow/SESSION_LOG.md` with `[feature-name]` heading prefix
4. **Other per-feature files** — Content can be merged into the central OVERVIEW.md, ADR.md, or WORKFLOW.md as appropriate

```bash
# Example: move feature specs
mkdir -p docs_specflow/feature_docs/user-auth
mv docs/features/user-auth/SPEC.md docs_specflow/feature_docs/user-auth/SPEC.md

# Remove old per-feature directories after merging content
rm -rf docs/features/
```

### Step 7: Update Agent Paths

If you have agent files in `.ai/agents/`, move them to `.claude/agents/`:

```bash
mkdir -p .claude/agents
mv .ai/agents/*.md .claude/agents/
# Clean up old directory
rm -rf .ai/agents
```

### Step 8: Regenerate Commands

Commands have been updated for the new structure. Regenerate them from templates:

**Option A — CLI:**
```bash
npx specflow-ai update
```

**Option B — Manual:**
Copy updated command templates from `.specflow/templates/commands/` to `.claude/commands/`, replacing the Handlebars variables with your project values.

### Step 9: Update .gitignore

Replace old gitignore entries with the new pattern:

```gitignore
# SpecFlow framework (gitignored tooling)
.specflow/

# SpecFlow docs (uncomment if you want docs gitignored)
# docs_specflow/
```

Remove any old entries like:
```gitignore
# Remove these
docs/
.specflow-config.md
.ai/
```

### Step 10: Update CLAUDE.md

Your `CLAUDE.md` should reference `docs_specflow/` instead of the old docs path. Key changes:

- Documentation paths: `docs/` → `docs_specflow/`
- Config path: `.specflow-config.md` → `docs_specflow/.specflow-config.md`
- Agent paths: `.ai/agents/` → `.claude/agents/`
- Add session commands: `/plan-session`, `/start-session`, `/end-session`, `/verify`

If your CLAUDE.md is heavily customized, update paths manually. Otherwise, regenerate it from the template.

### Step 11: Enable Technical Layers (Optional)

The new version supports hooks, rules, and a statusline. To enable them:

**Option A — CLI:**
```bash
npx specflow-ai init
# Answer "Yes" when asked about technical enforcement layers
```

**Option B — Manual:**
See `.specflow/templates/hooks/`, `.specflow/templates/rules/`, and `.specflow/templates/settings/` for the templates. Copy and customize them, then update `.claude/settings.json` to register hooks and statusline.

### Step 12: Clean Up

Remove files and directories that are no longer needed:

```bash
# Old docs directory (after confirming migration is complete)
rm -rf docs/

# Old per-feature templates (if copied from old SpecFlow)
rm -rf templates/features/

# Old config at project root (now in docs_specflow/)
rm -f .specflow-config.md
```

---

## Verification

After migration, run the verify command to check for issues:

```
/verify
```

This validates:
- All required files exist
- ROADMAP has proper feature tags and section structure
- SESSION_LOG entries have correct format
- Feature docs align with ROADMAP features
- Configuration has required fields
- Git health (uncommitted changes, branch naming)

---

## Template Variable Changes

If you manually edit templates, note these variable changes:

| Old Variable | New Variable / Value | Notes |
|---|---|---|
| `{{DOCS_PATH}}` | `docs_specflow` | Hardcoded, no longer configurable |
| `{{DOC_DEPTH}}` | *(removed)* | Always full doc set |
| `{{DOC_ORG}}` | *(removed)* | Always central with feature tags |
| *(new)* | `{{TEST_COMMAND}}` | Auto-detected from tech stack |
| *(new)* | `{{BUILD_COMMAND}}` | Auto-detected from tech stack |
| *(new)* | `{{LINT_COMMAND}}` | Auto-detected from tech stack |
| *(new)* | `{{FORMAT_COMMAND}}` | For auto-format hook |
| *(new)* | `{{TYPECHECK_COMMAND}}` | For type checking |
| *(new)* | `{{ENABLE_HOOKS}}` | Technical layers toggle |
| *(new)* | `{{ENABLE_RULES}}` | Technical layers toggle |
| *(new)* | `{{ENABLE_STATUSLINE}}` | Technical layers toggle |
| *(new)* | `{{AGENT_MODEL_*}}` | 8 agent model tier variables |

See `prompts/INIT.md` for the complete variable reference table.

---

## Troubleshooting

**Q: I have a lot of content in per-feature ROADMAP files. How do I merge them?**
Copy all tasks from each per-feature ROADMAP into the central `docs_specflow/ROADMAP.md`, adding `[feature: name]` tags. Group them under Now/Next/Later/Done sections. Move completed tasks to the Done section.

**Q: My session logs don't have feature prefixes. Do I need to update all old entries?**
Updating old entries is optional but recommended for consistency. At minimum, add feature prefixes to the most recent entries. The `/verify` command will warn about entries missing feature tags.

**Q: Can I keep my old docs path instead of `docs_specflow/`?**
The framework is standardized on `docs_specflow/`. Using a different path would require modifying all command templates, hooks, and rules. The CLI does not support custom paths.

**Q: I don't want technical layers. Can I skip them?**
Yes. Technical layers are opt-in. Set all three to `disabled` in your `.specflow-config.md` and don't generate the hooks/rules/statusline files.

---

*Last updated: 2026-01-27*
