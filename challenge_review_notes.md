# Startup State Hackathon Review Notes

## Challenge requirements

The brief positions the product as an intelligence layer, not another government database. The core question is what government resources a startup should know about and why. Required product capabilities are: natural-language startup understanding; discovery across federal sources; non-keyword matching; plain-language explanations of fit, concerns, verification, and next steps; historical award intelligence; a simple founder experience; and a working proof of concept.

The recommended foundation is Grants.gov, SAM.gov Assistance Listings, USAspending.gov, and SBIR.gov. Utah-specific data is optional. The brief explicitly says a strong prototype using 2–4 high-quality sources beats superficial integration of everything, and that teams do not need to guarantee eligibility, integrate every agency, build a production platform, or cover every state program.

The five standardized test cases are AI healthcare; advanced manufacturing/aerospace; climate/water technology; cybersecurity; and consumer/workforce technology. The last case is intentionally difficult: the correct answer may be that traditional federal grants are a poor fit, and the judges will reward a system that says so rather than hallucinating a match.

Judging weights are: usefulness 30%; quality of matching 25%; intelligence and insight 20%; user experience 15%; technical execution 10%. The winning product should feel like a personal government funding intelligence analyst for every startup.

## Current PlainText.legal strengths

PlainText accepts a natural-language description and optional domain, extracts a structured startup profile using GPT-5-mini, translates into government terms, creates a research plan, searches live Grants.gov, queries USAspending V2 historical awards, and uses SBIR award/topic snapshots when the live SBIR API is unavailable. Reports include ranked tiers, dollar amounts, fit explanations, concerns, verification steps, next actions, historical recipients, Utah counts, and source links. The UX has a strong unified search entry point, agent-progress page, opportunity report, public automation narrative, and clear non-eligibility language. Type checks, eight Vitest tests, and production builds pass.

## Current weaknesses / risk areas

The matching score is partly deterministic topical overlap plus broad heuristics. It does not yet appear to have a robust, explicit test harness or demo script proving quality across all five standard cases. Procurement is mentioned conceptually but is not a clearly separate live data integration or report category. Broader assistance programs are correctly labeled as optional/unavailable when SAM credentials are absent, but the product therefore has a narrower live funding universe than the full brief.

The largest judging risk is the intentionally harder consumer/workforce case. The product must visibly return “probably not a fit” or a carefully adjacent result when federal grants are weak, rather than merely surfacing generic small-business or technology opportunities. A second risk is that a polished report can look stronger than the underlying evidence if the demo does not show the source trail and reasoning for each recommendation.

## Initial assessment

PlainText.legal is strongly aligned with the brief and is plausibly finalist-level. It has a distinctive interpretation layer, not a database clone, and it directly addresses the core founder question. Winning is not predictable: the deciding factor will likely be demonstrated matching quality on the five shared test cases, especially correct negative results, plus a concise live demo that makes the research feel trustworthy and fast.

## Highest-impact pre-judging work

1. Create a judge-mode test harness or seeded demo inputs for all five standard startups and verify the expected opportunity families and negative-result behavior.
2. Add an explicit “procurement / government customer” lane or clearly explain that Grants.gov and USAspending provide the current prototype’s procurement-adjacent evidence.
3. Make the demo report show one source-backed reason, one concern, one verification step, and one historical award per top opportunity.
4. Prepare a 90-second demo flow: founder description → agent stages → translated profile → ranked opportunities → historical evidence → honest “not a strong match” example.
5. If time permits, improve ranking with field-aware eligibility checks for employee count, location, capital need, R&D, and applicant type rather than relying mainly on textual overlap.

## References

[1]: https://startupstate-hackathon-brief.lovable.app/?referrer=luma&utm_source=luma#challenge "Government Opportunity Finder — Hackathon Brief"
