import { AiConversationDetail } from "@/components/admin/ai-conversation-detail";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <main className="min-h-screen bg-[#fff8f6] px-5 py-20"><div className="mx-auto max-w-5xl"><h1 className="font-serif text-5xl">Диалог</h1><AiConversationDetail id={id} /></div></main>; }
