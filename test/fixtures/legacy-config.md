# SpecFlow Project Configuration

<!--
  A schema 0 config fixture, covering every key shape seen in real projects.

  Checked in deliberately. The manifest's coverage was originally verified
  against sibling repositories on one machine, one of which was renamed
  mid-session — a check that silently changes what it covers is not a check.

  Includes both schema 0 dialects:
    - Format/Typecheck Command under "Tech Stack" (written by the
      /init-specflow prompt) as well as under "Technical Layers" (written by
      cli/src/generate.js)
    - the plural "Tech Commands (Mixed Stack)" section from prompts/INIT.md,
      whose values are indented, labelled sub-bullets
-->

## Project
- **Name**: crp-demo
- **Mode**: adoption
- **Description**: Planner prototype to augment farming software gaps.

## Tech Stack
- **Languages**: Python 3.11+, TypeScript
- **Frameworks**: FastAPI, React 19, SQLModel, Alembic, Vite, MUI, React Query
- **Test Command**: cd backend && pytest tests/
- **Build Command**: cd frontend && npm run build
- **Lint Command**: cd frontend && npm run lint
- **Format Command**: cd backend && black .
- **Typecheck Command**: cd frontend && tsc -b

## Tech Commands (Mixed Stack)
- **Test Commands**:
  - Python: pytest
  - DBT: dbt test
- **Build Commands**:
  - Python: python -m build
  - DBT: dbt build
- **Lint Commands**:
  - Python: ruff check .
  - SQL: sqlfluff lint

## Git Workflow
- **Type**: solo
- **Platform**: GitHub
- **Default Branch**: main
- **Branch Convention**: feat/description

## Integrations
- **Ticketing**: jira (format: PROJ-123)

## Documentation
- **Path**: docs/
- **Existing Docs**: docs/
- **Tracking**: gitignored

## Technical Layers
- **Hooks**: enabled
- **Rules**: enabled
- **Statusline**: enabled
- **Format Command**: cd backend && black .
- **Typecheck Command**: cd frontend && tsc -b
