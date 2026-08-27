import { AiPilotUsage } from "@/components/admin/ai-pilot-usage";

export default function Page() {
  return <main className="min-h-screen bg-[#fff8f6] px-5 py-20"><div className="mx-auto max-w-5xl">
    <p className="uppercase tracking-[.25em] text-[#c98778]">AI · Clinical</p>
    <h1 className="mt-3 font-serif text-5xl">Pilot / Usage</h1>
    <p className="mt-4 max-w-3xl text-[#6b5b57]">Persistent usage ledger, budgets и allowlisted pilot cohort. Secrets и тексты диалогов здесь не отображаются.</p>
    <AiPilotUsage />
  </div></main>;
}
