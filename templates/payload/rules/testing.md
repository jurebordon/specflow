# Testing

> Follow these standards for all test code.

## Commands

Test, lint and typecheck commands are listed in `.specflow/config.md` under
`## Commands`. Each is a **list**. Run every entry, not the first one — a
project with a backend and a frontend has more than one suite, and running one
of them is not running the tests.

Every entry runs from the repository root.

## When to test

- Run tests before every commit. Do not commit if tests fail.
- Add tests alongside new features and bug fixes.
- Run the full suite after refactoring, even when changes seem safe.

## Known failures

`## Known Test Failures` in the config records failures that predate your work.
Before attributing a failure to it:

1. Read the observed failure's **message**.
2. Compare it against the recorded `Message` for that test.
3. Only if they match is it pre-existing.

**Never match on test path alone.** A test in that list can break for a new
reason, and its presence there is not a licence to skip reading the output. An
incomplete rename once broke two tests in a file marked known-flaky; because
nobody read the messages, the regression reached the branch looking like
existing noise.

If the message differs, or the test is not listed, the failure is yours.

## Renames and sweeps

When a change renames a symbol, string or file, sweep for **every** occurrence
before declaring it done:

- Search **case-insensitively**. A case-sensitive grep for a renamed UI string
  missed two test files in a real batch, which is how the regression above
  reached the branch.
- Search test files and fixtures, not just source.
- Check for the name split across lines or built by concatenation.

## Test quality

- Test behaviour, not implementation details. Tests should survive refactoring.
- One assertion concept per test. The name should describe what is verified.
- Use descriptive names: `test_expired_token_returns_401`, not `test_auth_3`.
- Cover edge cases: empty inputs, nulls, boundary values, error paths.
- Never write flaky tests. If a test depends on timing or external state, mock
  it. A flaky test is a future silent regression.
- Keep tests fast. Slow tests get skipped.

---

## Language-specific guidance

Apply the sections matching `Tech Stack > Languages` in the config. Ignore the
rest.

### Python

- Use pytest with fixtures for setup and teardown.
- Organize tests: `tests/unit/` and `tests/integration/`.
- Use `@pytest.mark.parametrize` for multiple inputs.
- Use `unittest.mock.patch` or `pytest-mock` for external dependencies.
- Name test files `test_*.py` and test functions `test_*`.

### TypeScript

- Use the project's configured test runner.
- Mock external dependencies (APIs, databases, file system).
- For React components, prefer `@testing-library/react` with `user-event`.
- Test component behaviour from the user's perspective, not internal state.
- Use `describe` blocks to group related tests.

### Go

- Use table-driven tests for functions with multiple input/output combinations.
- Use `testify` for assertions and `require` for fatal checks.
- Run tests with `-race` to detect data races.
- Use `t.Parallel()` for independent tests.
- Place tests in `*_test.go` alongside the code they test.

### Rust

- `#[test]` for unit tests in-file; `tests/` for integration tests.
- Use `proptest` or `quickcheck` for property-based testing where appropriate.
- Test error cases explicitly with `assert!(result.is_err())`.
- Use `#[should_panic]` sparingly. Prefer testing `Result` values.
- Run `cargo test --all-features` to catch feature-gated issues.

### dbt

- Add `not_null` and `unique` tests to all primary keys.
- Add referential integrity tests between related models.
- Run `dbt test` after every model change.
