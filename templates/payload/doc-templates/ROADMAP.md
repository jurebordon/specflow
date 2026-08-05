# Roadmap

**Last Updated**: <current date>
**Current Phase**: <current phase>

## Now (Current Work)

<!-- Tag each task with [feature: name] -->
- [ ] <current task> [feature: <feature name>]

## Next (Queued)

<!-- Priority ordered - top item is next -->
<!-- Tag each task with [feature: name] -->

1. <item> [feature: <feature name>]

## Later (Backlog)

<!-- Ideas and future work, not prioritized -->

- <item>

## Done (Recent)

<!-- Recently completed, for context -->

- [x] <task> (<date>)

## Blockers

<!-- Anything preventing progress -->

- **<id>**: <description>
  - Impact: <impact>
  - Potential resolution: <resolution>

---

## Notes

- Tasks should be small enough to complete in 1-2 sessions
- Move items between sections as priorities change
- Add blockers immediately when encountered
- Reference tasks by ID in SESSION_LOG entries
- **Feature tagging**: Every task must be tagged with `[feature: name]`
  - Example: `- [ ] Add login endpoint [feature: user-auth]`
  - Use `[feature: infrastructure]` for project-wide work (upgrades, refactors, etc.)
  - AI agents use feature tags to filter tasks when planning sessions
