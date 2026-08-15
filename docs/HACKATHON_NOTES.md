# PlainText.legal — Research, Product, and Demo Notes

## Product thesis

PlainText.legal treats public funding discovery as a **research-agent workflow**, not a keyword search. A founder supplies a company narrative and may add a public domain. The system extracts a cautious startup profile, translates the narrative into government terminology, runs focused current-opportunity searches, investigates official opportunity records, compares historical award evidence, adds SBIR/STTR R&D context, and organizes the resulting evidence into a **Government Opportunity Map**.

> The product does not decide eligibility, offer legal advice, or promise funding. Every map shows the evidence, the uncertainty, the questions to verify, the next steps, and direct official-source links.

## Data-source implementation

| Source | Product use | Current implementation |
|---|---|---|
| Grants.gov Search2 and fetchOpportunity | Current posted and forecasted opportunities, notices, agency, dates, applicant text, and values when returned | **Live and unauthenticated.** The agent runs multiple translated queries and opens the leading official records for investigation. [1] [2] |
| USAspending V2 | Historical award evidence, amounts, recipient organizations, agency patterns, and Utah award evidence | **Live and unauthenticated.** The report calls the award search and award-count endpoints; Utah recipient organizations are counted from the returned Utah evidence page. [3] |
| SBIR.gov | R&D award precedent, technology-area context, and open topic / solicitation context | **Reliable offline fallback.** Compact snapshots are reproducibly generated from SBIR.gov’s public award CSV and public open-topic pages because the live SBIR API documents ongoing maintenance. [4] [5] [11] |
| SAM.gov Assistance Listings | Broader persistent programs including grants, loans, and assistance | **Optional enrichment.** Its public API requires a SAM key; SAM key generation is currently unavailable, so the application labels this layer transparently instead of blocking its live core. [6] |
| Utah public company records | Future company-event input | **Public-records pathway.** Utah offers a Business Entity Search and a Business Entity List service that lets a user build and customize a list of businesses registered with the Division of Corporations. The public product can monitor a legitimately obtained list or permitted feed rather than claim direct access to an undocumented event API. [7] |
| `.ai` registration data | Future domain-event input | **Partner-feed / opt-in boundary.** WHOIS/RDAP checks a known domain; it is not a complete new-registration event stream. The public `.ai` registry is managed for Anguilla and lists WHOIS and RDAP services. [8] [9] |

## Tested founder scenario

The live end-to-end smoke test used a 15-person Utah digital-health startup with AI-powered hospital workflow software, $1M ARR, seed funding, and a $500K–$2M need for product development and hospital pilots. The app returned seven live Grants.gov candidates, performed three USAspending historical-term investigations, matched five SBIR snapshot records, persisted the report, and rendered it on a public report route. The representative top results included NIH and NSF opportunities; the report foregrounded source links and eligibility caveats rather than presenting them as determinations.

## Automation boundary

The launchable MVP supports founder-initiated scans and a `Scan a company` handoff. A public domain is fetched only after a user supplies it, and only accessible homepage text is used as supplemental context. The future operational path accepts licensed domain events or opt-in domains and authorized Utah registration exports, with a consented founder-email relationship stored only after the founder explicitly opts in. This avoids claiming that WHOIS can discover every `.ai` purchase or using private/redacted registration contact data for outreach.

## References

[1]: https://grants.gov/api/api-guide "Grants.gov API Guide"
[2]: https://grants.gov/api/common/fetchopportunity "Grants.gov fetchOpportunity"
[3]: https://api.usaspending.gov/docs/intro-tutorial "USAspending API — Introductory Tutorial"
[4]: https://www.sbir.gov/data-resources "SBIR.gov Data Resources"
[5]: https://www.sbir.gov/api "SBIR.gov API"
[6]: https://open.gsa.gov/api/assistance-listings-api/ "SAM.gov Assistance Listings Public API"
[7]: https://commerce.utah.gov/corporations/searches/ "Utah Division of Corporations — Searches"
[8]: https://www.iana.org/domains/root/db/ai.html "IANA — Delegation Record for .AI"
[10]: https://www.nic.ai/faq "Official .AI Registry FAQ"
[11]: https://www.sbir.gov/topics "SBIR.gov Funding Opportunities — Open Topics"
