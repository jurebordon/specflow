# Security

> Follow these rules to prevent security vulnerabilities.

## Secrets and credentials

- Never commit secrets, API keys, tokens, or passwords to the repository.
- Never hardcode credentials. Use environment variables or a secrets manager.
- Do not read, output, or log the contents of `.env`, `*.pem`, `*.key`,
  `credentials.*`, or `*secret*` files.
- If a secret is accidentally committed, alert the user immediately. Do not just
  delete it — it is in history and must be rotated.
- Use `.gitignore` to exclude sensitive files. Verify before every commit.

## Input and data

- Validate and sanitize all external input. Never trust user-provided data.
- Use parameterized queries. Never construct SQL by string concatenation.
- Escape output to prevent injection (XSS, SQL injection, command injection).
- Apply least privilege for file access, API permissions, and database roles.

## Dependencies

- Keep dependencies updated. Known vulnerabilities in old versions are
  exploitable.
- Never disable SSL/TLS verification, even in development.
- Review new dependencies before adding them. Prefer well-maintained,
  widely-used libraries.

## General awareness

- Follow OWASP Top 10 guidelines for web applications.
- Log security-relevant events (auth failures, permission denials) but never log
  secrets.
- Use HTTPS for all external communication.

---

## Language-specific guidance

Apply the sections matching `Tech Stack > Languages` in the config. Ignore the
rest.

### Python

- Use the `secrets` module for tokens and random values, not `random`.
- Use parameterized queries with your ORM or `cursor.execute(query, params)`.
- Validate input with Pydantic or similar schema validation.
- Never use `eval()`, `exec()`, or `pickle.loads()` on untrusted data.

### TypeScript

- Sanitize all HTML output to prevent XSS. Use framework-provided escaping.
- Validate request payloads with schema libraries (zod, joi, yup).
- Use `Content-Security-Policy` headers in web applications.
- Never use `innerHTML` or `dangerouslySetInnerHTML` with unsanitized input.

### Go

- Use `crypto/subtle.ConstantTimeCompare` for secret comparison, not `==`.
- Avoid the `unsafe` package without documented justification.
- Use `html/template` (not `text/template`) for HTML output.
- Set timeouts on all HTTP clients and servers.

### Rust

- Do not use `unsafe` blocks without a clear justification comment.
- Validate all inputs at system boundaries before processing.
- Use the `secrecy` crate for sensitive values to prevent accidental logging.
- Prefer safe abstractions over raw pointer manipulation.
