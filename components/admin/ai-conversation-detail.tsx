"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/src/lib/admin-fetch";

type Detail = { conversation: { id: string; client: string; mode: string; takeover_operator?: string } | null; messages: Array<{ id: string; role: string; content?: string; operator?: string; created_at: string }>; safety_events: Array<{ id: string; event_type: string; severity: string; status: string; created_at: string }> };

export function AiConversationDetail({ id }: { id: string }) {
  const [detail, setDetail] = useState<Detail | null>(null); const [error, setError] = useState("");
  const load = useCallback(() => adminFetch(`/api/admin/ai/clinical/conversations/${id}`).then(async r => { const p = await r.json(); if (!r.ok) throw new Error(p.error); setDetail(p); }).catch(e => setError(e.message)), [id]);
  useEffect(() => { void load(); }, [load]);
  async function action(name: string, body?: object) { const r = await adminFetch(`/api/admin/ai/clinical/conversations/${id}/${name}`, { method: "POST", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined }); const p = await r.json(); if (!r.ok) setError(p.error); else await load(); }
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const content = String(form.get("content") ?? "").trim(); if (content) await action("message", { content }); }
  if (!detail) return <p className="mt-8">{error || "Загрузка…"}</p>;
  if (!detail.conversation) return <p className="mt-8">Диалог не найден.</p>;
  return <div className="mt-8 space-y-7">
    {error && <p role="alert" className="rounded-xl bg-[#fff1ed] p-4 text-[#8b3f32]">{error}</p>}
    <div className="rounded-2xl bg-white p-5"><strong>{detail.conversation.client}</strong><p>Режим: {detail.conversation.mode}</p><div className="mt-4 flex gap-3"><button onClick={() => action("takeover")} className="rounded-xl bg-[#c98778] px-4 py-2 text-white">Взять диалог</button><button onClick={() => action("release")} className="rounded-xl border px-4 py-2">Вернуть AI</button></div></div>
    <section><h2 className="font-serif text-3xl">История</h2>{detail.messages.map(m => <article key={m.id} className="mt-3 rounded-xl border bg-white p-4"><strong>{m.role}{m.operator ? ` · ${m.operator}` : ""}</strong><p className="mt-2 whitespace-pre-wrap">{m.content ?? "Текст не хранится согласно privacy policy"}</p></article>)}</section>
    <section><h2 className="font-serif text-3xl">Safety events</h2>{detail.safety_events.map(e => <div key={e.id} className="mt-3 rounded-xl bg-[#fff1ed] p-4"><p>{e.severity} · {e.event_type} · {e.status}</p>{e.status === "open" && <button onClick={() => adminFetch(`/api/admin/ai/clinical/safety/${e.id}/acknowledge`, { method: "POST" }).then(load)} className="mt-2 rounded-lg border px-3 py-2">Подтвердить просмотр</button>}</div>)}</section>
    {detail.conversation.mode === "human_active" && <form onSubmit={send} className="rounded-2xl bg-white p-5"><textarea name="content" required maxLength={4000} className="min-h-32 w-full rounded-xl border p-3" /><button className="mt-3 rounded-xl bg-[#c98778] px-5 py-3 text-white">Отправить от Александры</button></form>}
  </div>;
}
