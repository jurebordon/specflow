# Integrations

> Optional integrations that SpecFlow can adapt to. None are required.

## Ticketing Systems

SpecFlow can reference tickets in documentation and commits.

### Supported Systems

| System | Reference Format | Example |
|--------|-----------------|---------|
| GitHub Issues | `#123` | Fixes #123 |
| GitLab Issues | `#123` | Closes #123 |
| Jira | `PROJ-123` | PROJ-123: Add feature |
| Linear | `PROJ-123` | PROJ-123 |
| Shortcut | `sc-123` | sc-123 |
| None | Free text | Task description |

### Integration Points

When ticketing is enabled:

**ROADMAP.md**:
```markdown
## Now
- [ ] [PROJ-123] Implement user authentication

## Next
1. [PROJ-124] Add password reset
2. [PROJ-125] Email verification
```

**SESSION_LOG.md**:
```markdown
## Session: 2024-01-15
**Task**: [PROJ-123] Implement user authentication
```

**Commit messages**:
```
feat(auth): implement login flow

PROJ-123
```

**PR/MR descriptions**:
```markdown
## Related
- Ticket: PROJ-123
```

### Setup Questions

- Do you use a ticketing system? (which one)
- Should ROADMAP reference tickets?
- Should commits include ticket references?
- Ticket ID format if non-standard?

---

## CI/CD Platforms

SpecFlow adapts end-session commands to your CI/CD setup.

### Supported Platforms

| Platform | PR/MR Command | Status Check |
|----------|---------------|--------------|
| GitHub Actions | `gh pr create` | `gh pr checks` |
| GitLab CI | `glab mr create` | `glab pipeline status` |
| Jenkins | Manual / API | Jenkins UI |
| CircleCI | `gh pr create` | CircleCI UI |
| Azure DevOps | `az repos pr create` | `az pipelines runs list` |

### Integration Points

**end-session.md command** adapts to platform:

```bash
# GitHub Actions
gh pr create --title "feat: description"
gh pr checks  # optional: wait for checks

# GitLab CI
glab mr create --title "feat: description"
glab pipeline status  # optional: check pipeline
```

**WORKFLOW.md** documents your pipeline:
```markdown
## CI/CD

On PR/MR:
- Runs: tests, lint, build
- Required to pass before merge

On merge to main:
- Runs: deploy to staging
- Manual promotion to production
```

### Setup Questions

- CI/CD platform? (or none)
- What runs on PR/MR?
- What runs on merge to main?
- Any required checks before merge?

---

## Documentation Hosting

If you host documentation externally, SpecFlow can reference it.

### Supported Platforms

| Platform | Use Case |
|----------|----------|
| GitHub Pages | Public docs, API reference |
| GitBook | Team documentation |
| Notion | Team wiki |
| Confluence | Enterprise docs |
| ReadTheDocs | Open source projects |
| Self-hosted | Custom solutions |

### Integration Points

**CLAUDE.md** includes link:
```markdown
## Documentation
- Internal: `docs/` folder
- External: https://docs.example.com
```

**OVERVIEW.md** references external docs:
```markdown
## External Contracts
- API Docs: https://api.example.com/docs
```

---

## Communication Tools

Optional notification integrations.

### Slack/Discord

Could notify on:
- Session start/end
- PR created
- Pipeline status

**Note**: This requires webhook setup outside SpecFlow. SpecFlow can document the integration but doesn't implement it.

### Setup Questions

- Do you use Slack/Discord for notifications?
- What events should notify? (informational only)

---

## API Documentation

If your project has APIs, SpecFlow can reference them.

### OpenAPI/Swagger

**OVERVIEW.md**:
```markdown
## External Contracts

### API
- OpenAPI spec: `api/openapi.yaml`
- Hosted docs: https://api.example.com/docs
```

**Backend agent** knows to update spec:
```markdown
### API Changes
- Update `api/openapi.yaml` when endpoints change
- Ensure spec matches implementation
```

### GraphQL

**OVERVIEW.md**:
```markdown
## External Contracts

### API
- Schema: `api/schema.graphql`
- Playground: https://api.example.com/graphql
```

---

## Database Migrations

SpecFlow can track migration conventions.

### Integration Points

**OVERVIEW.md**:
```markdown
## External Contracts

### Data
- Migrations: `db/migrations/`
- Current schema: `db/schema.sql` (auto-generated)
```

**WORKFLOW.md**:
```markdown
### Database Changes
1. Create migration: `make migration name=description`
2. Run migration: `make migrate`
3. Update schema dump: `make schema`
```

**Backend agent**:
```markdown
### Database Changes
- Always use migrations, never manual SQL
- Migration naming: `YYYYMMDD_HHMMSS_description.sql`
- Test migrations both up and down
```

---

## Integration Summary

| Integration | Impact | Required |
|-------------|--------|----------|
| Ticketing | References in docs, commits | No |
| CI/CD | End-session commands | No |
| Doc hosting | Links in CLAUDE.md | No |
| Communication | Informational only | No |
| API docs | References in OVERVIEW | No |
| Migrations | Documented in WORKFLOW | No |

All integrations are optional. SpecFlow works without any of them.

---

## Adding Integrations Later

Run `/pivot-session` to add integrations:

1. Declare new integration
2. Answer integration-specific questions
3. Commands regenerated as needed
4. WORKFLOW.md updated

You don't need to set everything up at once. Add integrations as your project needs them.
