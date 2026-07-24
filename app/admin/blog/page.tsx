import AdminArticles from "@/components/AdminArticles";

export default function AdminBlogPage() {
  return (
    <>
      <section className="bg-[#fff8f6] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Luneva Admin
          </p>

          <h1 className="font-serif text-6xl text-[#332725]">
            Полезные статьи
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">
            Здесь можно писать статьи, сохранять черновики и публиковать
            готовые материалы в блоге. Поиск, категории, похожие материалы и
            SEO-данные работают прямо из этой страницы.
          </p>
        </div>
      </section>

      <AdminArticles />
    </>
  );
}
