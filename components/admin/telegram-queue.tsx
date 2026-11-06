"use client";

import { useEffect, useState } from "react";
import { publisherDate, publisherQueueSchema, publisherStatus, type PublisherQueue } from "@/src/lib/publisher-admin-contract";

export function TelegramQueueView({ queue }: { queue: PublisherQueue }) {
  const { summary } = queue;
  return <>
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[["Всего", summary.total], ["Опубликовано", summary.published], ["Запланировано", summary.scheduled], ["Просрочено", summary.overdue]].map(([label, value]) =>
        <div key={label} className="rounded-xl border border-[#ead7d1] bg-white p-4"><dt>{label}</dt><dd className="mt-2 text-2xl font-semibold">{value}</dd></div>)}
    </dl>
    <section className="my-5 rounded-xl bg-[#fff3ef] p-4">
      <h2 className="font-semibold">Следующая публикация</h2>
      {summary.next ? <p className="mt-2 break-words">{publisherDate(summary.next.scheduled_at)} — {summary.next.title || summary.next.excerpt}</p> : <p>Нет будущих запланированных публикаций.</p>}
      <p className="mt-2 text-sm">Просроченные — запланированные посты с прошедшей датой. Будущие и просроченные входят в «Запланировано».</p>
    </section>
    {queue.posts.length === 0 ? <p>Очередь публикаций пуста.</p> : <ol className="grid gap-4">
      {queue.posts.map((post, index) => <li key={post.source} className="min-w-0 rounded-xl border border-[#ead7d1] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="min-w-0 break-words font-semibold">{post.sequence ?? index + 1}. {post.title || post.excerpt}</h2><span className="rounded-lg bg-[#fff3ef] px-2 py-1 text-sm">{publisherStatus[post.status]}</span></div>
        <p className="mt-2 whitespace-pre-line break-words text-sm text-[#665956]">{post.excerpt}</p>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div><dt>Запланировано</dt><dd>{publisherDate(post.scheduled_at)}</dd></div>
          <div><dt>Опубликовано</dt><dd>{publisherDate(post.published_at)}</dd></div>
          <div><dt>Telegram message ID</dt><dd>{post.telegram_message_id ?? "—"}</dd></div>
          <div><dt>Медиа</dt><dd>{post.media ? "Есть" : "Нет"}</dd></div>
        </dl>
        <p className="mt-3 break-all text-xs text-[#665956]">Источник / recovery ID: {post.source}</p>
      </li>)}
    </ol>}
  </>;
}

export function TelegramQueue() {
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | "denied">("loading");
  const [queue, setQueue] = useState<PublisherQueue | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/telegram", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      if (response.status === 401 || response.status === 403) { setState("denied"); return; }
      if (!response.ok) throw new Error("Unavailable");
      const payload = await response.json();
      setQueue(publisherQueueSchema.parse(payload.queue)); setState("ready");
    }).catch(() => { if (!controller.signal.aborted) setState("unavailable"); });
    return () => controller.abort();
  }, []);
  return <section className="mx-auto max-w-7xl p-4 text-[#332725] sm:p-6">
    <h1 className="text-2xl font-semibold">Telegram</h1>
    <p className="mb-6 mt-2 text-sm">Очередь отдельного publisher. Только просмотр · время МСК.</p>
    {state === "loading" && <p role="status">Загрузка публикаций…</p>}
    {state === "unavailable" && <p role="status">Publisher пока недоступен или не настроен. Очередь и автоматическая публикация не изменены. Обновите страницу позже.</p>}
    {state === "denied" && <p role="alert">Нет доступа. Войдите в админ-панель.</p>}
    {state === "ready" && queue && <TelegramQueueView queue={queue} />}
  </section>;
}
