import AdminAppointments from "@/components/AdminAppointments";

export default function AdminAppointmentsPage() {
  return (
    <>
      <section className="bg-[#fff8f6] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Luneva Admin
          </p>

          <h1 className="font-serif text-6xl text-[#332725]">
            Заявки на консультацию
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">
            Здесь появляются обращения из формы онлайн-записи на сайте.
          </p>
        </div>
      </section>

      <AdminAppointments />
    </>
  );
}
