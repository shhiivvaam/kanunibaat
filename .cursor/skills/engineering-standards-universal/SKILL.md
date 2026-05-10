---
name: engineering-standards-universal
description: >-
  Applies staff-level engineering standards for architecture, code quality, scalability,
  security, observability, testing, Git, config, accessibility, and planning across any
  stack. Use when designing or implementing features, reviewing code or PRs, choosing
  dependencies, writing tests, handling security or observability, or when the user
  mentions engineering standards, universal rules, or staff-level bar.
---

# Engineering standards (universal)

## When to use

Read this skill for non-trivial work: new modules, APIs, data layers, auth, infra, performance-sensitive paths, or anything that will be maintained by others. For the **full verbatim standard** (all sections in depth), open [reference.md](reference.md).

## Operating principle

Ship the **best possible** solution for scalability, maintainability, and long-term architecture—not the smallest patch that merely works. When two approaches compete, prefer the one that **scales** and is **easier to reason about**. Think like a senior staff engineer; adapt idioms to the language and framework.

## Apply in this order

1. **Scope**: Implement what was asked; avoid drive-by refactors. Call out high-value gaps outside scope instead of silently expanding.
2. **Architecture**: Feature-oriented boundaries, clear layers (UI / logic / data / state / utils), dependency inversion at integration points, explicit module public APIs—no god files.
3. **Quality**: DRY, single responsibility, small functions (~30 lines as a soft ceiling), explicit naming, no magic strings/numbers, fail fast at boundaries, pure functions first, immutability by default; abstract only after a pattern repeats.
4. **Dependencies**: Prefer latest stable, battle-tested, composable packages; justify new deps; flag outdated or risky ones.
5. **Scalability & reliability**: Stateless services where possible, async I/O, deliberate caching, DB indexes and query shape, versioned APIs with pagination, queues for slow work, rate limits/backpressure.
6. **Testing**: Pyramid (unit heavy, selective integration, E2E for critical journeys), behavior-focused tests, deterministic suites, factories/fixtures, contracts at service boundaries.
7. **Security & privacy**: Validate and encode at boundaries, secrets only via env/secret managers, least privilege, OWASP awareness, proven auth libraries, dependency audits, PII minimization, input size limits.
8. **Observability**: Structured logs at boundaries, error tracking for unhandled failures, trace IDs across services where applicable, metrics and health checks, actionable errors, audit logs for sensitive actions.
9. **Docs & Git**: Self-documenting code; document public APIs; ADRs for big decisions; conventional commits; small PRs; no secrets in repo; env schema validation and `.env.example`.
10. **Frontend accessibility**: Semantic HTML, WCAG 2.1 AA, keyboard and focus (including modals), associate errors with controls.

## Planning and communication

For non-trivial tasks, state approach and trade-offs briefly before coding. State assumptions when requirements are ambiguous. Mention alternatives and a recommendation when it matters.

## Stack note

Principles apply to **all** stacks; implementation details follow each ecosystem’s norms. See [reference.md](reference.md) for the complete checklist and wording.
