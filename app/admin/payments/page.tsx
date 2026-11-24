import AdminPayments from "@/components/AdminPayments";

export const dynamic = "force-dynamic";

export default function AdminPaymentsPage() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.18em] text-[#c98778]">Финансы</p>
        <h1 className="mt-3 font-serif text-5xl text-[#332725]">Платежи</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[#5f5552]">Последние 100 платежей. Раздел только для просмотра: операции и возвраты остаются в карточке записи.</p>
        <div className="mt-8"><AdminPayments /></div>
      </div>
    </section>
  );
}
