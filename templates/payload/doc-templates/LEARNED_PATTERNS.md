# Learned Patterns

> Patterns discovered during development sessions. AI assistants read this to avoid repeating mistakes and to reuse proven solutions.
> Tag each entry with its feature name in square brackets, for filtering.

---

## Codebase Patterns

<!-- Recurring code patterns, idioms, and conventions discovered in this project -->

### <name> [feature: <feature>]
- **Pattern**: <description>
- **Example**: `<example>`
- **Discovered**: <date>

## Anti-Patterns

<!-- Things that don't work in this codebase - avoid repeating these mistakes -->

<!-- Example:
<!--
  EXAMPLES — delete this whole section once you have real entries. They are here
  to show the shape, and they describe a project that is not yours.
-->

### Don't use relative imports across modules
- **Problem**: Causes circular dependency issues with the bundler
- **Instead**: Use path aliases (`@/services/auth`)
- **Discovered**: 2026-01-21
-->

## Conventions

<!-- Project-specific conventions that aren't obvious from the code -->

<!-- Example:
### API responses always wrapped in envelope
- **Convention**: `{ data: T, meta: { timestamp, requestId } }`
- **Applies to**: All REST endpoints
- **Discovered**: 2026-01-19
-->

## Performance Notes

<!-- Performance-related discoveries and optimizations -->

<!-- Example:
### Database queries must use index on tenant_id
- **Context**: Multi-tenant setup, unindexed queries cause full table scans
- **Rule**: Every WHERE clause must include tenant_id
- **Discovered**: 2026-01-22
-->

## Tool & Environment Notes

<!-- Build tool quirks, CI/CD gotchas, environment-specific behaviors -->

<!-- Example:
### CI uses Node 18 but local uses Node 20
- **Impact**: Optional chaining in tests passes locally but fails in CI
- **Workaround**: Target ES2020 in tsconfig
- **Discovered**: 2026-01-23
-->

---

## How to Add Entries

When you discover a pattern during a session:
1. Add it under the appropriate section above
2. Tag it with the feature you are working on, in square brackets
3. Include a concrete example or code snippet
4. Note the discovery date

AI assistants should suggest adding entries when they:
- Encounter a non-obvious convention for the second time
- Fix a bug caused by a pattern violation
- Discover a performance-critical constraint
- Find a workaround for a tool/environment quirk
