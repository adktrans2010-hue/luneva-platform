"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/src/lib/admin-fetch";

type ClientUsage = {
  client_id: string;
  client: string;
  enabled: boolean;
  expires_at?: string | null;
  allowed_models: string[];
  usage_usd: number;
  requests: number;
  failed_requests: number;
  daily_usage_usd: number;
  daily_remaining_usd: number;
  daily_request_limit: number;
};

type Usage = {
  period_start: string;
  provider: string;
  configured_model?: string | null;
  global_budget_usd: number;
  usage_usd: number;
  remaining_usd: number;
  global_daily_budget_usd: number;
  daily_usage_usd: number;
  daily_remaining_usd: number;
  requests: number;
  failed_requests: number;
  budget_exhaustion_events: number;
  safety_block_events: number;
  input_tokens: number;
  output_tokens: number;
  clients: ClientUsage[];
};

export function AiPilotUsage() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/ai/clinical/pilot/usage")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        setUsage(payload);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Не удалось загрузить usage"));
  }, []);

  if (error) return <p role="alert" className="mt-8 rounded-xl bg-[#fff1ed] p-4 text-[#8b3f32]">{error}</p>;
  if (!usage) return <p className="mt-8 rounded-xl bg-white p-5">Загрузка usage…</p>;

  return <div className="mt-8 space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Budget" value={`$${usage.global_budget_usd.toFixed(2)}`} />
      <Metric label="Usage / reserved" value={`$${usage.usage_usd.toFixed(4)}`} />
      <Metric label="Remaining" value={`$${usage.remaining_usd.toFixed(4)}`} />
      <Metric label="Failed / exhausted" value={`${usage.failed_requests} / ${usage.budget_exhaustion_events}`} />
      <Metric label="Daily remaining" value={`$${usage.daily_remaining_usd.toFixed(4)} / $${usage.global_daily_budget_usd.toFixed(2)}`} />
      <Metric label="Tokens in / out" value={`${usage.input_tokens} / ${usage.output_tokens}`} />
      <Metric label="Safety blocks" value={`${usage.safety_block_events}`} />
    </div>
    <div className="rounded-2xl border border-[#ead7d1] bg-white p-5">
      <p className="text-sm text-[#6b5b57]">Provider: {usage.provider} · Model: {usage.configured_model ?? "не настроена"}</p>
      <p className="mt-2 text-sm text-[#6b5b57]">Период с {new Date(usage.period_start).toLocaleDateString("ru-RU")} · запросов: {usage.requests}</p>
    </div>
    <div className="space-y-3">
      {usage.clients.length === 0 && <p className="rounded-xl bg-white p-5">Pilot entitlements пока не выданы. Default deny активен.</p>}
      {usage.clients.map((client) => <article key={client.client_id} className="rounded-2xl border border-[#ead7d1] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><strong>{client.client}</strong><span>{client.enabled ? "enabled" : "disabled"}</span></div>
        <p className="mt-2 text-sm text-[#6b5b57]">Usage ${client.usage_usd.toFixed(4)} · requests {client.requests} · failed {client.failed_requests}</p>
        <p className="mt-1 text-sm text-[#6b5b57]">Today ${client.daily_usage_usd.toFixed(4)} · remaining ${client.daily_remaining_usd.toFixed(4)} · limit {client.daily_request_limit} requests</p>
        <p className="mt-1 break-words text-sm text-[#6b5b57]">Models: {client.allowed_models.join(", ") || "global allowlist"}</p>
      </article>)}
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[#ead7d1] bg-white p-5"><p className="text-sm text-[#6b5b57]">{label}</p><p className="mt-2 text-2xl font-medium">{value}</p></div>;
}
