import { AiKnowledgeManager } from "@/components/admin/ai-knowledge-manager";

export default function AdminAiKnowledgePage() {
  return (
    <>
      <section className="bg-[#fff8f6] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">AI · Luneva Admin</p>
          <h1 className="font-serif text-4xl text-[#332725] sm:text-6xl">База знаний</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">
            Загружайте утверждённые материалы для AI-помощника, проверяйте обработку и явно управляйте активными документами.
          </p>
          <p className="mt-4 max-w-3xl rounded-2xl bg-white p-4 text-sm leading-6 text-[#7a6c68]">
            AI остаётся выключенным для клиентов. Активный документ становится доступен только внутреннему demo-контуру до отдельного запуска.
          </p>
        </div>
      </section>
      <AiKnowledgeManager />
    </>
  );
}
