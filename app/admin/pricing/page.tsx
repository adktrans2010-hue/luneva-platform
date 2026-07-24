import AdminProducts from "@/components/AdminProducts";

export default function AdminPricingPage() {
  return (
    <>
      <section className="bg-[#fff8f6] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Luneva Admin
          </p>

          <h1 className="font-serif text-6xl text-[#332725]">
            Услуги и стоимость
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">
            Добавляйте услуги и редактируйте их описание, цены, формат работы
            и длительность.
          </p>
        </div>
      </section>

      <AdminProducts />
    </>
  );
}
