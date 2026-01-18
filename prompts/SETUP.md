# Setup Prompts

> Prompts for creating PRD and Tech Spec documents.

---

## 1. Create a PRD from an Idea

Use this when you have an idea but no formal requirements.

```
You are a product manager helping me create a PRD (Product Requirements Document) for a new project.

Ask me questions to understand:
1. What problem am I solving?
2. Who are the target users?
3. What are the core features needed for MVP?
4. What constraints exist (time, tech, budget)?
5. How will we know if it's successful?

Then create a PRD_V0.md with these sections:
- Problem Statement
- Target Users
- Core Features (MVP scope)
- User Journeys (2-3 main flows)
- Constraints
- Success Criteria
- Non-Goals (explicitly out of scope)
- Open Questions

Keep it concise - 1-2 pages max. This is V0, it will evolve.
```

---

## 2. Generate Tech Spec from PRD

Use this when you have a PRD and need technical planning.

```
You are a senior engineer. I will give you a PRD for a new project.

Turn it into a TECH_SPEC_V0.md suitable for a small team or solo developer.

Use these sections:
- Architecture Overview (with simple diagram if helpful)
- Tech Stack
  - Backend (language, framework)
  - Frontend (if applicable)
  - Database
  - Infrastructure
- Data Model (key entities and relationships)
- API Design (main endpoints or contracts)
- External Services (third-party integrations)
- Security Considerations
- Risks and Mitigations
- Open Questions

Constraints:
- Keep it realistic for MVP/PoC, not enterprise overkill
- Explicitly list anything you're uncertain about
- Prefer simple, well-understood technologies
- Consider the team's likely skill set

Here is the PRD:
[PASTE PRD HERE]
```

---

## 3. Tech Spec with Constraints

Use this when you have mandated technologies.

```
You are a senior engineer. I will give you a PRD and a set of constraints.

Create a TECH_SPEC_V0.md that:
1. Satisfies all requirements from the PRD
2. Respects all technical constraints
3. Flags any conflicts between PRD and constraints

Use these sections:
- Constraints Summary (what's mandated/forbidden)
- Architecture Overview
- Tech Stack (must align with constraints)
- Data Model
- API Design
- Integration Points (with mandated systems)
- Security Considerations
- Constraint Conflicts (if any)
- Open Questions

PRD:
[PASTE PRD HERE]

Constraints:
- Mandated technologies: [LIST]
- Forbidden technologies: [LIST]
- Integration requirements: [LIST]
- Compliance requirements: [LIST]
```

---

## 4. Derive Tech Spec from Existing Code

Use this for adoption mode when you need to document what exists.

```
You are a senior engineer documenting an existing codebase.

Based on the codebase scan and information I provide, create a TECH_SPEC_CURRENT.md that describes what exists today.

Sections:
- Tech Stack (actual, not planned)
- Architecture Overview (current state)
- Data Model (existing entities)
- API Surface (existing endpoints/contracts)
- External Dependencies
- Known Technical Debt
- Patterns in Use
- Testing Approach

This is descriptive, not prescriptive. Document reality, not aspirations.

Focus on:
- What technologies are actually used
- How the code is organized
- What patterns are followed (even if inconsistent)
- What's tested and what isn't

Codebase information:
[PROVIDE STRUCTURE, KEY FILES, OR SCAN RESULTS]
```

---

## 5. PRD for a Feature (not full product)

Use this when working feature-by-feature in adoption mode.

```
Help me create a mini-PRD for a single feature.

Ask me:
1. What feature am I building?
2. Why is it needed? (problem it solves)
3. Who uses it?
4. What's the happy path?
5. What edge cases matter?
6. What's explicitly NOT included?

Create a FEATURE_[NAME].md with:
- Feature Name
- Problem/Motivation
- User Story (as a... I want... so that...)
- Acceptance Criteria (testable conditions)
- Edge Cases
- Out of Scope
- Technical Notes (if any)

Keep it to half a page. This is tactical, not strategic.
```

---

## Tips for Good Specs

### PRD Tips
- Focus on *what* and *why*, not *how*
- Be specific about MVP scope
- List non-goals explicitly
- Include success criteria you can actually measure
- Keep it short - long PRDs don't get read

### Tech Spec Tips
- Start with the simplest architecture that works
- Be explicit about trade-offs
- List things you don't know yet
- Include enough detail to start coding
- Don't over-design before you've built anything

### For Constraints
- Document constraints before making tech choices
- Distinguish "must" from "should" from "nice to have"
- Understand *why* constraints exist (some are negotiable)
- Flag constraint conflicts early
