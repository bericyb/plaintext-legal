import { COOKIE_NAME } from "@shared/const";
import { nanoid } from "nanoid";
import { z } from "zod";
import { researchOpportunities } from "./agent";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { addReportEmailOptIn, completeScanAndCreateReport, createScan, getPublicReport, markScanFailed } from "./db";
import { publicProcedure, router } from "./_core/trpc";

const scanInput = z.object({
  companyName: z.string().max(255).optional(),
  description: z.string().min(20, "Please provide at least a short description of your company.").max(8000),
  domain: z.string().max(2048).optional(),
  industry: z.string().max(160).optional(),
  location: z.string().max(160).optional(),
  employees: z.string().max(80).optional(),
  revenue: z.string().max(80).optional(),
  fundingStage: z.string().max(80).optional(),
  capitalNeed: z.string().max(120).optional(),
  useOfFunds: z.string().max(500).optional(),
  source: z.enum(["founder", "domain", "utah"]).optional(),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  opportunity: router({
    run: publicProcedure.input(scanInput).mutation(async ({ input }) => {
      const profile = { raw: input.description, source: input.source || "founder" };
      const scanPublicId = nanoid(12);
      const reportPublicId = nanoid(12);
      const created = await createScan({
        publicId: scanPublicId,
        companyName: input.companyName?.trim() || "Your company",
        companyDescription: input.description,
        websiteUrl: input.domain?.trim() || null,
        source: input.source || "founder",
        status: "researching",
        profileJson: JSON.stringify(profile),
        researchPlanJson: JSON.stringify({ status: "building" }),
      });
      try {
        const report = await researchOpportunities(input);
        const saved = created ? await completeScanAndCreateReport(scanPublicId, { publicId: reportPublicId, scanId: created.id, reportJson: JSON.stringify(report) }) : undefined;
        return { reportId: saved?.publicId || reportPublicId, report, persisted: Boolean(saved) };
      } catch (error) {
        if (created) await markScanFailed(scanPublicId, error instanceof Error ? error.message : "Research failed");
        throw error;
      }
    }),
    getReport: publicProcedure.input(z.object({ reportId: z.string().min(6).max(24) })).query(async ({ input }) => {
      const result = await getPublicReport(input.reportId);
      if (!result) return null;
      return { reportId: result.report.publicId, report: JSON.parse(result.report.reportJson) };
    }),
    optInEmail: publicProcedure.input(z.object({ reportId: z.string().min(6).max(24), email: z.string().email().max(320) })).mutation(async ({ input }) => {
      const result = await getPublicReport(input.reportId);
      if (!result) throw new Error("Report not found.");
      await addReportEmailOptIn(result.report.id, input.email);
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
