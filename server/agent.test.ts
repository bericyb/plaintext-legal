import { describe, expect, it } from "vitest";
import { applyScreeningDecisions, buildOpportunity, fallbackProfile, findSbirEvidence, findSbirTopics, getSamEnrichment, inspectPublicWebsite, scoreOpportunity, type Opportunity, type StartupProfile } from "./agent";

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


describe("conservative domain-aware ranking", () => {
  const waterProfile: StartupProfile = {
    ...profile,
    companyName: "LeakSense",
    industry: "Smart water infrastructure",
    technology: "Sensor and AI platform for municipal water-loss detection",
    coreProblem: "Reduce non-revenue water and detect leaks for municipal utilities.",
    targetCustomers: "Municipal water utilities",
    keywords: ["water", "utility", "leak", "municipal", "sensor", "AI"],
    governmentTerms: ["water infrastructure", "water loss", "water utility", "environmental technology"],
  };

  it("keeps a healthcare-specific opportunity above generic cybersecurity infrastructure", () => {
    const relevant = scoreOpportunity(profile, { id: "health-1", title: "Clinical Workflow Innovation for Hospitals", agency: "National Institutes of Health" }, { synopsis: { synopsisDesc: "Small business research for hospital clinical workflow, nursing innovation, and health information technology.", applicantTypes: [{ description: "Small businesses" }] } });
    const generic = scoreOpportunity(profile, { id: "cyber-1", title: "Cybersecurity Innovation for Cyberinfrastructure", agency: "National Science Foundation" }, { synopsis: { synopsisDesc: "Advance cybersecurity and privacy for scientific computing infrastructure and collaborative research." } });
    expect(relevant.score).toBeGreaterThan(generic.score);
    expect(relevant.tier).toBe("Likely Fit");
    expect(generic.tier).not.toBe("Likely Fit");
  });

  it("rejects a water-quality-adjacent feral-swine program without water-loss evidence", () => {
    const irrelevant = scoreOpportunity(waterProfile, { id: "swine-1", title: "Feral Swine Eradication and Control Pilot Program", agency: "USDA" }, { synopsis: { synopsisDesc: "Control invasive feral swine that threaten agriculture, ecosystems, and water quality." } });
    expect(irrelevant.tier).toBe("Probably Not a Fit");
    expect(irrelevant.score).toBeLessThan(34);
  });

  it("keeps a municipal water-loss program strong when domain and agency evidence agree", () => {
    const relevant = scoreOpportunity(waterProfile, { id: "water-1", title: "WaterSMART Water Conservation and Efficiency Projects", agency: "Bureau of Reclamation" }, { synopsis: { synopsisDesc: "Support municipal water utilities implementing water-loss reduction, leak detection, and water infrastructure efficiency projects." } });
    expect(relevant.tier).toBe("Likely Fit");
    expect(relevant.matchedTerms).toEqual(expect.arrayContaining(["municipal water", "water infrastructure"]));
  });
});

describe("final relevance screening", () => {
  const opportunity = (id: string, title: string, score: number): Opportunity => ({
    id, number: id, title, agency: "Agency", status: "posted", deadline: "2027-01-01", openDate: "2026-01-01", value: "Not stated in summary", description: title,
    eligibility: ["Review official notice"], sourceUrl: "https://grants.gov", score, tier: score >= 76 ? "Likely Fit" : score >= 55 ? "Potential Fit" : score >= 34 ? "Adjacent" : "Probably Not a Fit", matchedTerms: [], whyFit: "Research match", concerns: [], verify: [], nextSteps: [], sbirEvidence: [],
  });

  it("demotes a weak result and preserves an auditable reviewer explanation", () => {
    const result = applyScreeningDecisions([opportunity("water", "Water infrastructure", 76)], [{ opportunityId: "water", decision: "demote", confidence: "high", scoreAdjustment: -30, reason: "Applicant pathway is unclear.", checks: ["Verify applicant type"] }]);
    expect(result[0]?.tier).toBe("Adjacent");
    expect(result[0]?.screening?.reason).toContain("Applicant pathway");
    expect(result[0]?.concerns.join(" ")).toContain("Final screening");
  });

  it("removes a plainly unrelated result", () => {
    const result = applyScreeningDecisions([opportunity("swine", "Feral swine eradication", 55)], [{ opportunityId: "swine", decision: "remove", confidence: "high", scoreAdjustment: -40, reason: "No water-loss or startup pathway.", checks: ["Domain mismatch"] }]);
    expect(result).toHaveLength(0);
  });

  it("preserves deterministic ranking when a candidate has no screening decision", () => {
    const result = applyScreeningDecisions([opportunity("a", "Relevant", 70), opportunity("b", "Adjacent", 50)], []);
    expect(result.map((item) => item.id)).toEqual(["a", "b"]);
  });
});
