# PlainText.legal

## Live demo

**[plaintext.legal](https://plainlegal-biyp6u95.manus.space/)**

> **Government support, made actionable.**

**PlainText.legal is the translation layer between how startups describe themselves and how public programs describe eligibility, technology, agencies, and funding.**

## Key Features

Using a Natural-language description or just your domain, PlainText.legal:
- Builds a structured company profile from the founder’s description and optional public website context.
- Translates startup language into government and agency terminology.
- Searches live Grants.gov opportunities and retrieves official program details.
- Adds USAspending award history, Utah recipient context, and SBIR/STTR evidence.
- Applies domain-aware ranking relevant to what your company actually does.
- Returns a Government Opportunity Map with fit tiers, dollar context, concerns, verification steps, and next actions.

It's a research brief a founder can use immediately.

## Automatic support discovery

The automatic intake framework is implemented. Approved data-integration partners provide authorized Utah company registration events and `.ai` domain events.

This operating flow is ready:

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

This skips founders needing to even think about government support and instead brings the opportunities right to them. 

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

The research pipeline requires server-side database and LLM environment variables.

## Accuracy boundary

PlainText.legal organizes public information for research. It does not determine eligibility, provide legal advice, or guarantee funding. Founders should verify the official notice, applicant requirements, deadline, registrations, cost share, and program contact before acting.
