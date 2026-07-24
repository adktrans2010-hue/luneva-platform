import AdminClients from "@/components/AdminClients";

export const dynamic = "force-dynamic";

export default function AdminClientsPage() {
  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Luneva Admin
        </p>

        <h1 className="font-serif text-6xl leading-tight text-[#332725]">
          Клиенты
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">
          Зарегистрированные пользователи личного кабинета: контакты, почта,
          активность, блокировка и безопасное удаление.
        </p>

        <div className="mt-12">
          <AdminClients />
        </div>
      </div>
    </section>
  );
}
