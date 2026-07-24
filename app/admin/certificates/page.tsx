import AdminCertificates from "@/components/AdminCertificates";

export default function AdminCertificatesPage() {
  return (
    <>
      <section className="bg-[#fff8f6] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Luneva Admin
          </p>

          <h1 className="font-serif text-6xl text-[#332725]">
            Дипломы и сертификаты
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">
            Здесь можно добавлять изображения документов, менять порядок,
            скрывать и публиковать их на сайте.
          </p>
        </div>
      </section>

      <AdminCertificates />
    </>
  );
}
