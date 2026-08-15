import { researchOpportunities } from "../server/agent.ts";

const report = await researchOpportunities({
  companyName: "NurseFlow",
  description: "We are a 15-person Utah digital health startup building AI-powered software that reduces the administrative workload on hospital nurses. We have $1M ARR, raised seed capital, and need $500K to $2M for product development, clinical workflow research, and hospital pilots.",
  industry: "Digital health",
  location: "Utah",
  employees: "15",
  revenue: "$1M ARR",
  fundingStage: "Seed",
  capitalNeed: "$500K–$2M",
  useOfFunds: "Product development and hospital pilots",
});

console.log(JSON.stringify({
  opportunities: report.opportunities.length,
  tiers: report.opportunities.map((item) => item.tier),
  researchSteps: report.agentActivity.map((item) => item.label),
  historicalTerms: report.historicalIntelligence.map((item) => item.searchTerm),
  sbirMatches: report.sbirFallback.matchedAwards,
  sbirCurrentTopics: report.sbirFallback.currentTopics.length,
  firstOpportunity: report.opportunities[0] ? { title: report.opportunities[0].title, agency: report.opportunities[0].agency, history: report.opportunities[0].history?.utahAwardCount } : null,
}, null, 2));
