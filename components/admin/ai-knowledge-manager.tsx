"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { adminFetch } from "@/src/lib/admin-fetch";

type KnowledgeDocument = {
  id: string;
  title: string;
  description: string | null;
  source_type: string;
  status: "processing" | "draft" | "active" | "archived" | "failed";
  original_filename: string;
  created_at: string;
  activated_at: string | null;
  archived_at: string | null;
  error_message: string | null;
};

const statusLabels: Record<KnowledgeDocument["status"], string> = {
  processing: "Обрабатывается",
  draft: "Готов к активации",
  active: "Активен",
  archived: "В архиве",
  failed: "Ошибка обработки",
};

async function responsePayload(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? "Не удалось выполнить действие.");
  return body;
}

export function AiKnowledgeManager() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await adminFetch("/api/admin/ai/knowledge", {
        cache: "no-store",
      });
      setDocuments(await responsePayload(response));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить документы.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy("upload");
    setError("");
    try {
      const response = await adminFetch("/api/admin/ai/knowledge", {
        method: "POST",
        body: new FormData(form),
      });
      await responsePayload(response);
      form.reset();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить документ.");
    } finally {
      setBusy(null);
    }
  }

  async function action(id: string, name: "activate" | "archive", form?: HTMLFormElement) {
    setBusy(id);
    setError("");
    try {
      const response = await adminFetch(`/api/admin/ai/knowledge/${id}/${name}`, {
        method: "POST",
        body: form ? new FormData(form) : undefined,
      });
      await responsePayload(response);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось выполнить действие.");
    } finally {
      setBusy(null);
    }
  }

  async function reprocess(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(id);
    setError("");
    try {
      const response = await adminFetch(`/api/admin/ai/knowledge/${id}/reprocess`, {
        method: "POST",
        body: new FormData(form),
      });
      await responsePayload(response);
      form.reset();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось обработать документ повторно.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="bg-[#fff8f6] px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {error && (
          <div role="alert" className="rounded-2xl border border-[#dca99d] bg-white p-4 text-[#8b3f32]">
            {error}
          </div>
        )}

        <form onSubmit={upload} className="grid gap-5 rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm md:grid-cols-2 md:p-8">
          <label className="grid gap-2 text-[#5f5552]">
            Название
            <input name="title" maxLength={300} className="rounded-xl border border-[#ead7d1] px-4 py-3" />
          </label>
          <label className="grid gap-2 text-[#5f5552]">
            Файл TXT, Markdown, DOCX или PDF
            <input name="file" type="file" required accept=".txt,.md,.markdown,.docx,.pdf" className="rounded-xl border border-[#ead7d1] px-4 py-3" />
          </label>
          <label className="grid gap-2 text-[#5f5552] md:col-span-2">
            Краткое описание
            <textarea name="description" rows={3} className="rounded-xl border border-[#ead7d1] px-4 py-3" />
          </label>
          <button disabled={busy !== null} className="w-fit rounded-xl bg-[#c98778] px-6 py-3 text-white disabled:opacity-50">
            {busy === "upload" ? "Загрузка…" : "Загрузить документ"}
          </button>
        </form>

        {loading ? (
          <p className="text-[#5f5552]">Загрузка базы знаний…</p>
        ) : documents.length === 0 ? (
          <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 text-[#5f5552]">
            В базе знаний пока нет документов.
          </div>
        ) : (
          <div className="grid gap-5">
            {documents.map((document) => (
              <article key={document.id} className="min-w-0 overflow-hidden rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-medium text-[#332725]">{document.title}</h2>
                    <p className="mt-2 break-all text-sm text-[#7a6c68]">{document.original_filename}</p>
                    <p className="mt-2 text-sm text-[#7a6c68]">
                      Загружен {new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(document.created_at))}
                    </p>
                    {document.description && <p className="mt-4 text-[#5f5552]">{document.description}</p>}
                  </div>
                  <span className="w-fit rounded-full bg-[#fff1ed] px-4 py-2 text-sm text-[#9a5d50]">
                    {statusLabels[document.status]}
                  </span>
                </div>

                {document.status === "failed" && (
                  <p role="alert" className="mt-5 rounded-xl bg-[#fff1ed] p-4 text-[#8b3f32]">
                    {document.error_message || "Документ не удалось обработать. Попробуйте загрузить файл повторно."}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  {document.status === "draft" && (
                    <button disabled={busy === document.id} onClick={() => void action(document.id, "activate")} className="rounded-xl bg-[#c98778] px-5 py-2.5 text-white disabled:opacity-50">
                      Активировать
                    </button>
                  )}
                  {document.status !== "archived" && document.status !== "processing" && (
                    <button disabled={busy === document.id} onClick={() => void action(document.id, "archive")} className="rounded-xl border border-[#c98778] px-5 py-2.5 text-[#9a5d50] disabled:opacity-50">
                      В архив
                    </button>
                  )}
                </div>

                {document.status !== "processing" && (
                  <form onSubmit={(event) => void reprocess(event, document.id)} className="mt-6 flex flex-col gap-3 border-t border-[#f0dfda] pt-6 sm:flex-row sm:items-center">
                    <input name="file" type="file" required accept=".txt,.md,.markdown,.docx,.pdf" className="w-full min-w-0 max-w-full flex-1 rounded-xl border border-[#ead7d1] px-4 py-3" />
                    <button disabled={busy === document.id} className="rounded-xl border border-[#c98778] px-5 py-3 text-[#9a5d50] disabled:opacity-50">
                      Обработать заново
                    </button>
                  </form>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
