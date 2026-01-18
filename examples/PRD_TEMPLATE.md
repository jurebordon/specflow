# PRD Template

> Copy this template and fill in the sections for your project.

---

# PRD: [Project Name]

**Version**: V0 (Initial)
**Date**: YYYY-MM-DD
**Author**: [Name]

## 1. Problem Statement

### What problem are we solving?
[Describe the problem in 2-3 sentences. Be specific about the pain points.]

### Who has this problem?
[Describe the target users and how frequently they encounter this problem.]

### What happens if we don't solve it?
[Status quo - what do users do today?]

## 2. Target Users

### Primary Users
- **[User Type 1]**: [Brief description, needs, context]
- **[User Type 2]**: [Brief description, needs, context]

### Secondary Users (if any)
- **[User Type]**: [Brief description]

## 3. Core Features (MVP)

> List only what's needed for a minimal viable product. Resist feature creep.

1. **[Feature Name]**
   - [What it does]
   - [Why it's essential for MVP]

2. **[Feature Name]**
   - [What it does]
   - [Why it's essential for MVP]

3. **[Feature Name]**
   - [What it does]
   - [Why it's essential for MVP]

## 4. User Journeys

### Journey 1: [Name]
1. User does X
2. System responds with Y
3. User completes Z

### Journey 2: [Name]
1. User does X
2. System responds with Y
3. User completes Z

## 5. Success Criteria

> How will we know this works? Be specific but don't invent numbers you can't measure.

- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Qualitative indicator]

## 6. Non-Goals (Out of Scope)

> Be explicit about what we're NOT building. This prevents scope creep.

- **Not building**: [Feature/capability]
  - *Why*: [Reason - too complex, not MVP, future phase, etc.]

- **Not building**: [Feature/capability]
  - *Why*: [Reason]

## 7. Constraints

### Technical Constraints
- [Any technical limitations or requirements]

### Business Constraints
- [Timeline, budget, team size, etc.]

### Other Constraints
- [Regulatory, legal, etc.]

## 8. Open Questions

> Things we need to figure out before or during development.

- [ ] [Question 1]
- [ ] [Question 2]
- [ ] [Question 3]

---

## Notes for AI Assistants

When using this PRD to generate a Tech Spec:
- Focus on MVP features only
- Don't over-engineer
- Flag any ambiguities before proceeding
- Keep the spec realistic for the implied team size

---

# Example: Filled PRD

Below is a completed example for reference.

---

# PRD: BookmarkBrain

**Version**: V0 (Initial)
**Date**: 2024-01-15
**Author**: Jane Developer

## 1. Problem Statement

### What problem are we solving?
Developers save hundreds of bookmarks but can never find them when needed. Browser bookmarks are a graveyard of forgotten links with no context about why something was saved.

### Who has this problem?
Software developers who frequently research solutions, save "read later" articles, and need to reference documentation. They save 5-10 bookmarks per week but struggle to find them later.

### What happens if we don't solve it?
Users re-google the same things repeatedly, waste time searching through unorganized bookmark folders, or lose valuable resources entirely.

## 2. Target Users

### Primary Users
- **Solo developers**: Working on side projects, need to track resources across multiple technologies
- **Learners**: Taking courses, following tutorials, building reference libraries

### Secondary Users
- **Tech leads**: Curating resources for team reference

## 3. Core Features (MVP)

1. **Save bookmarks with context**
   - Browser extension to save current page
   - Auto-extract title, description, tags
   - Add personal notes at save time

2. **Smart search**
   - Full-text search across all bookmark content
   - Filter by tags, date, domain

3. **Simple organization**
   - Auto-tagging based on content
   - Manual tag editing
   - No complex folder hierarchies

## 4. User Journeys

### Journey 1: Save a bookmark
1. User finds useful article while coding
2. Clicks browser extension
3. Extension auto-fills title/tags, user adds quick note
4. Bookmark saved with one click

### Journey 2: Find a bookmark
1. User remembers "that React hook article"
2. Searches "react hook"
3. Results show matching bookmarks with context
4. User clicks through to original article

## 5. Success Criteria

- [ ] Can save a bookmark in under 5 seconds
- [ ] Can find any bookmark within 3 searches
- [ ] Users actually return and search (not just save)

## 6. Non-Goals (Out of Scope)

- **Not building**: Social/sharing features
  - *Why*: MVP is personal tool, social adds complexity

- **Not building**: Mobile app
  - *Why*: Primary use case is while coding at desktop

- **Not building**: Offline reading/archiving
  - *Why*: Just links for now, archiving is complex

- **Not building**: AI summarization
  - *Why*: Nice-to-have for V2, not MVP

## 7. Constraints

### Technical Constraints
- Must work with Chrome and Firefox (extension APIs differ)
- Storage should be self-hostable (no cloud lock-in)

### Business Constraints
- Solo developer, part-time
- No budget for paid services
- Target: usable MVP in 4-6 weeks of part-time work

## 8. Open Questions

- [ ] SQLite vs PostgreSQL for storage?
- [ ] How to handle duplicate bookmarks?
- [ ] Should tags be hierarchical?
