# Tech Spec Template

> Copy this template and fill in based on your PRD.

---

# Tech Spec: [Project Name]

**Version**: V0 (Initial)
**Date**: YYYY-MM-DD
**PRD Reference**: [Link to PRD]

## 1. Overview

[One paragraph summary of what we're building technically.]

## 2. Architecture

### High-Level Architecture

```
[Simple ASCII diagram showing main components]

┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │────▶│   API   │────▶│   DB    │
└─────────┘     └─────────┘     └─────────┘
```

### Components

| Component | Responsibility | Tech |
|-----------|---------------|------|
| [Name] | [What it does] | [Stack] |
| [Name] | [What it does] | [Stack] |

## 3. Tech Stack

### Backend
- **Language**: [e.g., Python 3.11]
- **Framework**: [e.g., FastAPI]
- **ORM/DB Access**: [e.g., SQLAlchemy]

### Frontend (if applicable)
- **Framework**: [e.g., React 18]
- **Language**: [e.g., TypeScript]
- **Styling**: [e.g., TailwindCSS]

### Database
- **Primary**: [e.g., PostgreSQL 15]
- **Cache**: [e.g., Redis, or "None for MVP"]

### Infrastructure
- **Hosting**: [e.g., Docker on VPS, Vercel, etc.]
- **CI/CD**: [e.g., GitHub Actions]

## 4. Data Model

### Entities

#### [Entity Name]
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| [field] | [type] | [constraints] | [notes] |
| created_at | timestamp | NOT NULL | |
| updated_at | timestamp | NOT NULL | |

#### [Entity Name]
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| [field] | [type] | [constraints] | [notes] |

### Relationships

- [Entity A] has many [Entity B]
- [Entity B] belongs to [Entity A]

## 5. API Design

### Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/[resource] | Create [resource] | Yes |
| GET | /api/[resource] | List [resources] | Yes |
| GET | /api/[resource]/{id} | Get [resource] | Yes |
| PATCH | /api/[resource]/{id} | Update [resource] | Yes |
| DELETE | /api/[resource]/{id} | Delete [resource] | Yes |

### Request/Response Examples

#### Create [Resource]
```json
// Request
POST /api/resource
{
  "field1": "value",
  "field2": "value"
}

// Response
{
  "id": "uuid",
  "field1": "value",
  "field2": "value",
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": {}
  }
}
```

## 6. Authentication & Security

### Authentication
- [Method: API keys, JWT, OAuth, etc.]
- [How tokens are issued/validated]

### Authorization
- [Permission model: role-based, resource-based, etc.]

### Security Considerations
- [ ] Input validation on all endpoints
- [ ] Rate limiting
- [ ] HTTPS only
- [ ] [Other relevant security measures]

## 7. External Services

| Service | Purpose | Required? |
|---------|---------|-----------|
| [Service] | [What for] | Yes/No |

## 8. Project Structure

```
project/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── repositories/
├── tests/
│   ├── unit/
│   └── integration/
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```

## 9. Testing Strategy

- **Unit tests**: Services, utilities
- **Integration tests**: API endpoints
- **Target coverage**: [e.g., 80%]

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | [Impact] | [How to address] |

## 11. Open Questions

- [ ] [Technical question 1]
- [ ] [Technical question 2]

---

# Example: Filled Tech Spec

Below is a completed example for reference (based on BookmarkBrain PRD).

---

# Tech Spec: BookmarkBrain

**Version**: V0 (Initial)
**Date**: 2024-01-15
**PRD Reference**: PRD_V0.md

## 1. Overview

A bookmark management system with a browser extension for saving and a web API for storage/search. The extension captures page context, and the backend provides full-text search across all saved bookmarks.

## 2. Architecture

### High-Level Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │     │              │     │              │
│  Extension   │────▶│   FastAPI    │────▶│  PostgreSQL  │
│ (Chrome/FF)  │     │     API      │     │   + pgvector │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                     ┌──────────────┐
                     │   React SPA  │
                     │  (Dashboard) │
                     └──────────────┘
```

### Components

| Component | Responsibility | Tech |
|-----------|---------------|------|
| Browser Extension | Save bookmarks, extract metadata | JS/TS, WebExtension API |
| API | CRUD, search, auth | Python, FastAPI |
| Database | Storage, full-text search | PostgreSQL |
| Dashboard | View, search, manage bookmarks | React, TypeScript |

## 3. Tech Stack

### Backend
- **Language**: Python 3.11
- **Framework**: FastAPI
- **ORM**: SQLAlchemy 2.0 (async)

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Build**: Vite

### Browser Extension
- **Manifest**: V3 (Chrome), V2 fallback (Firefox)
- **Language**: TypeScript

### Database
- **Primary**: PostgreSQL 15 with pg_trgm for fuzzy search

### Infrastructure
- **Hosting**: Docker Compose (self-hosted)
- **Dev**: Docker Compose local

## 4. Data Model

### Entities

#### User
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| email | varchar(255) | UNIQUE, NOT NULL | |
| api_key | varchar(64) | UNIQUE, NOT NULL | For extension auth |
| created_at | timestamp | NOT NULL | |

#### Bookmark
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → User | |
| url | text | NOT NULL | |
| title | varchar(500) | | |
| description | text | | Auto-extracted |
| notes | text | | User's notes |
| domain | varchar(255) | | Extracted from URL |
| created_at | timestamp | NOT NULL | |
| updated_at | timestamp | NOT NULL | |

#### Tag
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → User | Tags are per-user |
| name | varchar(100) | | |
| UNIQUE | (user_id, name) | | |

#### BookmarkTag (join table)
| Field | Type | Constraints |
|-------|------|-------------|
| bookmark_id | UUID | FK → Bookmark |
| tag_id | UUID | FK → Tag |
| PK | (bookmark_id, tag_id) | |

### Relationships

- User has many Bookmarks
- User has many Tags
- Bookmark has many Tags (through BookmarkTag)

## 5. API Design

### Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/bookmarks | Create bookmark | API Key |
| GET | /api/bookmarks | List/search bookmarks | API Key |
| GET | /api/bookmarks/{id} | Get bookmark | API Key |
| PATCH | /api/bookmarks/{id} | Update bookmark | API Key |
| DELETE | /api/bookmarks/{id} | Delete bookmark | API Key |
| GET | /api/tags | List user's tags | API Key |

### Search

```
GET /api/bookmarks?q=react+hooks&tags=frontend&domain=medium.com
```

Uses PostgreSQL full-text search on title, description, notes, and URL.

### Create Bookmark

```json
// Request
POST /api/bookmarks
X-API-Key: user-api-key

{
  "url": "https://example.com/article",
  "title": "Article Title",
  "description": "Auto-extracted description",
  "notes": "User's note about why saved",
  "tags": ["react", "frontend"]
}

// Response
{
  "id": "uuid",
  "url": "https://example.com/article",
  "title": "Article Title",
  "description": "Auto-extracted description",
  "notes": "User's note",
  "domain": "example.com",
  "tags": ["react", "frontend"],
  "created_at": "2024-01-15T10:00:00Z"
}
```

## 6. Authentication & Security

### Authentication
- API Key in header: `X-API-Key: <key>`
- Keys are 64-character random strings
- One key per user (can regenerate)

### Security Considerations
- [x] Input validation (Pydantic models)
- [x] Rate limiting (100 req/min per key)
- [x] HTTPS required in production
- [x] SQL injection prevented (ORM parameterized queries)

## 7. External Services

| Service | Purpose | Required? |
|---------|---------|-----------|
| None | MVP has no external dependencies | - |

## 8. Project Structure

```
bookmarkbrain/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── schemas/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── extension/
│   ├── src/
│   ├── manifest.json (Chrome)
│   └── manifest.firefox.json
└── docker-compose.yml
```

## 9. Testing Strategy

- **Unit tests**: Search service, tag extraction
- **Integration tests**: API endpoints with test DB
- **Target coverage**: 70%+

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Extension store approval delays | Can't distribute easily | Provide manual install instructions |
| Full-text search performance | Slow searches | Add indexes, consider pagination |
| Browser API differences | Extension bugs | Abstract API layer, test both browsers |

## 11. Open Questions

- [x] SQLite vs PostgreSQL? → **PostgreSQL** (better full-text search)
- [ ] How to handle duplicate URLs? → Detect and prompt user
- [ ] Tag hierarchy? → Flat for MVP, reconsider in V2
