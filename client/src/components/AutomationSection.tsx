import { Building2, Globe2, MailCheck, SearchCheck } from "lucide-react";

const stages = [
  { icon: <Building2 className="h-4 w-4" />, title: "A Utah business or domain signal appears" },
  { icon: <Globe2 className="h-4 w-4" />, title: "Public company context is interpreted" },
  { icon: <SearchCheck className="h-4 w-4" />, title: "Support is researched and organized" },
  { icon: <MailCheck className="h-4 w-4" />, title: "A useful founder briefing is ready" },
];

export default function AutomationSection() {
  return <section className="border-b border-ink/10 bg-white py-14" id="automation"><div className="container"><div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-center"><div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-moss">The event-driven vision</div><h2 className="mt-3 font-display text-4xl font-semibold leading-tight">Support research begins when a company does.</h2></div><div className="grid gap-3 sm:grid-cols-2">{stages.map((stage, index) => <div className="flex items-center gap-3 rounded-xl border border-ink/10 bg-paper p-4" key={stage.title}><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-moss text-white">{stage.icon}</div><div><div className="font-mono text-[10px] text-moss">0{index + 1}</div><h3 className="mt-1 text-sm font-semibold leading-snug">{stage.title}</h3></div></div>)}</div></div></div></section>;
}
