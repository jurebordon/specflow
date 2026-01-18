# Data Warehouse (DBT)

> Analytics data warehouse built on DBT and Snowflake.

## Project Overview

Existing DBT project (~50 models) providing analytics data marts for business intelligence. In production for 1+ year.

## Quick Context

- **Type**: Existing project (adoption mode)
- **Stack**: DBT 1.5+, Snowflake, Python (macros)
- **Git Workflow**: CI/CD Gated (GitLab MR)
- **Tickets**: Jira (DATA-XXX)

## Documentation

| Doc | Purpose |
|-----|---------|
| [ROADMAP.md](docs/ROADMAP.md) | Current analytics work |
| [SESSION_LOG.md](docs/SESSION_LOG.md) | Session history |
| [OVERVIEW.md](docs/OVERVIEW.md) | Model inventory & lineage |
| [ADR.md](docs/ADR.md) | Data modeling decisions |

## Project Structure

```
analytics-dw/
├── models/
│   ├── staging/          # stg_* - Source transformations
│   │   ├── salesforce/
│   │   ├── stripe/
│   │   └── internal_app/
│   ├── intermediate/     # int_* - Business logic
│   │   ├── finance/
│   │   └── customers/
│   └── marts/           # Final consumption layers
│       ├── core/        # dim_*, fct_* - Core entities
│       ├── finance/     # Finance-specific marts
│       └── marketing/   # Marketing marts
├── macros/              # Reusable SQL macros
├── tests/               # Custom data tests
├── seeds/               # Static reference data
├── snapshots/           # SCD Type 2 tracking
└── dbt_project.yml
```

## Model Layers

### Staging (`stg_`)
- 1:1 with source tables
- Rename to standard conventions
- Cast data types
- No joins, minimal logic

### Intermediate (`int_`)
- Business logic building blocks
- Can join staging models
- Reusable across marts

### Marts (`dim_`, `fct_`)
- Final consumption models
- Optimized for Looker/Tableau
- May be wide and denormalized

## Key Commands

```bash
# Run specific model and downstream
dbt run --select model_name+

# Run modified models only
dbt run --select state:modified+

# Test models
dbt test --select model_name+

# Full build (run + test)
dbt build --select state:modified+

# Generate and serve docs
dbt docs generate && dbt docs serve
```

## Session Commands

- `/plan-session` - Plan work
- `/start-session` - Begin (creates branch)
- `/end-session` - Create MR (no local merge!)
- `/pivot-session` - Reassess modeling approach

## Git Workflow (GitLab CI/CD)

**Important**: Never merge locally. CI handles merge after approval.

```
main ◄── CI Pipeline ◄── MR Approval ◄── feat/DATA-XXX-description
              │                │
              │                └── Requires 1 approval
              └── dbt build must pass
```

```bash
# Start work
git checkout main && git pull
git checkout -b feat/DATA-XXX-model-name

# End work (after dbt build passes locally)
git push -u origin feat/DATA-XXX-model-name
glab mr create --title "feat(marts): add dim_customer" \
  --description "DATA-XXX" \
  --remove-source-branch
```

## Naming Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Staging | `stg_[source]__[table]` | `stg_salesforce__accounts` |
| Intermediate | `int_[entity]__[transform]` | `int_customers__enriched` |
| Dimension | `dim_[entity]` | `dim_customer` |
| Fact | `fct_[event/process]` | `fct_orders` |

## Required for New Models

Every new model must have:
- [ ] Model SQL file in correct layer
- [ ] Entry in `schema.yml` with description
- [ ] `unique` test on primary key
- [ ] `not_null` on required fields
- [ ] Relationship tests for foreign keys

## Common Patterns

### Surrogate Keys
```sql
{{ dbt_utils.generate_surrogate_key(['source_id', 'source_system']) }} as customer_sk
```

### Incremental Models
```sql
{{
  config(
    materialized='incremental',
    unique_key='event_id',
    on_schema_change='sync_all_columns'
  )
}}

SELECT ...
{% if is_incremental() %}
WHERE _loaded_at > (SELECT MAX(_loaded_at) FROM {{ this }})
{% endif %}
```

### Standard Timestamps
```sql
-- All models should have:
current_timestamp() as _dbt_loaded_at,
'{{ invocation_id }}' as _dbt_invocation_id
```

## Working Agreements

1. **One model change per MR** - When practical
2. **Tests required** - All new models need tests
3. **Run before MR** - `dbt build --select state:modified+`
4. **Link tickets** - Include DATA-XXX in MR
5. **Update schema.yml** - Descriptions for all columns (eventually)

## Key Decisions (from ADR)

- **ADR-001**: Use incremental models for fact tables >1M rows
- **ADR-002**: All timestamps in UTC
- **ADR-003**: Soft deletes via `_is_deleted` flag, not hard deletes
- **ADR-004**: Customer grain is Salesforce Account ID

## Getting Help

- **Model ownership**: Check `schema.yml` meta.owner field
- **Source questions**: Check `sources.yml` for source definitions
- **Historical context**: Check `docs/ADR.md` and `SESSION_LOG.md`

---

*This project uses [SpecFlow](https://github.com/yourname/specflow) for AI-assisted development.*
