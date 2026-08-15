import { describe, expect, it } from "vitest";
import { exceededResearchTimeout, RESEARCH_TIMEOUT_MS } from "../client/src/lib/researchJob";

describe("research progress timeout", () => {
  it("switches a pending request into recoverable state at the configured client-side deadline", () => {
    const startedAt = 10_000;
    expect(exceededResearchTimeout(startedAt, startedAt + RESEARCH_TIMEOUT_MS - 1)).toBe(false);
    expect(exceededResearchTimeout(startedAt, startedAt + RESEARCH_TIMEOUT_MS)).toBe(true);
  });
});
