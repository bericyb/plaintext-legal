import { invokeLLM } from "./_core/llm";
import { sbirSnapshot, type SbirSnapshotAward } from "./data/sbirSnapshot";
import { sbirTopicsSnapshot, type SbirSnapshotTopic } from "./data/sbirTopicsSnapshot";

export type MatchTier = "Likely Fit" | "Potential Fit" | "Adjacent" | "Probably Not a Fit";

export type StartupInput = {
  companyName?: string;
  description: string;
  domain?: string;
  industry?: string;
  location?: string;
  employees?: string;
  revenue?: string;
  fundingStage?: string;
  capitalNeed?: string;
  useOfFunds?: string;
  source?: "founder" | "domain" | "utah";
};

export type StartupProfile = {
  companyName: string;
  industry: string;
  technology: string;
  location: string;
  employeeBand: string;
  revenueBand: string;
  fundingStage: string;
  capitalNeed: string;
  useOfFunds: string;
  targetCustomers: string;
  rAndD: string;
  coreProblem: string;
  keywords: string[];
  governmentTerms: string[];
  confidence: "high" | "medium" | "low";
  websiteEvidence?: { url: string; summary: string };
};

export type ResearchPlan = {
  objective: string;
  searches: Array<{ query: string; reason: string; source: "Grants.gov" | "USAspending" | "SBIR snapshot" | "SAM.gov" }>;
  agenciesToInvestigate: string[];
  verificationPriorities: string[];
};

export type HistoryEvidence = {
  searchTerm: string;
  awardCount: number;
  utahAwardCount: number;
  utahRecipientCount: number;
  totalAwardAmount: number;
  medianAwardAmount: number;
  topRecipients: Array<{ name: string; amount: number; agency: string }>;
  agencyPatterns: string[];
  note: string;
};

export type SbirEvidence = {
  title: string;
  agency: string;
  phase: string;
  year: string;
  amount: number;
  recipient: string;
  state: string;
  whyRelevant: string;
  sourceUrl: string;
};

export type SbirTopicEvidence = {
  title: string;
  whyRelevant: string;
  sourceUrl: string;
};

export type SamEnrichment = {
  status: "available" | "unavailable" | "partial";
  searchTerms: string[];
  message: string;
  listings: Array<{ title: string; agency: string; listingId: string; description: string; sourceUrl: string }>;
};

export type Opportunity = {
  id: string;
  number: string;
  title: string;
  agency: string;
  status: string;
  deadline: string;
  openDate: string;
  value: string;
  description: string;
  eligibility: string[];
  sourceUrl: string;
  score: number;
  tier: MatchTier;
  matchedTerms: string[];
  whyFit: string;
  concerns: string[];
  verify: string[];
  nextSteps: string[];
  history?: HistoryEvidence;
  sbirEvidence: SbirEvidence[];
  screening?: { decision: ScreeningDecision["decision"]; confidence: ScreeningDecision["confidence"]; reason: string; checks: string[] };
};

export type AgentReport = {
  generatedAt: string;
  profile: StartupProfile;
  researchPlan: ResearchPlan;
  agentActivity: Array<{ label: string; detail: string; status: "complete" | "partial" }>;
  summary: { opportunityCount: number; likelyFitCount: number; agencies: string[]; closingSoonCount: number };
  opportunities: Opportunity[];
  historicalIntelligence: HistoryEvidence[];
  sbirFallback: { status: "ready"; matchedAwards: number; currentTopics: SbirTopicEvidence[]; source: string; note: string };
  samEnrichment: SamEnrichment;
  notices: string[];
  sourceNotes: Array<{ label: string; url: string }>;
};

const GRANTS_SEARCH_URL = "https://api.grants.gov/v1/api/search2";
const GRANTS_DETAIL_URL = "https://api.grants.gov/v1/api/fetchOpportunity";
const USA_AWARDS_URL = "https://api.usaspending.gov/api/v2/search/spending_by_award/";
const USA_COUNT_URL = "https://api.usaspending.gov/api/v2/search/spending_by_award_count/";
const CURRENT_YEAR = new Date().getUTCFullYear();

const FALLBACK_TERMS = [
  "small business innovation research",
  "technology commercialization",
  "research and development",
  "innovation",
  "small business",
];

function cleanText(value: string, limit = 1800) {
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
}

function asUrl(value?: string) {
  if (!value?.trim()) return undefined;
  const withProtocol = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;
  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) return undefined;
    if (url.hostname === "localhost" || url.hostname.endsWith(".local") || /^127\.|^10\.|^192\.168\.|^169\.254\.|^0\./.test(url.hostname)) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

export async function inspectPublicWebsite(domain?: string) {
  const url = asUrl(domain);
  if (!url) return undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "PlainTextLegalResearchBot/1.0 (+https://plaintext.legal)" },
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("text/html")) return undefined;
    const html = (await response.text()).slice(0, 120_000);
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
    const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] || "";
    const body = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ");
    const summary = cleanText(`${title}. ${description}. ${body}`, 1800);
    return summary ? { url: url.toString(), summary } : undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

export function fallbackProfile(input: StartupInput, websiteEvidence?: { url: string; summary: string }): StartupProfile {
  const joined = cleanText(`${input.description} ${websiteEvidence?.summary || ""}`, 3000);
  const words = Array.from(new Set(joined.toLowerCase().match(/[a-z][a-z0-9/-]{3,}/g) || [])).slice(0, 10);
  const lower = joined.toLowerCase();
  const contextualTerms = [
    ...(lower.match(/health|hospital|nurse|clinical|medical/) ? ["digital health", "health information technology", "clinical workflow", "nursing innovation"] : []),
    ...(lower.match(/ai|machine learning|artificial intelligence/) ? ["artificial intelligence", "applied machine learning", "technology commercialization"] : []),
    ...(lower.match(/cyber|security|threat/) ? ["cybersecurity", "network defense", "critical infrastructure"] : []),
    ...(lower.match(/water|climate|environment|energy/) ? ["environmental technology", "water infrastructure", "clean energy innovation"] : []),
    ...(lower.match(/manufactur|aerospace|component/) ? ["advanced manufacturing", "aerospace technology", "materials research"] : []),
    "small business innovation research",
    "research and development",
  ];
  return {
    companyName: input.companyName?.trim() || "Your company",
    industry: input.industry?.trim() || "Not specified",
    technology: "Not specified",
    location: input.location?.trim() || "Not specified",
    employeeBand: input.employees?.trim() || "Not specified",
    revenueBand: input.revenue?.trim() || "Not specified",
    fundingStage: input.fundingStage?.trim() || "Not specified",
    capitalNeed: input.capitalNeed?.trim() || "Not specified",
    useOfFunds: input.useOfFunds?.trim() || "Not specified",
    targetCustomers: "Not specified",
    rAndD: "Needs founder verification",
    coreProblem: cleanText(input.description, 360),
    keywords: words,
    governmentTerms: Array.from(new Set(contextualTerms.concat(FALLBACK_TERMS))).slice(0, 8),
    confidence: "low",
    websiteEvidence,
  };
}

function parseJson(content: unknown) {
  if (typeof content !== "string") return undefined;
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export async function buildStartupProfile(input: StartupInput, websiteEvidence?: { url: string; summary: string }): Promise<StartupProfile> {
  const fallback = fallbackProfile(input, websiteEvidence);
  const founderText = cleanText(input.description, 3000);
  try {
    const response = await invokeLLM({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content:
            "You extract a conservative structured startup profile for a government-opportunity research agent. Treat founder-provided text as primary. Website text is supplemental public evidence only. Never infer legal eligibility. Use 'Not specified' when absent. Produce only the required JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({
            founderDescription: founderText,
            structuredFields: {
              companyName: input.companyName, industry: input.industry, location: input.location, employees: input.employees,
              revenue: input.revenue, fundingStage: input.fundingStage, capitalNeed: input.capitalNeed, useOfFunds: input.useOfFunds,
            },
            publicWebsiteEvidence: websiteEvidence?.summary,
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "startup_profile",
          strict: true,
          schema: {
            type: "object",
            properties: {
              companyName: { type: "string" }, industry: { type: "string" }, technology: { type: "string" }, location: { type: "string" },
              employeeBand: { type: "string" }, revenueBand: { type: "string" }, fundingStage: { type: "string" }, capitalNeed: { type: "string" },
              useOfFunds: { type: "string" }, targetCustomers: { type: "string" }, rAndD: { type: "string" }, coreProblem: { type: "string" },
              keywords: { type: "array", items: { type: "string" } }, governmentTerms: { type: "array", items: { type: "string" } },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
            },
            required: ["companyName", "industry", "technology", "location", "employeeBand", "revenueBand", "fundingStage", "capitalNeed", "useOfFunds", "targetCustomers", "rAndD", "coreProblem", "keywords", "governmentTerms", "confidence"],
            additionalProperties: false,
          },
        },
      },
    });
    const parsed = parseJson(response.choices[0]?.message?.content);
    if (!parsed) return fallback;
    return {
      ...fallback,
      ...parsed,
      companyName: input.companyName?.trim() || String(parsed.companyName || fallback.companyName),
      industry: input.industry?.trim() || String(parsed.industry || fallback.industry),
      location: input.location?.trim() || String(parsed.location || fallback.location),
      employeeBand: input.employees?.trim() || String(parsed.employeeBand || fallback.employeeBand),
      revenueBand: input.revenue?.trim() || String(parsed.revenueBand || fallback.revenueBand),
      fundingStage: input.fundingStage?.trim() || String(parsed.fundingStage || fallback.fundingStage),
      capitalNeed: input.capitalNeed?.trim() || String(parsed.capitalNeed || fallback.capitalNeed),
      useOfFunds: input.useOfFunds?.trim() || String(parsed.useOfFunds || fallback.useOfFunds),
      keywords: Array.isArray(parsed.keywords) && parsed.keywords.some((term) => String(term).toLowerCase() !== "not specified") ? parsed.keywords.map(String).slice(0, 12) : fallback.keywords,
      governmentTerms: Array.isArray(parsed.governmentTerms) && parsed.governmentTerms.some((term) => String(term).toLowerCase() !== "not specified") ? parsed.governmentTerms.map(String).slice(0, 8) : fallback.governmentTerms,
      websiteEvidence,
    };
  } catch {
    return fallback;
  }
}

export async function makeResearchPlan(profile: StartupProfile): Promise<ResearchPlan> {
  const fallback: ResearchPlan = {
    objective: `Find non-dilutive capital, research programs, and adjacent public support relevant to ${profile.companyName}.`,
    searches: profile.governmentTerms.slice(0, 5).map((query, index) => ({
      query,
      reason: index === 0 ? "Translate the founder's problem into a federal-program search." : "Investigate an adjacent government term.",
      source: index < 3 ? "Grants.gov" : index === 3 ? "USAspending" : "SBIR snapshot",
    })),
    agenciesToInvestigate: ["NSF", "HHS", "DOE", "DHS"],
    verificationPriorities: ["Applicant type and small-business requirements", "Research / commercialization fit", "Deadline and registration steps"],
  };
  try {
    const response = await invokeLLM({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: "You create a compact, conservative research plan for a startup seeking government support. The plan must investigate, not promise eligibility. Produce only required JSON.",
        },
        { role: "user", content: JSON.stringify(profile) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "government_research_plan",
          strict: true,
          schema: {
            type: "object",
            properties: {
              objective: { type: "string" },
              searches: {
                type: "array",
                items: { type: "object", properties: { query: { type: "string" }, reason: { type: "string" }, source: { type: "string", enum: ["Grants.gov", "USAspending", "SBIR snapshot", "SAM.gov"] } }, required: ["query", "reason", "source"], additionalProperties: false },
              },
              agenciesToInvestigate: { type: "array", items: { type: "string" } },
              verificationPriorities: { type: "array", items: { type: "string" } },
            },
            required: ["objective", "searches", "agenciesToInvestigate", "verificationPriorities"],
            additionalProperties: false,
          },
        },
      },
    });
    const parsed = parseJson(response.choices[0]?.message?.content);
    if (!parsed || !Array.isArray(parsed.searches)) return fallback;
    const allowed = new Set(["Grants.gov", "USAspending", "SBIR snapshot", "SAM.gov"]);
    return {
      objective: String(parsed.objective || fallback.objective),
      searches: parsed.searches.slice(0, 6).map((item) => {
        const value = item as Record<string, unknown>;
        return {
          query: String(value.query || "innovation"),
          reason: String(value.reason || "Investigate a relevant government term."),
          source: allowed.has(String(value.source)) ? (String(value.source) as ResearchPlan["searches"][number]["source"]) : "Grants.gov",
        };
      }),
      agenciesToInvestigate: Array.isArray(parsed.agenciesToInvestigate) ? parsed.agenciesToInvestigate.map(String).slice(0, 6) : fallback.agenciesToInvestigate,
      verificationPriorities: Array.isArray(parsed.verificationPriorities) ? parsed.verificationPriorities.map(String).slice(0, 5) : fallback.verificationPriorities,
    };
  } catch {
    return fallback;
  }
}

async function postJson(url: string, body: unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 14_000);
  try {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
    if (!response.ok) throw new Error(`Government source returned ${response.status}`);
    return await response.json() as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }
}

type GrantHit = { id: string | number; number?: string; title?: string; agency?: string; agencyName?: string; agencyCode?: string; openDate?: string; closeDate?: string; oppStatus?: string };

async function searchGrants(query: string): Promise<GrantHit[]> {
  const response = await postJson(GRANTS_SEARCH_URL, { rows: 12, keyword: query, oppStatuses: "posted|forecasted" });
  const data = response.data as { oppHits?: GrantHit[] } | undefined;
  return data?.oppHits || [];
}

async function grantDetail(id: string | number) {
  try {
    const response = await postJson(GRANTS_DETAIL_URL, { opportunityId: Number(id) });
    return response.data as Record<string, unknown> | undefined;
  } catch {
    return undefined;
  }
}

function valueOrUnknown(value: unknown, formatted?: unknown) {
  const text = String(formatted || value || "").trim();
  return text ? `$${text.replace(/^\$/, "")}` : "Not stated in summary";
}

function daysUntil(dateText: string) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return undefined;
  return Math.floor((date.getTime() - Date.now()) / 86_400_000);
}

function domainSignals(profile: StartupProfile) {
  const profileText = [profile.industry, profile.technology, profile.coreProblem, profile.targetCustomers, ...profile.keywords, ...profile.governmentTerms].join(" ").toLowerCase();
  if (/health|clinical|hospital|nurs|medical|patient/.test(profileText)) {
    return {
      core: ["health", "clinical", "hospital", "nurs", "medical", "patient", "health information technology"],
      agencies: ["hhs", "nih", "ahrq", "hrsa", "cms", "va", "cdc", "fda"],
      mismatch: ["feral swine", "immigration", "foreign", "mozambique", "tunisia", "greece", "egypt", "scholarship for service", "stem education"],
    };
  }
  if (/water|wastewater|utility|leak|climate|environment/.test(profileText)) {
    return {
      core: ["water loss", "non-revenue water", "water utility", "municipal water", "leak detection", "water infrastructure", "wastewater", "watersmart"],
      agencies: ["epa", "reclamation", "watersmart", "rural utilities", "usda", "doe"],
      mismatch: ["feral swine", "invasive species", "immigration", "foreign", "mozambique", "tunisia", "greece", "egypt", "preschool", "trafficking"],
    };
  }
  if (/cyber|security|threat|network defense/.test(profileText)) {
    return {
      core: ["cybersecurity", "cyber security", "threat detection", "network defense", "information security", "critical infrastructure"],
      agencies: ["dhs", "cisa", "defense", "dod", "nist", "nsf"],
      mismatch: ["foreign", "mozambique", "tunisia", "greece", "egypt", "scholarship", "education", "trafficking"],
    };
  }
  if (/manufactur|aerospace|materials|component/.test(profileText)) {
    return {
      core: ["advanced manufacturing", "aerospace", "lightweight", "materials", "components", "manufacturing scale-up"],
      agencies: ["nasa", "defense", "dod", "darpa", "doe", "nist", "nsf"],
      mismatch: ["foreign", "mozambique", "tunisia", "greece", "egypt", "preschool", "trafficking"],
    };
  }
  return {
    core: Array.from(new Set([profile.industry, profile.technology, ...profile.keywords].map((term) => cleanText(String(term), 80).toLowerCase()).filter((term) => term.length >= 4))).slice(0, 10),
    agencies: [],
    mismatch: ["foreign", "mozambique", "tunisia", "greece", "egypt", "feral swine", "invasive species"],
  };
}

export function scoreOpportunity(profile: StartupProfile, hit: GrantHit, detail?: Record<string, unknown>) {
  const synopsis = (detail?.synopsis || {}) as Record<string, unknown>;
  // Never include the startup's own description in the opportunity text. Doing so makes every result appear to match itself.
  const text = cleanText([hit.title, hit.agency, hit.agencyName, synopsis.synopsisDesc, detail?.opportunityTitle].join(" "), 6000).toLowerCase();
  const signals = domainSignals(profile);
  const terms = Array.from(new Set([...profile.keywords, ...profile.governmentTerms, profile.industry, profile.technology]))
    .map((term) => cleanText(String(term), 80).toLowerCase())
    .filter((term) => term.length >= 3);
  const matchedTerms = terms.filter((term) => text.includes(term)).slice(0, 6);
  const coreMatches = signals.core.filter((term) => text.includes(term)).slice(0, 4);
  const agencyMatches = signals.agencies.filter((term) => text.includes(term));
  const hasRAndD = /research|innovation|sbir|sttr|technology|commercialization|prototype/i.test(text);
  const hasSmallBusiness = /small business|business|commercial/i.test(text);
  const institutionFocused = /school|college|university|academic institution|nursing research center/i.test(text) && !/small business|commercialization|company|business/i.test(text);
  const hardMismatch = signals.mismatch.some((term) => text.includes(term));
  const domainEvidence = coreMatches.length >= 2 || (coreMatches.length >= 1 && agencyMatches.length > 0);
  const rawScore = 10 + matchedTerms.length * 4 + coreMatches.length * 16 + (agencyMatches.length ? 10 : 0) + (hasRAndD ? 8 : 0) + (hasSmallBusiness ? 5 : 0);
  const score = Math.max(0, Math.min(96, rawScore - (domainEvidence ? 0 : 24) - (hardMismatch ? 35 : 0) - (institutionFocused ? 20 : 0)));
  const tier: MatchTier = score >= 76 ? "Likely Fit" : score >= 55 ? "Potential Fit" : score >= 34 ? "Adjacent" : "Probably Not a Fit";
  return { score, tier, matchedTerms: Array.from(new Set([...coreMatches, ...matchedTerms])).slice(0, 6), hasRAndD, hasSmallBusiness };
}

export function buildOpportunity(profile: StartupProfile, hit: GrantHit, detail?: Record<string, unknown>): Opportunity {
  const synopsis = (detail?.synopsis || {}) as Record<string, unknown>;
  const eligibilityValues = Array.isArray(synopsis.applicantTypes) ? synopsis.applicantTypes.map((item) => String((item as Record<string, unknown>).description || "")).filter(Boolean) : [];
  const eligibility = eligibilityValues.length ? eligibilityValues : ["Applicant type is not available in the returned synopsis; review the official notice."];
  const score = scoreOpportunity(profile, hit, detail);
  const deadline = String(synopsis.responseDateDesc || hit.closeDate || "Check official notice");
  const concerns = [
    "This is a research assessment, not an eligibility determination.",
    score.hasSmallBusiness ? "Confirm your entity, ownership, and any size-standard requirements." : "The returned synopsis does not clearly confirm a small-business pathway.",
    score.hasRAndD ? "Confirm that your proposed work is a qualifying research or technology-development activity." : "Confirm whether the program supports your work type, rather than assuming product development is eligible.",
  ];
  return {
    id: String(hit.id), number: String(detail?.opportunityNumber || hit.number || "Not stated"), title: String(detail?.opportunityTitle || hit.title || "Untitled opportunity"),
    agency: String((detail?.agencyDetails as Record<string, unknown> | undefined)?.agencyName || hit.agency || hit.agencyName || hit.agencyCode || "Agency not stated"),
    status: String(hit.oppStatus || detail?.docType || "posted"), deadline, openDate: String(synopsis.postingDate || hit.openDate || "Not stated"),
    value: valueOrUnknown(synopsis.awardCeiling, synopsis.awardCeilingFormatted), description: cleanText(String(synopsis.synopsisDesc || "Official synopsis not returned; open the official source before proceeding."), 1500),
    eligibility, sourceUrl: `https://www.grants.gov/search-results-detail/${hit.id}`,
    score: score.score, tier: score.tier, matchedTerms: score.matchedTerms,
    whyFit: score.matchedTerms.length ? `The opportunity language overlaps with ${score.matchedTerms.join(", ")}. ${score.hasRAndD ? "Its description also indicates an R&D, innovation, or technology component." : "The fit is based on topical overlap and needs careful verification."}` : "The match is adjacent based on the agent's translated research terms; verify the official scope before investing time.",
    concerns, verify: ["Read the official synopsis and full announcement.", "Verify applicant type, location, size, ownership, cost-share, and registration requirements.", "Confirm the deadline and any pre-application steps with the agency contact."],
    nextSteps: ["Open the official notice.", "Compare your planned work and budget against the stated program purpose.", "Create a short go/no-go checklist before beginning an application."],
    sbirEvidence: [],
  };
}

export type ScreeningDecision = {
  opportunityId: string;
  decision: "keep" | "demote" | "remove";
  confidence: "high" | "medium" | "low";
  scoreAdjustment: number;
  reason: string;
  checks: string[];
};

function safeJson<T>(content: unknown): T | undefined {
  if (typeof content !== "string") return undefined;
  try { return JSON.parse(content) as T; } catch { return undefined; }
}

export function applyScreeningDecisions(opportunities: Opportunity[], decisions: ScreeningDecision[]) {
  const byId = new Map(decisions.map((decision) => [decision.opportunityId, decision]));
  return opportunities
    .map((opportunity) => {
      const decision = byId.get(opportunity.id);
      if (!decision) return opportunity;
      const score = Math.max(0, Math.min(96, opportunity.score + Math.min(0, decision.scoreAdjustment)));
      const tier: MatchTier = score >= 76 ? "Likely Fit" : score >= 55 ? "Potential Fit" : score >= 34 ? "Adjacent" : "Probably Not a Fit";
      return {
        ...opportunity,
        score,
        tier,
        concerns: Array.from(new Set([...opportunity.concerns, `Final screening: ${decision.reason}`])),
        screening: { decision: decision.decision, confidence: decision.confidence, reason: decision.reason, checks: decision.checks },
      };
    })
    .filter((opportunity) => byId.get(opportunity.id)?.decision !== "remove")
    .sort((a, b) => b.score - a.score);
}

async function screenOpportunityShortlist(profile: StartupProfile, opportunities: Opportunity[]): Promise<{ opportunities: Opportunity[]; status: "complete" | "fallback"; note: string }> {
  if (!opportunities.length) return { opportunities, status: "complete", note: "No opportunities required final screening." };
  const candidatePayload = opportunities.map((opportunity) => ({
    opportunityId: opportunity.id,
    title: opportunity.title,
    agency: opportunity.agency,
    deadline: opportunity.deadline,
    tier: opportunity.tier,
    score: opportunity.score,
    description: opportunity.description.slice(0, 900),
    eligibility: opportunity.eligibility.slice(0, 5),
    matchedTerms: opportunity.matchedTerms,
  }));
  try {
    const response = await invokeLLM({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: "You are the final relevance and accuracy screener for a government-opportunity research report. Be conservative: prefer a false negative to a false positive. Review only the supplied official opportunity metadata; do not invent facts. KEEP only when the program clearly aligns with the startup domain and a plausible applicant pathway. DEMOTE when the topic is adjacent, eligibility is unclear, the program is institution-focused, stale, foreign-only, education-only, or otherwise requires substantial verification. REMOVE when it is plainly unrelated, closed/obsolete, or cannot reasonably support the startup's stated work. A decision is a research-priority judgment, not an eligibility determination. Output JSON only.",
        },
        { role: "user", content: JSON.stringify({ startupProfile: { industry: profile.industry, technology: profile.technology, coreProblem: profile.coreProblem, targetCustomers: profile.targetCustomers, location: profile.location, capitalNeed: profile.capitalNeed, rAndD: profile.rAndD }, opportunities: candidatePayload }) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "opportunity_screening",
          strict: true,
          schema: {
            type: "object",
            properties: {
              decisions: {
                type: "array",
                items: { type: "object", properties: {
                  opportunityId: { type: "string" },
                  decision: { type: "string", enum: ["keep", "demote", "remove"] },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                  scoreAdjustment: { type: "integer", minimum: -40, maximum: 0 },
                  reason: { type: "string" },
                  checks: { type: "array", items: { type: "string" } },
                }, required: ["opportunityId", "decision", "confidence", "scoreAdjustment", "reason", "checks"], additionalProperties: false },
              },
            },
            required: ["decisions"], additionalProperties: false,
          },
        },
      },
    });
    const parsed = safeJson<{ decisions?: ScreeningDecision[] }>(response.choices[0]?.message?.content);
    const validIds = new Set(opportunities.map((opportunity) => opportunity.id));
    const decisions = Array.isArray(parsed?.decisions) ? parsed.decisions.filter((decision) => validIds.has(decision.opportunityId)).map((decision) => ({
      ...decision,
      scoreAdjustment: Math.min(0, Math.max(-40, Number(decision.scoreAdjustment) || 0)),
      reason: String(decision.reason || "Final reviewer found insufficient evidence for a stronger match."),
      checks: Array.isArray(decision.checks) ? decision.checks.map(String).slice(0, 5) : [],
    })) : [];
    if (decisions.length !== opportunities.length) return { opportunities, status: "fallback", note: "The final relevance screener returned an incomplete decision set, so deterministic ranking was preserved." };
    return { opportunities: applyScreeningDecisions(opportunities, decisions), status: "complete", note: "A conservative final relevance screen reviewed domain fit, applicant pathway, freshness, and semantic mismatch before report assembly." };
  } catch {
    return { opportunities, status: "fallback", note: "The final relevance screener was unavailable, so deterministic conservative ranking was preserved." };
  }
}

function normalizedAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

function filtersFor(term: string, utah = false) {
  return {
    time_period: [{ start_date: `${CURRENT_YEAR - 3}-01-01`, end_date: `${CURRENT_YEAR}-12-31` }],
    award_type_codes: ["02", "03", "04", "05"],
    keywords: [term],
    ...(utah ? { recipient_locations: [{ country: "USA", state: "UT" }] } : {}),
  };
}

export async function awardIntelligence(term: string): Promise<HistoryEvidence | undefined> {
  try {
    const fields = ["Award ID", "Recipient Name", "Start Date", "Award Amount", "Awarding Agency", "Award Type", "Description"];
    const [national, utah, utahCount] = await Promise.all([
      postJson(USA_AWARDS_URL, { filters: filtersFor(term), fields, limit: 35, page: 1, sort: "Award Amount", order: "desc" }),
      postJson(USA_AWARDS_URL, { filters: filtersFor(term, true), fields, limit: 100, page: 1, sort: "Award Amount", order: "desc" }),
      postJson(USA_COUNT_URL, { filters: filtersFor(term, true) }),
    ]);
    const results = Array.isArray(national.results) ? national.results as Array<Record<string, unknown>> : [];
    const utahResults = Array.isArray(utah.results) ? utah.results as Array<Record<string, unknown>> : [];
    const countResults = (utahCount.results || {}) as Record<string, unknown>;
    const amounts = results.map((row) => normalizedAmount(row["Award Amount"])).filter(Boolean);
    const topRecipients = results.slice(0, 5).map((row) => ({ name: String(row["Recipient Name"] || "Recipient not stated"), amount: normalizedAmount(row["Award Amount"]), agency: String(row["Awarding Agency"] || "Agency not stated") }));
    const agencies = Array.from(new Set(results.map((row) => String(row["Awarding Agency"] || "")).filter(Boolean))).slice(0, 4);
    const utahAwardCount = Object.values(countResults).reduce<number>((sum, value) => sum + (Number(value) || 0), 0);
    return {
      searchTerm: term, awardCount: results.length, utahAwardCount, utahRecipientCount: new Set(utahResults.map((row) => String(row["Recipient Name"] || "")).filter(Boolean)).size,
      totalAwardAmount: amounts.reduce((sum, value) => sum + value, 0), medianAwardAmount: median(amounts), topRecipients, agencyPatterns: agencies,
      note: "Amounts and recipient organizations summarize the returned USAspending evidence sample for this research term. Utah award count is returned by the USAspending award-count endpoint; recipient organizations are counted from the first 100 matching Utah records.",
    };
  } catch {
    return undefined;
  }
}

function tokenSet(value: string) {
  return new Set(value.toLowerCase().match(/[a-z][a-z0-9/-]{3,}/g) || []);
}

export function findSbirEvidence(profile: StartupProfile, limit = 5): SbirEvidence[] {
  const terms = new Set([...profile.keywords, ...profile.governmentTerms, profile.industry, profile.technology].flatMap((term) => Array.from(tokenSet(String(term)))));
  const profileTerms = Array.from(terms);
  const ranked = sbirSnapshot.map((award) => {
    const awardTokens = tokenSet(`${award.title} ${award.keywords} ${award.abstract}`);
    const overlap = profileTerms.filter((term) => awardTokens.has(term));
    return { award, overlap, score: overlap.length };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  return ranked.map(({ award, overlap }) => toSbirEvidence(award, overlap));
}

function toSbirEvidence(award: SbirSnapshotAward, overlap: string[]): SbirEvidence {
  return { title: award.title, agency: award.agency || "Agency not stated", phase: award.phase || "Not stated", year: award.year || "Not stated", amount: award.amount, recipient: award.recipient || "Recipient not stated", state: award.state || "Not stated", whyRelevant: `Official SBIR award record shares ${overlap.slice(0, 4).join(", ")} with this company profile. It is historical context, not a current solicitation or eligibility promise.`, sourceUrl: award.sourceUrl };
}

export function findSbirTopics(profile: StartupProfile, limit = 4): SbirTopicEvidence[] {
  const terms = new Set([...profile.keywords, ...profile.governmentTerms, profile.industry, profile.technology].flatMap((term) => Array.from(tokenSet(String(term)))));
  const profileTerms = Array.from(terms);
  return sbirTopicsSnapshot.map((topic) => {
    const topicTokens = tokenSet(`${topic.title} ${topic.excerpt}`);
    const overlap = profileTerms.filter((term) => topicTokens.has(term));
    return { topic, overlap, score: overlap.length };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map(({ topic, overlap }) => toSbirTopicEvidence(topic, overlap));
}

function toSbirTopicEvidence(topic: SbirSnapshotTopic, overlap: string[]): SbirTopicEvidence {
  return { title: topic.title, whyRelevant: `This currently open SBIR/STTR topic page shares ${overlap.slice(0, 4).join(", ")} with the translated company profile. Review the agency's official solicitation before acting.`, sourceUrl: topic.sourceUrl };
}

export async function getSamEnrichment(profile: StartupProfile, plan: ResearchPlan): Promise<SamEnrichment> {
  const searchTerms = Array.from(new Set([...profile.governmentTerms, ...plan.searches.filter((search) => search.source === "SAM.gov").map((search) => search.query)])).slice(0, 6);
  const apiKey = process.env.SAM_API_KEY;
  if (!apiKey) {
    return { status: "unavailable", searchTerms, message: "SAM.gov Assistance Listings is an optional broader-assistance layer. It is not queried in this report because public API-key issuance is currently unavailable. Grants.gov, USAspending, and SBIR fallback research remain active.", listings: [] };
  }
  try {
    const url = new URL("https://api.sam.gov/assistance-listings/v1/search");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("status", "Active");
    url.searchParams.set("pageSize", "100");
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`SAM.gov returned ${response.status}`);
    const payload = await response.json() as { assistanceListingsData?: Array<Record<string, unknown>> };
    const terms = searchTerms.flatMap((term) => Array.from(tokenSet(term)));
    const listings = (payload.assistanceListingsData || []).map((listing) => {
      const overview = (listing.overview || {}) as Record<string, unknown>;
      const organization = (listing.federalOrganization || {}) as Record<string, unknown>;
      return { title: String(listing.title || "Assistance listing"), agency: String(organization.agency || organization.department || "Federal agency"), listingId: String(listing.assistanceListingId || "Not stated"), description: cleanText(String(overview.assistanceListingDescription || overview.objective || ""), 500), sourceUrl: String(listing.programWebPage || "https://sam.gov/assistance-listings") };
    }).filter((listing) => terms.some((term) => tokenSet(`${listing.title} ${listing.description}`).has(term))).slice(0, 5);
    return listings.length
      ? { status: "available", searchTerms, message: "SAM.gov Assistance Listings returned broader active-assistance program context for the translated research terms.", listings }
      : { status: "partial", searchTerms, message: "SAM.gov Assistance Listings was queried, but the returned catalog page did not contain a strong term match. Search official program links directly.", listings: [] };
  } catch {
    return { status: "partial", searchTerms, message: "SAM.gov Assistance Listings could not be retrieved for this report. This does not affect the live Grants.gov, USAspending, or SBIR research layers.", listings: [] };
  }
}

export async function researchOpportunities(input: StartupInput): Promise<AgentReport> {
  const websiteEvidence = await inspectPublicWebsite(input.domain);
  const profile = await buildStartupProfile(input, websiteEvidence);
  const researchPlan = await makeResearchPlan(profile);
  const samEnrichment = await getSamEnrichment(profile, researchPlan);
  const liveQueries = Array.from(new Set(researchPlan.searches.filter((item) => item.source === "Grants.gov").map((item) => item.query).concat(profile.governmentTerms).filter(Boolean))).slice(0, 5);
  const searched = await Promise.all(liveQueries.map(async (query) => ({ query, hits: await searchGrants(query).catch(() => []) })));
  const unique = new Map<string, GrantHit>();
  searched.flatMap((entry) => entry.hits).forEach((hit) => unique.set(String(hit.id), hit));
  const shortlist = Array.from(unique.values()).slice(0, 10);
  const details = await Promise.all(shortlist.map((hit) => grantDetail(hit.id)));
  const deterministicShortlist = shortlist.map((hit, index) => buildOpportunity(profile, hit, details[index])).sort((a, b) => b.score - a.score).slice(0, 10);
  const screening = await screenOpportunityShortlist(profile, deterministicShortlist);
  const opportunities = screening.opportunities.slice(0, 7);
  const historicalTerms = Array.from(new Set(opportunities.flatMap((opportunity) => opportunity.matchedTerms).filter((term) => term.length >= 4))).slice(0, 3);
  const historicalIntelligence = (await Promise.all(historicalTerms.map(awardIntelligence))).filter((item): item is HistoryEvidence => Boolean(item));
  opportunities.forEach((opportunity, index) => {
    opportunity.history = historicalIntelligence.find((item) => opportunity.matchedTerms.includes(item.searchTerm)) || historicalIntelligence[index % Math.max(historicalIntelligence.length, 1)];
    opportunity.sbirEvidence = findSbirEvidence({ ...profile, keywords: [...profile.keywords, ...opportunity.matchedTerms] }, 2);
  });
  const closingSoonCount = opportunities.filter((opportunity) => {
    const days = daysUntil(opportunity.deadline);
    return days !== undefined && days >= 0 && days <= 90;
  }).length;
  return {
    generatedAt: new Date().toISOString(), profile, researchPlan,
    agentActivity: [
      { label: "Read company context", detail: websiteEvidence ? "Combined the founder description with user-supplied public website evidence." : "Used the founder description and structured profile fields.", status: "complete" },
      { label: "Translated startup language", detail: `Prepared ${liveQueries.length} government-language Grants.gov searches across ${researchPlan.agenciesToInvestigate.join(", ") || "relevant agencies"}.`, status: "complete" },
      { label: "Investigated live opportunities", detail: `Searched live Grants.gov results and opened official detail records for ${shortlist.length} candidates.`, status: "complete" },
      { label: "Checked historical evidence", detail: historicalIntelligence.length ? `Queried USAspending for ${historicalIntelligence.length} relevant research term${historicalIntelligence.length === 1 ? "" : "s"}, including Utah evidence.` : "No historical USAspending evidence was returned for the shortlisted terms.", status: historicalIntelligence.length ? "complete" : "partial" },
      { label: "Applied R&D context", detail: "Matched official offline SBIR award and open-topic snapshots as reliable fallback context while the live SBIR API remains optional.", status: "complete" },
      { label: "Checked broader assistance", detail: samEnrichment.message, status: samEnrichment.status === "unavailable" ? "partial" : "complete" },
      { label: "Final relevance screen", detail: screening.note, status: screening.status === "complete" ? "complete" : "partial" },
    ],
    summary: { opportunityCount: opportunities.length, likelyFitCount: opportunities.filter((item) => item.tier === "Likely Fit").length, agencies: Array.from(new Set(opportunities.map((item) => item.agency))).slice(0, 6), closingSoonCount },
    opportunities, historicalIntelligence,
    sbirFallback: { status: "ready", matchedAwards: findSbirEvidence(profile).length, currentTopics: findSbirTopics(profile), source: "Official SBIR.gov award and open-topic snapshots", note: "The snapshots are reproducible fallbacks created from SBIR.gov public award data and public open-topic pages. The live SBIR API is treated as an optional enhancement because its documentation reports maintenance." },
    samEnrichment,
    notices: ["PlainText.legal organizes public information for research. It does not determine eligibility, provide legal advice, or guarantee funding.", "Always verify the official notice, applicant requirements, deadline, and registration steps before relying on a recommendation."],
    sourceNotes: [
      { label: "Live opportunities — Grants.gov", url: "https://grants.gov/api/common/search2" },
      { label: "Historical awards — USAspending", url: "https://api.usaspending.gov/docs/intro-tutorial" },
      { label: "SBIR fallback — SBIR.gov Data Resources", url: "https://www.sbir.gov/data-resources" },
      { label: "SAM.gov Assistance Listings — optional enrichment", url: "https://open.gsa.gov/api/assistance-listings-api/" },
    ],
  };
}
