# PlainText.legal

## Live demo

**[plainlegal-biyp6u95.manus.space](https://plainlegal-biyp6u95.manus.space/)**

> **Government support, made actionable.**

PlainText.legal is an agent-led research desk for founders. Give it a company description or public domain and it turns the messy language of government programs into a short, evidence-backed plan: what may fit, what does not, what the opportunity is worth, and what to verify next.

## The product in one sentence

**PlainText.legal is the translation layer between how startups describe themselves and how public programs describe eligibility, technology, agencies, and funding.**

## The killer workflow

A founder starts with one natural-language search. PlainText then:

- Builds a structured company profile from the founder’s description and optional public website context.
- Translates startup language into government and agency terminology.
- Searches live Grants.gov opportunities and retrieves official program details.
- Adds USAspending award history, Utah recipient context, and SBIR/STTR evidence.
- Applies conservative domain-aware ranking that penalizes semantic mismatches.
- Runs a final relevance screen that can keep, demote, or remove weak results.
- Returns a Government Opportunity Map with fit tiers, dollar context, concerns, verification steps, and next actions.

The result is not a keyword list. It is a research brief a founder can use immediately.

## Automatic support discovery is already wired

The automatic intake framework is implemented. The remaining dependency is access to approved data-integration partners that can provide authorized Utah registration events and `.ai` domain events.

Once a partner connection is available, the operating flow is ready:

```text
Authorized company or domain event
        ↓
Company context enters the PlainText pipeline
        ↓
Profile extraction and government-language translation
        ↓
Live opportunity research and evidence enrichment
        ↓
Conservative ranking and final relevance screening
        ↓
Opportunity Map generated for the founder
        ↓
Delivery through an approved, permissioned workflow
```

This is not a mock automation story. The research, ranking, screening, report, and opt-in delivery layers are running now. Partner integration is the final connection point for event-driven intake. The framework is designed for lawful, permissioned sources; it does not depend on scraping WHOIS data or collecting founder contact details without authorization.

## Why the demo is compelling

PlainText.legal makes the hard part visible. It shows the translated profile, the research trail, the official opportunity record, the funding amount, historical recipient evidence, the reason a result surfaced, and the reasons a result may be wrong. It is also willing to return **Probably Not a Fit** when the evidence is weak.

That combination matters: a founder gets speed without giving up traceability, and a judge can see the difference between an AI-generated answer and an auditable research process.

## Data sources

| Source | Role |
|---|---|
| [Grants.gov](https://www.grants.gov/) | Live posted and forecasted federal opportunities |
| [USAspending](https://www.usaspending.gov/) | Historical awards, recipients, agencies, and Utah context |
| [SBIR.gov](https://www.sbir.gov/) | Reproducible award and open-topic evidence |
| [SAM.gov](https://sam.gov/) | Optional assistance-listing enrichment when available |

## System flow

```text
Founder description or domain
        ↓
Structured startup profile + research plan
        ↓
Government-source discovery
        ↓
Domain-aware deterministic ranking
        ↓
Final relevance screening agent
        ↓
Historical evidence enrichment
        ↓
Government Opportunity Map
```

## Stack

React 19, Tailwind CSS 4, Express, tRPC, Drizzle ORM, MySQL/TiDB, and server-side structured LLM calls. The project includes research-progress tracking, persisted reports, opt-in report association, conservative ranking tests, screening regression tests, and a live Manus deployment.

## Run locally

```bash
pnpm install
pnpm dev
```

The research pipeline requires server-side database and LLM environment variables. Keep credentials out of client bundles and never commit `.env` files.

## Accuracy boundary

PlainText.legal organizes public information for research. It does not determine eligibility, provide legal advice, or guarantee funding. Founders should verify the official notice, applicant requirements, deadline, registrations, cost share, and program contact before acting.
