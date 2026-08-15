import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { inferPublicDomain, queueResearch } from "@/lib/researchJob";
import { ArrowRight, BadgeDollarSign, CheckCircle2, ChevronDown, CircleAlert, FileSearch, Landmark, Search, SearchCheck, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

const optionalLabels = [
  ["industry", "Industry", "e.g. digital health"],
  ["location", "Location", "e.g. Utah"],
  ["employees", "Employees", "e.g. 15"],
  ["revenue", "Revenue", "e.g. $1M ARR"],
  ["fundingStage", "Funding stage", "e.g. Seed"],
  ["capitalNeed", "Capital need", "e.g. $500K–$2M"],
] as const;

export default function Home() {
  const [, setLocation] = useLocation();
  const [heroQuery, setHeroQuery] = useState("");
  const [heroError, setHeroError] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState({ companyName: "", domain: "", industry: "", location: "", employees: "", revenue: "", fundingStage: "", capitalNeed: "", useOfFunds: "" });
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState("");

  const setField = (key: keyof typeof fields, value: string) => setFields((current) => ({ ...current, [key]: value }));

  const startResearch = (payload: Parameters<typeof queueResearch>[0]) => {
    queueResearch(payload);
    setLocation("/research");
  };

  const submitDetailed = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (description.trim().length < 20) {
      setError("Add a little more detail so the agent can build a useful research plan.");
      return;
    }
    startResearch({ ...fields, description });
  };

  const submitHeroSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = heroQuery.trim();
    setHeroError("");
    if (query.length < 3) {
      setHeroError("Enter a public domain or a few words about your company to begin.");
      return;
    }
    const domain = inferPublicDomain(query);
    const searchDescription = domain
      ? "The founder supplied this public domain for an opportunity research scan. Use accessible homepage evidence when available, identify the company context cautiously, and do not invent information that is not public."
      : query;
    startResearch({ ...fields, domain: domain || fields.domain, description: searchDescription });
  };

  return <div className="min-h-screen bg-paper text-ink">
    <header className="border-b border-ink/10 bg-paper/85 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">PlainText<span className="text-moss">.legal</span></Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink/60 md:flex">
          <a className="hover:text-ink" href="#how-it-works">How it works</a>
          <a className="hover:text-ink" href="#sources">Data sources</a>
          <Link className="hover:text-ink" href="/scan">Scan a company</Link>
        </nav>
        <a className="text-sm font-semibold text-moss hover:text-ink" href="#hero-search">Try a search <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></a>
      </div>
    </header>

    <main>
      <section className="relative overflow-hidden border-b border-ink/10">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="container relative grid gap-12 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-moss/20 bg-moss/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.16em] text-moss"><Sparkles className="h-3.5 w-3.5" /> Government research, translated</div>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[.96] tracking-tight text-ink sm:text-6xl lg:text-7xl">Government support,<br /><span className="text-moss">made actionable.</span></h1>
            <p className="mt-6 max-w-xl text-[17px] leading-8 text-ink/65">PlainText.legal is an agent-led research desk for founders. Describe your company, and it investigates public opportunities, translates the bureaucracy, and gives you a prioritized plan for what to do next.</p>
            <form className="mt-8 max-w-2xl" id="hero-search" onSubmit={submitHeroSearch}>
              <Label className="sr-only" htmlFor="hero-query">Enter your domain, or a description of your company</Label>
              <div className="rounded-2xl border border-ink/15 bg-white p-2 shadow-[0_16px_45px_rgba(31,54,54,.10)] transition-shadow focus-within:border-moss/50 focus-within:shadow-[0_18px_55px_rgba(31,54,54,.15)]">
                <div className="flex items-center gap-2"><Search className="ml-2 h-5 w-5 shrink-0 text-moss" /><Input id="hero-query" className="h-12 min-w-0 flex-1 border-0 bg-transparent px-1 text-base shadow-none placeholder:text-ink/38 focus-visible:ring-0" value={heroQuery} onChange={(event) => setHeroQuery(event.target.value)} placeholder="Enter your domain, or a description of your company" /><Button type="submit" className="h-12 shrink-0 bg-moss px-4 text-white hover:bg-moss/90 sm:px-5"><span className="hidden sm:inline">Start research</span><ArrowRight className="sm:ml-2 h-4 w-4" /></Button></div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink/55">Add a public website and the agent will use accessible homepage context. Write a description and it will use your words as the source of truth.</p>
              {heroError && <p className="mt-3 flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{heroError}</p>}
            </form>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs text-ink/58"><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-moss" /> Live Grants.gov research</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-moss" /> USAspending context</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-moss" /> No eligibility promises</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-lg self-center rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_24px_80px_rgba(31,54,54,.14)]">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4"><div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-moss">Sample report</div><div className="mt-1 font-display text-xl font-semibold">Government Opportunity Map.</div></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-moss/10 text-moss"><Landmark className="h-5 w-5" /></div></div>
            <div className="py-4"><div className="flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.14em] text-ink/45">Research focus</div><div className="mt-1 text-sm font-semibold">AI healthcare · Utah</div></div><div className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">Likely Fit</div></div><div className="mt-4 rounded-xl bg-paper p-4"><div className="font-display text-lg font-semibold">A research plan, not a results list.</div><p className="mt-1 text-sm leading-relaxed text-ink/60">The agent maps startup language to public programs, checks historical awards, and identifies questions to verify before you invest application time.</p></div><div className="mt-4 grid grid-cols-3 gap-3"><div><div className="font-display text-xl font-semibold">7</div><div className="text-[11px] text-ink/50">opportunities</div></div><div><div className="font-display text-xl font-semibold">4</div><div className="text-[11px] text-ink/50">agencies</div></div><div><div className="font-display text-xl font-semibold">3</div><div className="text-[11px] text-ink/50">next actions</div></div></div></div>
            <div className="rounded-lg bg-ink px-3 py-2 text-xs text-white/75">Research output is always linked back to the underlying public source.</div>
          </div>
        </div>
      </section>

      <section className="border-b border-ink/10 bg-white py-7"><div className="container grid gap-5 sm:grid-cols-3"><Feature icon={<FileSearch className="h-4 w-4" />} title="Reads the founder story" detail="Natural language first, with optional details when you have them." /><Feature icon={<SearchCheck className="h-4 w-4" />} title="Investigates the landscape" detail="Government terms, live notices, historical awards, and R&D precedent." /><Feature icon={<BadgeDollarSign className="h-4 w-4" />} title="Organizes what to do next" detail="Clear fit reasons, concerns, verification steps, and source links." /></div></section>

      <section className="container scroll-mt-6 py-14 lg:py-20" id="opportunity-scan">
        <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr]">
          <div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-moss">Founder intake</div><h2 className="mt-3 font-display text-4xl font-semibold leading-tight">Start with your company—not a government keyword.</h2><p className="mt-4 max-w-md text-[16px] leading-7 text-ink/65">Give the agent context in your own words. It will build a structured profile, decide what it needs to investigate, and organize a readable Government Opportunity Map.</p><div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950/75"><div className="mb-1 flex items-center gap-2 font-semibold text-amber-900"><ShieldCheck className="h-4 w-4" /> Plain language, honest limits</div>The scan is a research tool. It cannot determine eligibility or guarantee funding, and it will say when a strong fit is not supported by the returned evidence.</div></div>
          <form className="rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_12px_40px_rgba(31,54,54,.06)] sm:p-7" onSubmit={submitDetailed}>
            <div className="flex items-center justify-between gap-4"><Label className="font-display text-xl font-semibold text-ink" htmlFor="description">Tell us about your company.</Label><span className="font-mono text-[10px] uppercase tracking-[.14em] text-ink/40">Required</span></div>
            <Textarea id="description" className="mt-3 min-h-36 resize-y bg-paper text-[15px] leading-6" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What are you building, for whom, and what are you trying to fund?" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><Label className="font-mono text-[10px] uppercase tracking-[.14em] text-ink/55" htmlFor="company">Company name <span className="normal-case tracking-normal text-ink/40">(optional)</span></Label><Input id="company" className="mt-2 h-11" value={fields.companyName} onChange={(event) => setField("companyName", event.target.value)} placeholder="Company name" /></div><div><Label className="font-mono text-[10px] uppercase tracking-[.14em] text-ink/55" htmlFor="domain">Public domain <span className="normal-case tracking-normal text-ink/40">(optional)</span></Label><Input id="domain" className="mt-2 h-11" value={fields.domain} onChange={(event) => setField("domain", event.target.value)} placeholder="example.ai" /></div></div>
            <p className="mt-2 text-xs leading-relaxed text-ink/50">If you supply a public domain, the agent may use accessible landing-page text to enrich your profile. Your description remains the primary source of truth.</p>
            <button className="mt-5 flex w-full items-center justify-between border-y border-ink/10 py-3 text-left text-sm font-semibold" type="button" onClick={() => setShowDetails((value) => !value)}>Add optional profile details <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`} /></button>
            {showDetails && <div className="grid gap-4 pt-5 sm:grid-cols-2">{optionalLabels.map(([key, label, placeholder]) => <div key={key}><Label className="font-mono text-[10px] uppercase tracking-[.14em] text-ink/55" htmlFor={key}>{label}</Label><Input id={key} className="mt-2 h-11" value={fields[key]} onChange={(event) => setField(key, event.target.value)} placeholder={placeholder} /></div>)}<div className="sm:col-span-2"><Label className="font-mono text-[10px] uppercase tracking-[.14em] text-ink/55" htmlFor="use">Use of funds</Label><Input id="use" className="mt-2 h-11" value={fields.useOfFunds} onChange={(event) => setField("useOfFunds", event.target.value)} placeholder="e.g. product development and pilot programs" /></div></div>}
            {error && <div className="mt-4 flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
            <Button type="submit" className="mt-6 h-12 w-full bg-moss text-white hover:bg-moss/90"><Sparkles className="mr-2 h-4 w-4" /> Continue to agent progress</Button><p className="mt-3 text-center text-xs text-ink/45">The agent will open a dedicated research page with live stage updates.</p>
          </form>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-ink py-14 text-white" id="how-it-works"><div className="container"><div className="max-w-xl"><div className="font-mono text-[10px] uppercase tracking-[.16em] text-lime">The PlainText method</div><h2 className="mt-3 font-display text-4xl font-semibold">A research agent that shows its work.</h2></div><div className="mt-10 grid gap-5 md:grid-cols-4">{[["01", "Understand", "Extract the startup’s problem, technology, stage, capital need, and public context."], ["02", "Translate", "Turn founder language into the agencies, programs, and government terminology worth researching."], ["03", "Investigate", "Search current notices, open the strongest official records, and check award history."], ["04", "Organize", "Rank the evidence and return clear fit, concern, verification, and action sections."]].map(([number, title, detail]) => <div className="border-t border-white/20 pt-4" key={number}><div className="font-mono text-xs text-lime">{number}</div><h3 className="mt-5 font-display text-2xl font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-white/62">{detail}</p></div>)}</div></div></section>
      <section className="container py-14" id="sources"><div className="grid gap-7 rounded-2xl border border-ink/10 bg-white p-6 lg:grid-cols-[.8fr_1.2fr]"><div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-moss">Data sources</div><h2 className="mt-3 font-display text-3xl font-semibold">Public sources, organized for founders.</h2><p className="mt-3 text-sm leading-relaxed text-ink/65">The agent is built around current federal opportunity data and historical evidence. Each report links you back to the official source for verification.</p></div><div className="grid gap-3 sm:grid-cols-2">{[["Grants.gov", "Live posted and forecasted federal opportunities."], ["USAspending", "Historical award amounts, recipient evidence, and Utah counts."], ["SBIR.gov", "A reproducible offline award snapshot for R&D context."], ["SAM.gov", "Broader assistance enrichment is queued until public API-key issuance is restored."]].map(([title, detail]) => <div className="rounded-xl bg-paper p-4" key={title}><div className="font-semibold">{title}</div><p className="mt-1 text-sm leading-relaxed text-ink/60">{detail}</p></div>)}</div></div></section>
    </main>
    <footer className="border-t border-ink/10 bg-white py-8"><div className="container flex flex-col gap-3 text-sm text-ink/55 sm:flex-row sm:items-center sm:justify-between"><div><span className="font-display font-semibold text-ink">PlainText<span className="text-moss">.legal</span></span><span className="ml-2">Government support, made actionable.</span></div><Link className="font-medium hover:text-ink" href="/scan">Scan a company</Link></div></footer>
  </div>;
}

function Feature({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className="flex gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-moss/10 text-moss">{icon}</div><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm leading-relaxed text-ink/60">{detail}</p></div></div>;
}
