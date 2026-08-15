export type PendingResearch = {
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

export const PENDING_RESEARCH_KEY = "plaintext-pending-research";
export const RESEARCH_TIMEOUT_MS = 95_000;

export function inferPublicDomain(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return undefined;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return url.hostname.includes(".") ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function queueResearch(payload: PendingResearch) {
  sessionStorage.setItem(PENDING_RESEARCH_KEY, JSON.stringify(payload));
}

export function readQueuedResearch(): PendingResearch | undefined {
  try {
    const raw = sessionStorage.getItem(PENDING_RESEARCH_KEY);
    return raw ? JSON.parse(raw) as PendingResearch : undefined;
  } catch {
    return undefined;
  }
}

export function clearQueuedResearch() {
  sessionStorage.removeItem(PENDING_RESEARCH_KEY);
}

export function exceededResearchTimeout(startedAt: number, now: number) {
  return now - startedAt >= RESEARCH_TIMEOUT_MS;
}
