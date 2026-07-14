import Link from "next/link";

import AdminSitePages from "@/components/AdminSitePages";

export default function AdminSitePagesPage() {
  return (
    <>
      <section className="bg-[#fff8f6] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <Link href="/admin" className="text-[#c98778]">← Назад в админку</Link>
          <p className="mt-8 mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">Luneva Admin</p>
          <h1 className="font-serif text-6xl text-[#332725]">Страницы сайта</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">Создавайте информационные страницы, редактируйте тексты и управляйте публикацией.</p>
        </div>
      </section>
      <AdminSitePages />
    </>
  );
}
