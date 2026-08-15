import { describe, expect, it } from "vitest";
import { exceededResearchTimeout, inferPublicDomain, RESEARCH_TIMEOUT_MS } from "./researchJob";

describe("inferPublicDomain", () => {
  it("normalizes a supplied public domain", () => {
    expect(inferPublicDomain("example.ai")).toBe("https://example.ai/");
  });

  it("keeps natural-language company descriptions out of the domain path", () => {
    expect(inferPublicDomain("We build hospital workflow software for nurses.")).toBeUndefined();
  });

  it("marks an unfinished request as recoverable when the research window is exceeded", () => {
    expect(exceededResearchTimeout(1_000, 1_000 + RESEARCH_TIMEOUT_MS - 1)).toBe(false);
    expect(exceededResearchTimeout(1_000, 1_000 + RESEARCH_TIMEOUT_MS)).toBe(true);
  });
});
