import { describe, expect, it } from "vitest";
import { buildOpportunity, fallbackProfile, findSbirEvidence, findSbirTopics, getSamEnrichment, inspectPublicWebsite, scoreOpportunity, type StartupProfile } from "./agent";

const profile: StartupProfile = {
  companyName: "NurseFlow",
  industry: "Digital health",
  technology: "AI-powered hospital workflow software",
  location: "Utah",
  employeeBand: "15",
  revenueBand: "$1M ARR",
  fundingStage: "Seed",
  capitalNeed: "$500K–$2M",
  useOfFunds: "Product development and hospital pilots",
  targetCustomers: "Hospitals and clinical operations teams",
  rAndD: "Active product and AI research",
  coreProblem: "Reduce administrative burden for nurses.",
  keywords: ["health", "clinical", "hospital", "nurse", "AI"],
  governmentTerms: ["health information technology", "clinical workflow", "research and development", "technology commercialization"],
  confidence: "high",
};

describe("PlainText research agent", () => {
  it("gives an evidence-rich health technology opportunity a strong match tier without making an eligibility decision", () => {
    const hit = { id: "123", title: "Health Information Technology Innovation Research", agency: "HHS", oppStatus: "posted" };
    const detail = { opportunityTitle: hit.title, synopsis: { synopsisDesc: "Small business research and technology commercialization for hospital clinical workflow innovation.", applicantTypes: [{ description: "Small businesses" }] } };
    const score = scoreOpportunity(profile, hit, detail);
    const opportunity = buildOpportunity(profile, hit, detail);

    expect(score.tier).toBe("Likely Fit");
    expect(opportunity.concerns.join(" ")).toContain("not an eligibility determination");
    expect(opportunity.verify).toContain("Read the official synopsis and full announcement.");
  });

  it("returns source-attributed evidence from the official SBIR fallback snapshot when terms overlap", () => {
    const evidence = findSbirEvidence(profile);
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence[0]?.sourceUrl).toBe("https://www.sbir.gov/data-resources");
    expect(evidence[0]?.whyRelevant).toContain("historical context");
    const topics = findSbirTopics(profile);
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0]?.whyRelevant).toContain("currently open SBIR/STTR topic");
  });

  it("expands founder health-and-AI language into government research terminology when the LLM is unavailable", () => {
    const fallback = fallbackProfile({ description: "We build AI software that helps nurses and hospitals improve clinical workflows." });
    expect(fallback.governmentTerms).toContain("digital health");
    expect(fallback.governmentTerms).toContain("artificial intelligence");
    expect(fallback.governmentTerms).toContain("small business innovation research");
  });

  it("keeps the core research flow available when SAM.gov key issuance is unavailable", async () => {
    const priorKey = process.env.SAM_API_KEY;
    delete process.env.SAM_API_KEY;
    const enrichment = await getSamEnrichment(profile, { objective: "Research", searches: [{ query: "digital health assistance", reason: "Broader assistance", source: "SAM.gov" }], agenciesToInvestigate: [], verificationPriorities: [] });
    process.env.SAM_API_KEY = priorKey;
    expect(enrichment.status).toBe("unavailable");
    expect(enrichment.listings).toEqual([]);
    expect(enrichment.message).toContain("Grants.gov, USAspending, and SBIR fallback research remain active");
  });

  it("rejects a private local address before attempting public website inspection", async () => {
    await expect(inspectPublicWebsite("http://127.0.0.1:3000")).resolves.toBeUndefined();
  });
});
