# PlainText.legal — Hackathon Demo and Manus Launch Guide

## Three-minute demo flow

Begin on the public landing page and frame PlainText.legal as an **agent-led research desk**, not a grant-search form. The key promise is exactly: **“Government support, made actionable.”** Point out that the founder starts with a company description rather than an agency, a CFDA number, or a bureaucratic keyword.

Use the intake example below. Add the optional public domain only if the website is public and representative; the founder narrative remains the source of truth.

> “We are a 15-person Utah digital health startup building AI-powered software that reduces administrative workload for hospital nurses. We have $1M ARR, raised seed capital, and need $500K–$2M for product development, clinical workflow research, and hospital pilots.”

Submit the scan. Explain the visible research trail: the agent reads the startup context, translates startup language into government terminology, investigates live Grants.gov records, checks USAspending historical evidence including Utah award counts, and layers in SBIR/STTR R&D precedent and open topic / solicitation context. The profile-extraction panel makes the agent’s read of the company visible rather than opaque.

Open the first opportunity card. Show its **tier**, the specific reason it was surfaced, the potential concerns, what the founder must verify, the action plan, direct official notice, historical award signal, and SBIR precedent. Emphasize that none of this is represented as an eligibility determination. Finally, use the opt-in email field to show that report association is voluntary and no public-contact harvesting is used.

Demonstrate the **Scan a company** page last. Explain that it accepts a founder-supplied public domain or an authorized Utah company handoff. It is intentionally a compliant prototype boundary for future licensed `.ai` domain events and authorized Utah-registration exports; it does not claim that WHOIS discovers every new `.ai` purchase.

## Live-data caveats

The core live integrations are Grants.gov Search2/fetchOpportunity and USAspending V2. Their returned data can vary by query, status, and public-source availability. The SBIR live API is treated as optional because SBIR.gov currently documents maintenance; the app instead uses reproducible official award and open-topic / solicitation snapshots. SAM.gov Assistance Listings are accurately labeled as optional enrichment because public key issuance is currently unavailable.

## Verification completed

| Check | Outcome |
|---|---|
| Type check | `pnpm check` passes. |
| Unit tests | `pnpm test` passes with six tests covering fallback expansion, scoring / explanation guardrails, SBIR award and open-topic context, safe domain handling, report persistence, and auth logout. |
| Live agent smoke test | A Utah AI-health startup scan returned seven live Grants.gov candidates, three USAspending evidence investigations, five SBIR historical matches, and four current SBIR topic / solicitation matches. |
| Visual review | Landing, Scan a company, and persisted report views were checked at desktop and mobile widths. |

## Publishing on Manus

The project is configured for Manus hosting. Create a checkpoint after reviewing the current implementation, then use the **Publish** control in the project interface. No separate Vercel, Railway, Fly.io, Dockerfile, or external hosting configuration is needed for this MVP.

For a post-hackathon production phase, add a licensed new-domain event provider or registry/registrar partnership, an authorized Utah registration-export ingestion job, a sender service for opted-in report delivery, and SAM.gov Assistance Listings once key issuance is available. These should be introduced as separate, authenticated integrations with documented data-use and consent policies.
