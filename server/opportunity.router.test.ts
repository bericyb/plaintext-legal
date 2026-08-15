import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  createScan: vi.fn(),
  completeScanAndCreateReport: vi.fn(),
  getPublicReport: vi.fn(),
  markScanFailed: vi.fn(),
  addReportEmailOptIn: vi.fn(),
}));

const agent = vi.hoisted(() => ({
  researchOpportunities: vi.fn(),
}));

vi.mock("./db", () => db);
vi.mock("./agent", () => agent);

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("opportunity report persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.createScan.mockResolvedValue({ id: 41, publicId: "scan-1" });
    db.completeScanAndCreateReport.mockResolvedValue({ id: 8, publicId: "report-1" });
    agent.researchOpportunities.mockResolvedValue({ profile: {}, researchPlan: {}, agentActivity: [], summary: {}, opportunities: [], historicalIntelligence: [], sbirFallback: {}, notices: [], sourceNotes: [] });
  });

  it("persists a completed research result and returns its durable public report identifier", async () => {
    const caller = appRouter.createCaller(context());
    const result = await caller.opportunity.run({ description: "We build technology that makes clinical operations easier for hospitals and nurses." });

    expect(db.createScan).toHaveBeenCalledOnce();
    expect(db.completeScanAndCreateReport).toHaveBeenCalledOnce();
    expect(result.persisted).toBe(true);
    expect(result.reportId).toBe("report-1");
  });
});
