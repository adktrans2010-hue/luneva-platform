import { sql } from "drizzle-orm";

import { db } from "@/src/db";

type CountRow = {
  value: string | number;
};

type ListRow = {
  label: string;
  value: string | number;
};

type DayRow = {
  label: string;
  views: string | number;
  visitors: string | number;
};

function numberValue(value: string | number | null | undefined) {
  return Number(value ?? 0) || 0;
}

function rows<T>(result: unknown) {
  return (result as { rows?: T[] }).rows ?? [];
}

function readablePath(path: string) {
  if (path === "/") return "Главная";
  if (path === "/about") return "Обо мне";
  if (path === "/help") return "Помощь";
  if (path === "/reviews") return "Отзывы";
  if (path === "/blog") return "Статьи";
  if (path === "/videos") return "Видео";
  if (path === "/certificates") return "Дипломы";
  if (path === "/contacts") return "Контакты";
  if (path.startsWith("/blog/")) {
    return `Статья: ${decodeURIComponent(path.replace("/blog/", ""))}`;
  }

  return path;
}

export async function getSiteStats() {
  const since = sql`now() - interval '30 days'`;
  const weekSince = sql`now() - interval '7 days'`;

  const [
    viewsResult,
    visitorsResult,
    weekViewsResult,
    contactsViewsResult,
    appointmentsResult,
    pendingAppointmentsResult,
    popularPagesResult,
    popularArticlesResult,
    popularVideosResult,
    sourcesResult,
    dailyResult,
  ] = await Promise.all([
    db.execute<CountRow>(sql`
      select count(*) as value
      from analytics_events
      where event_type = 'page_view' and created_at >= ${since}
    `),
    db.execute<CountRow>(sql`
      select count(distinct visitor_id) as value
      from analytics_events
      where event_type = 'page_view' and created_at >= ${since}
    `),
    db.execute<CountRow>(sql`
      select count(*) as value
      from analytics_events
      where event_type = 'page_view' and created_at >= ${weekSince}
    `),
    db.execute<CountRow>(sql`
      select count(*) as value
      from analytics_events
      where event_type = 'page_view'
        and path like '/contacts%'
        and created_at >= ${since}
    `),
    db.execute<CountRow>(sql`
      select count(*) as value
      from appointment_requests
      where created_at >= ${since}
    `),
    db.execute<CountRow>(sql`
      select count(*) as value
      from appointment_requests
      where status in ('new', 'scheduled')
    `),
    db.execute<ListRow>(sql`
      select split_part(path, '?', 1) as label, count(*) as value
      from analytics_events
      where event_type = 'page_view' and created_at >= ${since}
      group by split_part(path, '?', 1)
      order by count(*) desc
      limit 8
    `),
    db.execute<ListRow>(sql`
      select a.title as label, count(e.id) as value
      from articles a
      join analytics_events e on split_part(e.path, '?', 1) = '/blog/' || a.slug
      where e.event_type = 'page_view' and e.created_at >= ${since}
      group by a.title
      order by count(e.id) desc
      limit 6
    `),
    db.execute<ListRow>(sql`
      select coalesce(title, target, 'Видео') as label, count(*) as value
      from analytics_events
      where event_type = 'video_click' and created_at >= ${since}
      group by coalesce(title, target, 'Видео')
      order by count(*) desc
      limit 6
    `),
    db.execute<ListRow>(sql`
      select source as label, count(*) as value
      from analytics_events
      where event_type = 'page_view' and created_at >= ${since}
      group by source
      order by count(*) desc
      limit 8
    `),
    db.execute<DayRow>(sql`
      select to_char(created_at::date, 'DD.MM') as label,
        count(*) as views,
        count(distinct visitor_id) as visitors
      from analytics_events
      where event_type = 'page_view' and created_at >= ${weekSince}
      group by created_at::date
      order by created_at::date asc
    `),
  ]);

  const views = numberValue(rows<CountRow>(viewsResult)[0]?.value);
  const visitors = numberValue(rows<CountRow>(visitorsResult)[0]?.value);
  const weekViews = numberValue(rows<CountRow>(weekViewsResult)[0]?.value);
  const contactViews = numberValue(rows<CountRow>(contactsViewsResult)[0]?.value);
  const appointments = numberValue(rows<CountRow>(appointmentsResult)[0]?.value);
  const pendingAppointments = numberValue(rows<CountRow>(pendingAppointmentsResult)[0]?.value);

  return {
    views,
    visitors,
    weekViews,
    appointments,
    pendingAppointments,
    conversion:
      contactViews > 0 ? Math.round((appointments / contactViews) * 100) : 0,
    popularPages: rows<ListRow>(popularPagesResult).map((item) => ({
      label: readablePath(String(item.label)),
      value: numberValue(item.value),
    })),
    popularArticles: rows<ListRow>(popularArticlesResult).map((item) => ({
      label: item.label,
      value: numberValue(item.value),
    })),
    popularVideos: rows<ListRow>(popularVideosResult).map((item) => ({
      label: item.label,
      value: numberValue(item.value),
    })),
    sources: rows<ListRow>(sourcesResult).map((item) => ({
      label: item.label,
      value: numberValue(item.value),
    })),
    daily: rows<DayRow>(dailyResult).map((item) => ({
      label: item.label,
      views: numberValue(item.views),
      visitors: numberValue(item.visitors),
    })),
  };
}
