import { getSiteStats } from "@/src/lib/site-stats";

export const dynamic = "force-dynamic";

export default async function AdminSiteLifePage() {
  const stats = await getSiteStats();

  const maxDailyViews = Math.max(...stats.daily.map((day) => day.views), 1);

  return (
    <>
      <section className="bg-[#fff8f6] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
            Luneva Admin
          </p>

          <h1 className="font-serif text-6xl text-[#332725]">
            Как живёт сайт
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">
            Простая статистика за последние 30 дней: посетители, просмотры,
            записи, популярные материалы и источники переходов.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Посетители" value={stats.visitors} />
            <StatCard label="Просмотры" value={stats.views} />
            <StatCard label="За 7 дней" value={stats.weekViews} />
            <StatCard label="Записи" value={stats.appointments} />
            <StatCard label="Конверсия" value={`${stats.conversion}%`} />
          </div>

          <div className="mt-8 rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-serif text-4xl text-[#332725]">
                  Последние 7 дней
                </h2>
                <p className="mt-2 text-[#5f5552]">
                  Столбики показывают просмотры, подпись — посетителей.
                </p>
              </div>

              <div className="rounded-full bg-[#fff8f6] px-4 py-2 text-sm text-[#c98778]">
                Активных записей: {stats.pendingAppointments}
              </div>
            </div>

            <div className="mt-8 grid min-h-64 grid-cols-7 items-end gap-3">
              {stats.daily.length > 0 ? (
                stats.daily.map((day) => (
                  <div key={day.label} className="grid gap-3">
                    <div className="flex h-48 items-end rounded-2xl bg-[#fff8f6] p-2">
                      <div
                        className="w-full rounded-xl bg-[#c98778]"
                        style={{
                          height: `${Math.max((day.views / maxDailyViews) * 100, 8)}%`,
                        }}
                      />
                    </div>
                    <div className="text-center text-sm text-[#5f5552]">
                      <div>{day.label}</div>
                      <div className="text-[#8a7a76]">{day.visitors} чел.</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="col-span-7 text-[#5f5552]">
                  Данные начнут появляться после новых посещений сайта.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <StatsList
              title="Популярные страницы"
              emptyText="Просмотров страниц пока нет."
              items={stats.popularPages}
              suffix="просм."
            />
            <StatsList
              title="Популярные статьи"
              emptyText="Статьи пока не просматривали."
              items={stats.popularArticles}
              suffix="просм."
            />
            <StatsList
              title="Популярные видео"
              emptyText="По видео пока не переходили."
              items={stats.popularVideos}
              suffix="кликов"
            />
            <StatsList
              title="Источники переходов"
              emptyText="Источники появятся после посещений."
              items={stats.sources}
              suffix="визитов"
            />
          </div>
        </div>
      </section>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm">
      <div className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
        {label}
      </div>
      <div className="mt-4 font-serif text-4xl text-[#332725]">{value}</div>
    </div>
  );
}

function StatsList({
  title,
  emptyText,
  items,
  suffix,
}: {
  title: string;
  emptyText: string;
  items: Array<{ label: string; value: number }>;
  suffix: string;
}) {
  return (
    <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm">
      <h2 className="font-serif text-3xl text-[#332725]">{title}</h2>

      <div className="mt-6 grid gap-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.label}
              className="flex items-start justify-between gap-4 rounded-2xl bg-[#fff8f6] px-4 py-3"
            >
              <span className="leading-6 text-[#332725]">{item.label}</span>
              <span className="shrink-0 text-sm text-[#8a7a76]">
                {item.value} {suffix}
              </span>
            </div>
          ))
        ) : (
          <p className="text-[#5f5552]">{emptyText}</p>
        )}
      </div>
    </div>
  );
}
