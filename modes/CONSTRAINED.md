# Constrained Mode

> For PoCs and projects with pre-existing technical requirements.

## When to Use

- Building a PoC for a client/employer
- Tech stack is mandated (not your choice)
- Must integrate with existing systems
- Compliance or security requirements exist
- Working within an established ecosystem

## Entry Point

1. Constraints document (what's mandated)
2. Tech Spec that respects constraints
3. PRD (may be lighter than greenfield)

## Setup Flow

```
┌─────────────────────────────────────────┐
│  1. Document Constraints                │
│     - Mandated technologies             │
│     - Forbidden technologies            │
│     - Integration requirements          │
│     - Compliance requirements           │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  2. Write/Receive PRD                   │
│     - May come from stakeholders        │
│     - Focus on what, not how            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  3. Generate TECH_SPEC_V0               │
│     - Must satisfy constraints          │
│     - Setup will validate choices       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  4. Initialize SpecFlow                 │
│     - Declare constraints upfront       │
│     - AI validates tech choices         │
│     - Flags conflicts for resolution    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  5. Start first session                 │
│     - Constraints embedded in commands  │
│     - AI respects limitations           │
└─────────────────────────────────────────┘
```

## Constraints Document

Before setup, document your constraints:

```markdown
# Project Constraints

## Mandated Technologies
- Must use: [e.g., Java 17, Oracle DB, Azure]
- Reason: [e.g., company standard, client requirement]

## Forbidden Technologies
- Cannot use: [e.g., GPL-licensed libraries, AWS services]
- Reason: [e.g., licensing, client policy]

## Integration Requirements
- Must integrate with: [e.g., existing auth system, legacy API]
- Protocols: [e.g., SOAP, specific REST conventions]

## Compliance Requirements
- Standards: [e.g., SOC2, HIPAA, GDPR]
- Implications: [e.g., audit logging, data residency]

## Process Requirements
- Code review: [required/optional]
- Deployment: [e.g., must go through Jenkins]
- Documentation: [e.g., must include OpenAPI spec]
```

## Discovery Questions

Setup will ask additional questions:

### Constraint Validation
- Do any tech spec choices conflict with constraints?
- Are there workarounds for conflicts?
- What flexibility exists within constraints?

### Integration Details
- How do we authenticate with existing systems?
- What data formats are required?
- Are there rate limits or quotas?

### Process Details
- What's the PR/review process?
- What CI/CD pipeline exists?
- Are there required code quality gates?

## What Gets Generated

Similar to greenfield, but:

- CLAUDE.md includes constraints section
- Commands respect process requirements
- Agent guides reference constraint limitations
- WORKFLOW.md reflects actual process

```
project/
├── CLAUDE.md              # Includes constraints
├── docs_specflow/
│   ├── VISION.md
│   ├── ADR.md
│   ├── OVERVIEW.md
│   ├── ROADMAP.md
│   ├── WORKFLOW.md
│   ├── SESSION_LOG.md
│   └── feature_docs/
├── .claude/
│   ├── commands/          # Process-aware commands
│   └── agents/            # Constraint-aware guides
```

## Handling Conflicts

When tech spec conflicts with constraints:

1. **Setup flags the conflict**
   - "Tech spec says PostgreSQL, but Oracle is mandated"

2. **You decide resolution**
   - Update tech spec to match constraints
   - Or document exception with justification

3. **ADR captures the decision**
   - Why constraint was followed or overridden
   - What trade-offs were accepted

## Tips

- Document constraints before writing tech spec
- Be explicit about what's negotiable vs fixed
- Constraints may change - use pivot sessions to adapt
- Don't fight constraints in code - address them in planning

## Common Constraint Patterns

### Enterprise Java Shop
```markdown
Mandated: Java 17+, Spring Boot, Oracle/PostgreSQL, Jenkins
Forbidden: Node.js in production, NoSQL as primary store
Process: PR required, SonarQube quality gate
```

### Azure-Only Client
```markdown
Mandated: Azure services only, .NET Core, Azure DevOps
Forbidden: AWS, GCP, self-hosted infra
Process: Azure Pipelines, must pass security scan
```

### Startup with Legacy System
```markdown
Mandated: Must integrate with legacy PHP monolith
Forbidden: Breaking changes to legacy API
Process: Fast iteration, direct deploys to staging
```

---

## Example: Client Dashboard PoC

A concrete example of constrained mode - building a dashboard PoC for an enterprise client.

### The Scenario

You're building a PoC dashboard for a financial services client. They have strict requirements:

- Must use their existing Azure AD for authentication
- Must deploy to their Azure Kubernetes Service
- Cannot use any AWS services (competitor)
- All data must stay in EU region
- Must integrate with their existing .NET Core API

### Step 1: Document Constraints

```markdown
# Project Constraints: Client Dashboard PoC

## Mandated Technologies
- **Frontend**: React 18+ (client's standard)
- **Auth**: Azure AD B2C (existing system)
- **Hosting**: Azure Kubernetes Service (client's cluster)
- **CI/CD**: Azure DevOps (existing pipelines)

## Forbidden Technologies
- AWS services (any) - competitor, contractual
- Google Cloud services - not approved vendor
- Self-hosted databases - must use Azure managed services
- GPL-licensed libraries - legal requirement

## Integration Requirements
- **Auth**: Must use client's Azure AD B2C tenant
  - OAuth 2.0 / OIDC flow
  - Specific scopes: `api.read`, `api.write`
- **Backend API**: Client's existing .NET Core API
  - Base URL provided: `https://api.client.internal`
  - Uses Azure AD bearer tokens
  - OpenAPI spec available

## Compliance Requirements
- **GDPR**: All PII must be EU-resident
- **Audit**: All API calls must be logged with user context
- **Data retention**: Logs kept 90 days, then purged

## Process Requirements
- **Code review**: Required, minimum 1 approver from client team
- **Deployment**: Via Azure DevOps pipeline only
- **Documentation**: Must maintain OpenAPI spec for any new endpoints
- **Testing**: Minimum 70% coverage required by pipeline
```

### Step 2: PRD (from client)

```markdown
# PRD: Analytics Dashboard PoC

## Problem
Client's sales team currently uses spreadsheets to track regional
performance. They need a real-time dashboard.

## Features (PoC Scope)
1. View sales by region (map visualization)
2. Filter by date range and product category
3. Export filtered data to CSV
4. SSO with existing Azure AD credentials

## Non-Goals (PoC)
- User management (uses existing Azure AD)
- Data entry (read-only from existing API)
- Mobile optimization
```

### Step 3: Tech Spec (respecting constraints)

```markdown
# Tech Spec: Analytics Dashboard PoC

## Architecture
React SPA hosted on Azure, consuming client's existing API.

## Tech Stack
- **Frontend**: React 18, TypeScript, TailwindCSS
- **Auth**: MSAL.js (Microsoft Auth Library) with Azure AD B2C
- **Charts**: Recharts (MIT licensed)
- **Maps**: Azure Maps (client has license)
- **Hosting**: Azure Static Web Apps → AKS ingress
- **CI/CD**: Azure DevOps (client's existing)

## Constraint Validation
✅ React 18 - matches client standard
✅ Azure AD B2C - using MSAL.js
✅ Azure hosting - Static Web Apps + AKS
✅ No AWS/GCP - confirmed
✅ No GPL - all dependencies MIT/Apache
✅ EU data - Azure West Europe region

## Data Flow
1. User authenticates via Azure AD B2C
2. Frontend receives access token
3. Frontend calls client API with bearer token
4. API returns sales data
5. Frontend renders visualizations

## Open Questions
- Do we need offline support? (asked client)
- Azure Maps API key - who provides?
```

### Step 4: Generated CLAUDE.md (Constrained)

```markdown
# Analytics Dashboard PoC

> PoC for client's sales analytics dashboard.

## Constraints (MUST FOLLOW)

### Mandated
- React 18+ with TypeScript
- Azure AD B2C for auth (MSAL.js)
- Azure hosting only
- MIT/Apache licensed dependencies only

### Forbidden
- AWS services (any)
- GCP services (any)
- GPL-licensed libraries
- Direct database access (API only)

### Process
- PRs require client team approval
- Deploy via Azure DevOps only
- Maintain 70% test coverage

## Quick Context

- **Type**: Constrained PoC
- **Stack**: React/TypeScript, Azure AD, Azure hosting
- **Git Workflow**: PR Review (Azure DevOps)
- **Client API**: https://api.client.internal (OpenAPI spec in /docs)

## Before Making Changes

Check if your change:
- [ ] Uses only approved technologies
- [ ] Doesn't introduce forbidden dependencies
- [ ] Maintains required test coverage
- [ ] Has EU data residency (if storing anything)
```

### Step 5: Constraint-Aware Commands

The generated `end-session.md` would include Azure DevOps commands:

```markdown
## 4. Create Pull Request

Push branch:
```bash
git push -u origin feature/branch-name
```

Create PR via Azure DevOps:
```bash
az repos pr create \
  --title "feat: description" \
  --description "Summary of changes" \
  --target-branch main
```

**Required before merge**:
- Client team approval (minimum 1)
- Azure Pipeline passes (tests, coverage, security scan)

Do NOT merge locally - pipeline handles deployment.
```

### Handling Constraint Violations

During setup or development, if a violation is detected:

```markdown
## Constraint Violation Detected

**Issue**: Package `cool-charts` uses GPL-3.0 license
**Constraint**: GPL-licensed libraries forbidden

**Options**:
1. Use alternative: `recharts` (MIT) - Recommended
2. Use alternative: `victory` (MIT)
3. Request exception from client (document in ADR)

Which option would you like to proceed with?
```

The AI won't proceed until the violation is resolved.

## Tips for Constrained Mode

1. **Document constraints first** - Before any tech decisions
2. **Validate early** - Check dependencies before adding them
3. **ADR everything** - Every constraint workaround needs documentation
4. **Communicate proactively** - Flag potential issues before they block
5. **Pivot when constraints change** - Clients change their minds

## When Constraints Change

Run `/pivot-session` when:
- Client adds new constraints
- A constraint is relaxed
- Integration requirements change
- Process requirements change

The pivot session will:
- Update CONSTRAINTS.md
- Regenerate commands if needed
- Flag any existing code that now violates constraints
- Update ADR with change rationale

---

*See [prompts/INIT.md](../prompts/INIT.md) for the initialization prompt - declare "constrained" mode when asked.*
