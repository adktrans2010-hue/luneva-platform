import Link from "next/link";

import AdminFaq from "@/components/AdminFaq";

export default function AdminFaqPage() {
  return (
    <>
      <section className="bg-[#fff8f6] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <Link href="/admin" className="text-[#c98778]">← Назад в админку</Link>
          <p className="mt-8 mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">Luneva Admin</p>
          <h1 className="font-serif text-6xl text-[#332725]">Управление FAQ</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">Добавляйте частые вопросы, меняйте порядок, публикуйте или временно скрывайте ответы.</p>
        </div>
      </section>
      <AdminFaq />
    </>
  );
}
