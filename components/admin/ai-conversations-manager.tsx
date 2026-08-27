"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch } from "@/src/lib/admin-fetch";

type Conversation = { id: string; client: string; mode: string; status: string; last_message_at?: string; human_requested: boolean; human_active: boolean; takeover_operator?: string; risk_severity?: string; unread: number };

export function AiConversationsManager({ attention = false }: { attention?: boolean }) {
  const [rows, setRows] = useState<Conversation[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    adminFetch(`/api/admin/ai/clinical/conversations${attention ? "?attention=true" : ""}`)
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setRows(payload); })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Не удалось загрузить диалоги"));
  }, [attention]);
  return <div className="mt-8 space-y-4">
    {error && <p role="alert" className="rounded-xl bg-[#fff1ed] p-4 text-[#8b3f32]">{error}</p>}
    {!error && rows.length === 0 && <p className="rounded-xl bg-white p-5">Диалогов в этой очереди нет.</p>}
    {rows.map((row) => <Link key={row.id} href={`/admin/ai/conversations/${row.id}`} className="block rounded-2xl border border-[#ead7d1] bg-white p-5">
      <div className="flex flex-wrap justify-between gap-3"><strong>{row.client}</strong><span>{row.mode}</span></div>
      <p className="mt-2 text-sm text-[#6b5b57]">{row.last_message_at ? new Date(row.last_message_at).toLocaleString("ru-RU") : "Сообщений пока нет"}</p>
      {(row.human_requested || row.human_active) && <p className="mt-2 text-sm text-[#9b4e3f]">{row.human_active ? "Диалог принят оператором" : "Ожидает внимания"}</p>}
      {(row.risk_severity || row.unread > 0) && <p className="mt-2 text-sm">Risk: {row.risk_severity ?? "—"} · непросмотрено: {row.unread}</p>}
    </Link>)}
  </div>;
}
