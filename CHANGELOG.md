# Changelog

## 2.0.0

Skills install once per machine instead of being rendered into every project.
Every skill reads project facts from one file, `.specflow/config.md`, at runtime.

**This is a breaking change for 1.x projects.** See [MIGRATION.md](MIGRATION.md).

### Why

Three problems with the 1.x model:

- A skill improvement had to be reinstalled into every project before it took
  effect.
- `specflow update` overwrote project skills wholesale, destroying local edits.
- Skills could not be shared from `~/.claude/skills/`, which Claude Code loads
  for every project.

### Changed

| | 1.x | 2.0 |
|---|---|---|
| Skills | Rendered per project into `.claude/skills/` | Installed once into `~/.claude/skills/`, verbatim |
| Project values | Substituted at install time | Read at runtime from config |
| Config | `docs/.specflow-config.md` | `.specflow/config.md`, a fixed anchor |
| Commands | One per category | A list per category |
| Setup | `specflow init` (CLI) | `specflow-init` (a skill, run by an agent) |
| `specflow update` | Overwrote project skills | Updates the machine install only |

### Added

- **Failure baseline** — `## Known Test Failures`, recorded with each failure's
  message. Attributing a failure to it by test path alone is forbidden.
- **Review gates** — `codex`, `subagent` or `none`, probed at init.
- **`plan-autonomous-batch`** — clears a whole feature tag hands-off through
  review gates. **Never yet run end to end; treat as experimental.**
- **`new-feature`** carried over from 1.x, config-driven.
- Deterministic migration (`migrate-config.js`) rather than improvisation.
- 157 tests, no dependencies (`npm test`).

### Removed

- `specflow init` — project setup is the `specflow-init` skill.
- `explore-project`, `new-worktree`, `pivot-session`, `verify` — unused in
  practice; Claude Code's own worktree support supersedes `new-worktree`.

### Notes

Machine-level skills take precedence over project-level ones. A 1.x project's
skills go inert as soon as 2.0 is installed, before any migration is run.

## 1.3.2 and earlier

See the git history.
