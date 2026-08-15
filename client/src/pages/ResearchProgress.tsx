import { Button } from "@/components/ui/button";
import { clearQueuedResearch, readQueuedResearch, RESEARCH_TIMEOUT_MS } from "@/lib/researchJob";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, CircleAlert, Clock3, FileSearch, Loader2, SearchCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

const stages = [
  { label: "Reading your company context", detail: "Interpreting your supplied description and any public website context." },
  { label: "Translating government language", detail: "Preparing program, agency, and research terminology to investigate." },
  { label: "Investigating live opportunities", detail: "Searching Grants.gov and opening the strongest official records." },
  { label: "Checking award evidence", detail: "Looking for public USAspending and SBIR/STTR context, including Utah signals." },
  { label: "Organizing your Opportunity Map", detail: "Ranking evidence and writing practical questions to verify next." },
];

export default function ResearchProgress() {
  const [, setLocation] = useLocation();
  const jobRef = useRef(readQueuedResearch());
  const hasStarted = useRef(false);
  const timedOut = useRef(false);
  const [activeStage, setActiveStage] = useState(0);
  const [slowNotice, setSlowNotice] = useState(false);
  const [error, setError] = useState("");
  const scan = trpc.opportunity.run.useMutation({
    onSuccess: ({ reportId, report }) => {
      if (timedOut.current) return;
      sessionStorage.setItem(`plaintext-report:${reportId}`, JSON.stringify(report));
      clearQueuedResearch();
      setLocation(`/report/${reportId}`);
    },
    onError: (cause) => { if (!timedOut.current) setError(cause.message || "The research request could not be completed."); },
  });

  useEffect(() => {
    if (!jobRef.current || hasStarted.current) return;
    hasStarted.current = true;
    scan.mutate(jobRef.current);
  }, [scan]);

  useEffect(() => {
    if (error || !jobRef.current) return;
    const stageTimer = window.setInterval(() => setActiveStage((stage) => Math.min(stage + 1, stages.length - 1)), 4200);
    const slowTimer = window.setTimeout(() => setSlowNotice(true), 45_000);
    const timeoutTimer = window.setTimeout(() => {
      timedOut.current = true;
      setError("This research run did not finish in the expected window. No result was shown, so you can safely return to search and try again with a more specific description or domain.");
    }, RESEARCH_TIMEOUT_MS);
    return () => { window.clearInterval(stageTimer); window.clearTimeout(slowTimer); window.clearTimeout(timeoutTimer); };
  }, [error]);

  if (!jobRef.current) return <main className="grid min-h-screen place-items-center bg-paper px-5 text-ink"><div className="max-w-md text-center"><CircleAlert className="mx-auto h-9 w-9 text-clay" /><h1 className="mt-4 font-display text-3xl font-semibold">There isn’t a research request to run.</h1><p className="mt-3 text-sm leading-relaxed text-ink/60">Start from the PlainText.legal search bar with a company description or public domain.</p><Link href="/"><Button className="mt-6 bg-moss text-white hover:bg-moss/90">Back to search</Button></Link></div></main>;

  return <main className="min-h-screen bg-paper text-ink"><header className="border-b border-ink/10 bg-paper/90"><div className="container flex h-16 items-center justify-between"><Link href="/" className="font-display text-xl font-semibold">PlainText<span className="text-moss">.legal</span></Link><Link href="/"><Button variant="outline" className="border-ink/15 bg-white"><ArrowLeft className="mr-2 h-4 w-4" /> New search</Button></Link></div></header><section className="container grid min-h-[calc(100vh-65px)] items-center gap-10 py-12 lg:grid-cols-[.8fr_1.2fr]"><div><div className="inline-flex items-center gap-2 rounded-full bg-moss/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.15em] text-moss"><Sparkles className="h-3.5 w-3.5" /> Agent research in progress</div><h1 className="mt-5 font-display text-5xl font-semibold leading-[.98] tracking-tight">Building your<br /><span className="text-moss">Opportunity Map.</span></h1><p className="mt-5 max-w-md text-[16px] leading-7 text-ink/65">The agent is investigating public sources and organizing a plain-language brief. You can stay on this page while the work completes.</p><div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950/75"><div className="flex items-center gap-2 font-semibold text-amber-900"><Clock3 className="h-4 w-4" /> Research, not an eligibility decision</div><p className="mt-2">The final report will link to public source records and flag the questions you still need to verify.</p></div></div><div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_20px_50px_rgba(31,54,54,.08)] sm:p-8">{error ? <div className="text-center"><CircleAlert className="mx-auto h-9 w-9 text-clay" /><h2 className="mt-4 font-display text-2xl font-semibold">The research run needs another try.</h2><p className="mt-3 text-sm leading-relaxed text-ink/60">{error}</p><Link href="/"><Button className="mt-6 bg-moss text-white hover:bg-moss/90">Return to search</Button></Link></div> : <><div className="flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-moss">Research trail</div><h2 className="mt-2 font-display text-2xl font-semibold">The agent is showing its work.</h2></div><div className="grid h-11 w-11 place-items-center rounded-full bg-moss/10 text-moss"><Loader2 className="h-5 w-5 animate-spin" /></div></div><div className="mt-7 space-y-0">{stages.map((stage, index) => <div className="relative flex gap-4 pb-6 last:pb-0" key={stage.label}><div className={`relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${index < activeStage ? "bg-moss text-white" : index === activeStage ? "bg-moss text-white" : "bg-paper text-ink/35"}`}>{index < activeStage ? <CheckCircle2 className="h-4 w-4" /> : index === activeStage ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="font-mono text-[10px]">0{index + 1}</span>}</div>{index < stages.length - 1 && <div className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-ink/10" />}<div className="pt-0.5"><div className={`text-sm font-semibold ${index <= activeStage ? "text-ink" : "text-ink/40"}`}>{stage.label}</div><p className={`mt-1 text-sm leading-relaxed ${index <= activeStage ? "text-ink/60" : "text-ink/35"}`}>{stage.detail}</p></div></div>)}</div>{slowNotice && <div className="mt-6 flex gap-2 rounded-xl bg-paper p-4 text-sm leading-relaxed text-ink/65"><FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-moss" /><p>This search is taking longer than usual, but the agent is still working. Keep this page open; if it does not finish shortly, return to search and try a more specific company description.</p></div>}</>}</div></section></main>;
}
