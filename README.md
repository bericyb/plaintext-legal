# PlainText.legal

## Live demo

**[plainlegal-biyp6u95.manus.space](https://plainlegal-biyp6u95.manus.space/)**

> **Government support, made actionable.**

PlainText.legal is an agent-led research desk that turns a founder’s plain-English company description into a prioritized **Government Opportunity Map**. Instead of making startups learn government terminology first, PlainText translates the company, searches public federal data, explains why opportunities surfaced, and shows what to verify next.

## Why this matters

The question is not “Can we find another grant?” It is:

> **What if every startup could instantly see how the government could help it grow?**

## Built for the hackathon

PlainText combines a simple founder experience with a serious research pipeline:

- **One open search bar:** Enter a public domain or describe the company in your own words.
- **Agent-led translation:** Extracts the startup profile, converts founder language into government terms, and builds a research plan across relevant agencies.
- **Live federal discovery:** Searches current posted and forecasted opportunities through Grants.gov.
- **Evidence, not hype:** Adds USAspending award history, Utah recipient context, and reproducible SBIR/STTR snapshots.
- **Conservative matching:** Domain-aware deterministic scoring penalizes semantic mismatches and prefers false negatives over irrelevant recommendations.
- **Final relevance screen:** A structured screening agent can keep, demote, or remove shortlisted opportunities and records the reason for its decision.
- **Actionable output:** Every result includes a fit tier, research score, concerns, verification checklist, next actions, official source link, and available funding context.
- **Honest weak-fit behavior:** When the evidence is poor, PlainText can say “Probably Not a Fit” instead of inventing a recommendation.

## Automatic support discovery

The long-term vision is that support research begins when a company does—not when a founder already knows what to search for.

A newly registered Utah business or a licensed `.ai` domain-event partner could provide a lawful public signal. PlainText would interpret available company context, run the same opportunity research, create an Opportunity Map, and deliver it only through founder opt-in or an authorized partner workflow.

The MVP demonstrates the core intelligence layer today: **company context → government research → evidence → actionable founder briefing**. The future automation layer is designed around permissioned, appropriately sourced events rather than scraping WHOIS data or harvesting contact details.

## How the system works

```text
Founder description or domain
        ↓
Structured startup profile + government-language research plan
        ↓
Grants.gov discovery and official opportunity details
        ↓
Conservative domain-aware ranking
        ↓
Final relevance screening agent
        ↓
USAspending + SBIR evidence enrichment
        ↓
Government Opportunity Map
```

## Data sources

| Source | Role |
|---|---|
| [Grants.gov](https://www.grants.gov/) | Live posted and forecasted federal opportunities |
| [USAspending](https://www.usaspending.gov/) | Historical awards, recipients, agencies, and Utah context |
| [SBIR.gov](https://www.sbir.gov/) | Reproducible award and open-topic fallback evidence |
| [SAM.gov](https://sam.gov/) | Optional assistance-listing enrichment when available |

## Stack

React 19, Tailwind CSS 4, Express, tRPC, Drizzle ORM, MySQL/TiDB, and server-side structured LLM calls. The project includes a research-progress experience, persisted reports, opt-in report association, deterministic ranking tests, screening regression tests, and a production-ready Manus deployment.

## Run locally

```bash
pnpm install
pnpm dev
```

The server-side research pipeline requires the project’s configured database and LLM environment variables. Never expose server credentials in client-side environment variables or commit `.env` files.

## Important disclaimer

PlainText.legal organizes public information for research. It does not determine eligibility, provide legal advice, or guarantee funding. Always verify the official notice, applicant requirements, deadline, registration steps, and program contact before acting.
