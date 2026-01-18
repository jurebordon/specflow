# Analytics Dashboard PoC

> Client PoC for sales analytics dashboard.

## Project Overview

React-based dashboard for visualizing sales data, integrating with client's existing Azure infrastructure and .NET Core API.

## Constraints (MUST FOLLOW)

### Mandated Technologies
- React 18+ with TypeScript
- Azure AD B2C for authentication (MSAL.js)
- Azure hosting only (Static Web Apps → AKS)
- MIT/Apache licensed dependencies only

### Forbidden Technologies
- AWS services (any) - contractual prohibition
- GCP services (any) - not approved vendor
- GPL-licensed libraries - legal requirement
- Direct database access - must use client API only

### Process Requirements
- PRs require client team approval (minimum 1)
- Deploy via Azure DevOps pipeline only
- Maintain 70% test coverage
- All PII must be EU-resident

## Quick Context

- **Type**: Constrained PoC
- **Stack**: React 18, TypeScript, TailwindCSS, Azure AD
- **Git Workflow**: PR Review (Azure DevOps)
- **Tickets**: Jira (DASH-XXX)

## Documentation

| Doc | Purpose |
|-----|---------|
| [ROADMAP.md](docs/ROADMAP.md) | Current work |
| [SESSION_LOG.md](docs/SESSION_LOG.md) | Session history |
| [OVERVIEW.md](docs/OVERVIEW.md) | Component architecture |
| [ADR.md](docs/ADR.md) | Technical decisions |
| [CONSTRAINTS.md](docs/frozen/CONSTRAINTS.md) | Full constraints reference |

## Project Structure

```
dashboard/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Route pages
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API client, auth
│   ├── types/           # TypeScript types
│   └── utils/           # Helpers
├── public/
├── tests/
├── azure-pipelines.yml
└── package.json
```

## Authentication

Using MSAL.js with client's Azure AD B2C:

```typescript
// Auth is handled via src/services/auth.ts
// Scopes: api.read, api.write
// Token automatically attached to API calls
```

**Important**: Never store tokens in localStorage. Use MSAL's cache.

## Client API

Base URL: `https://api.client.internal` (configured via env)

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/sales | GET | Get sales data |
| /api/regions | GET | Get regions |
| /api/products | GET | Get product categories |

OpenAPI spec: `docs/client-api.yaml`

## Session Commands

- `/plan-session` - Plan work
- `/start-session` - Begin (creates branch)
- `/end-session` - Create PR (no local merge!)
- `/pivot-session` - Reassess direction

## Git Workflow (Azure DevOps)

**Important**: Do NOT merge locally. CI/CD handles merge.

```bash
# Start work
git checkout main && git pull
git checkout -b feat/DASH-XXX-description

# End work
npm test
git push -u origin feat/DASH-XXX-description
az repos pr create --title "feat: description"
```

## Before Making Changes

Check if your change:
- [ ] Uses only approved technologies
- [ ] Doesn't introduce forbidden dependencies (`npm ls` to verify)
- [ ] Maintains required test coverage
- [ ] Has EU data residency (if storing anything)
- [ ] Follows client's React patterns

## Dependency Check

Before adding any package:
```bash
# Check license
npm info <package> license

# Verify it's MIT or Apache-2.0
# If not, find an alternative or request exception (ADR required)
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage (must be ≥70%)
npm test -- --coverage

# Run specific test
npm test -- --testPathPattern=SalesChart
```

## Working Agreements

1. **Check constraints** - Before adding any dependency
2. **One feature per PR** - Keep PRs focused
3. **Test coverage** - Maintain ≥70%
4. **Link tickets** - Include DASH-XXX in PR
5. **No local merge** - Let pipeline handle it

## Common Issues

### "Dependency not allowed"
Check the license. Find MIT/Apache alternative or create ADR for exception.

### "Pipeline failed - coverage"
Add tests to reach 70%. Check uncovered lines in coverage report.

### "Auth errors"
Ensure you're using the correct Azure AD tenant. Check `src/services/auth.ts` configuration.

---

*This project uses [SpecFlow](https://github.com/yourname/specflow) for AI-assisted development.*
