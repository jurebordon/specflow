# Coding Style

> Follow these standards in all code changes.

## General

- Use descriptive names for variables, functions, and types. No abbreviations
  unless universally understood.
- Delete commented-out code. Use version control, not comments, to preserve old
  code.
- Keep functions small and focused. One function = one responsibility.
- Follow existing patterns in the codebase. Consistency beats personal
  preference.
- Prefer explicit over clever. Code is read far more than it is written.
- Handle errors at the appropriate level. Never swallow errors silently.

## Formatting

The formatter is listed in `.specflow/config.md` under `## Commands` →
`### Format`. Run it rather than hand-formatting.

---

## Language-specific guidance

Apply the sections matching `Tech Stack > Languages` in the config. Ignore the
rest.

### Python

- Add type hints to all function signatures and return types.
- Follow PEP 8. Use ruff for formatting and linting.
- Use f-strings, not `.format()` or `%`.
- Use `pathlib.Path` instead of `os.path` for file operations.
- Prefer comprehensions over loops for simple transformations.
- Use dataclasses or Pydantic models for structured data.
- Import order: stdlib, third-party, local (enforced by ruff).

### TypeScript

- Enable strict mode. No exceptions.
- Use `interface` for object shapes; `type` only for unions and intersections.
- Mark properties `readonly` when they should not change after construction.
- Never use `any`. Use `unknown` with type guards if the type is truly unknown.
- Use named exports, not default exports.
- Prefer `const` over `let`. Never use `var`.
- Use `??` and `?.` over manual null checks.

### Go

- Run `gofmt` and `go vet` on all code. Non-negotiable.
- Always check returned errors. Never use `_` for error values.
- Keep interfaces small (1–3 methods). Accept interfaces, return structs.
- Use meaningful receiver names.
- Prefer early returns to reduce nesting.
- Use `context.Context` as the first parameter for cancellable operations.

### Rust

- Run `cargo clippy` and fix all warnings before committing.
- Use `Result` and `?` instead of `panic!` or `unwrap()`.
- Use `thiserror` for library errors, `anyhow` for application errors.
- Derive `Debug`, `Clone`, `PartialEq` where sensible.
- Prefer iterators and combinators over manual loops.
- Use `impl Trait` in signatures for cleaner APIs.

### Ruby

- Add `# frozen_string_literal: true` to every file.
- Follow Rubocop conventions. Fix all warnings before committing.
- Use keyword arguments for methods with more than two parameters.
- Prefer `each` and `map` over `for` loops.

### Java

- Prefer immutability: `final` fields, unmodifiable collections.
- Use the builder pattern for objects with many constructor parameters.
- Keep classes focused. Follow the single responsibility principle.
- Use `Optional` instead of returning null.
- Write meaningful Javadoc on public APIs.
