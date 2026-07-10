"use client";

import { useEffect, useState } from "react";

type Video = {
  id: string;
  title: string;
  description: string | null;
  topic: string;
  type: "short" | "long";
  url: string;
  platform: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type VideoDraft = {
  title: string;
  description: string;
  topic: string;
  type: "short" | "long";
  url: string;
  platform: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  published: boolean;
};

const emptyDraft: VideoDraft = {
  title: "",
  description: "",
  topic: "",
  type: "short",
  url: "",
  platform: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  published: false,
};

const typeLabels = {
  short: "Короткое",
  long: "Длинное",
};

export default function AdminVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [draft, setDraft] = useState<VideoDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadVideos() {
    const response = await fetch("/api/admin/videos");
    const data = (await response.json()) as Video[];

    setVideos(data);
    setLoading(false);
  }

  async function createVideo() {
    setSaving(true);
    setError(null);

    const response = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось сохранить видео.");
      setSaving(false);
      return;
    }

    setDraft(emptyDraft);
    setSaving(false);
    await loadVideos();
  }

  async function updateVideo(video: Video) {
    setError(null);

    const response = await fetch(`/api/admin/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(video),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось сохранить изменения.");
      return;
    }

    await loadVideos();
  }

  async function deleteVideo(id: string) {
    const confirmed = window.confirm("Удалить это видео?");
    if (!confirmed) return;

    await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
    await loadVideos();
  }

  function updateLocalVideo(id: string, patch: Partial<Video>) {
    setVideos((items) =>
      items.map((video) => (video.id === id ? { ...video, ...patch } : video))
    );
  }

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/admin/videos", { signal: controller.signal })
      .then((response) => response.json())
      .then((data: Video[]) => {
        setVideos(data);
        setLoading(false);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl text-[#332725]">Загрузка...</div>
      </section>
    );
  }

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#ead7d1] bg-white p-8 shadow-sm">
          <h2 className="font-serif text-4xl text-[#332725]">Новое видео</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              className="rounded-2xl border border-[#ead7d1] px-4 py-3"
              placeholder="Название"
            />

            <input
              value={draft.topic}
              onChange={(event) =>
                setDraft((current) => ({ ...current, topic: event.target.value }))
              }
              className="rounded-2xl border border-[#ead7d1] px-4 py-3"
              placeholder="Тема"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <select
              value={draft.type}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  type: event.target.value as VideoDraft["type"],
                }))
              }
              className="rounded-2xl border border-[#ead7d1] px-4 py-3"
            >
              <option value="short">Короткое видео</option>
              <option value="long">Длинное видео</option>
            </select>

            <input
              value={draft.platform}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  platform: event.target.value,
                }))
              }
              className="rounded-2xl border border-[#ead7d1] px-4 py-3"
              placeholder="Платформа"
            />

            <input
              value={draft.url}
              onChange={(event) =>
                setDraft((current) => ({ ...current, url: event.target.value }))
              }
              className="rounded-2xl border border-[#ead7d1] px-4 py-3"
              placeholder="Ссылка"
            />
          </div>

          <textarea
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows={4}
            className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
            placeholder="Описание"
          />

          <div className="mt-4 rounded-2xl bg-[#fff8f6] p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
              SEO-метки
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                value={draft.seoTitle}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    seoTitle: event.target.value,
                  }))
                }
                className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                placeholder="SEO-заголовок"
              />

              <input
                value={draft.seoKeywords}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    seoKeywords: event.target.value,
                  }))
                }
                className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                placeholder="Ключевые слова через запятую"
              />
            </div>
            <textarea
              value={draft.seoDescription}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  seoDescription: event.target.value,
                }))
              }
              rows={3}
              className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
              placeholder="SEO-описание"
            />
          </div>

          <label className="mt-5 flex items-center gap-3 text-[#5f5552]">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  published: event.target.checked,
                }))
              }
              className="h-5 w-5"
            />
            Опубликовать сразу
          </label>

          {error && (
            <p className="mt-4 rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
              {error}
            </p>
          )}

          <button
            onClick={createVideo}
            disabled={saving}
            className="mt-6 rounded-2xl bg-[#332725] px-6 py-3 text-white disabled:opacity-60"
          >
            {saving ? "Сохраняю..." : "Добавить видео"}
          </button>
        </div>

        <h2 className="mt-14 font-serif text-4xl text-[#332725]">
          Управление видео
        </h2>

        <div className="mt-8 grid gap-6">
          {videos.map((video) => {
            const isOpen = openedId === video.id;

            return (
              <article
                key={video.id}
                className="rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <span
                      className={
                        video.published
                          ? "rounded-full bg-[#edf7ed] px-3 py-1 text-sm text-[#5f8a5f]"
                          : "rounded-full bg-[#ffe2c2] px-3 py-1 text-sm text-[#9a5a1f]"
                      }
                    >
                      {video.published ? "Опубликовано" : "Черновик"}
                    </span>

                    <h3 className="mt-4 text-2xl font-medium text-[#332725]">
                      {video.title}
                    </h3>

                    <p className="mt-2 text-[#5f5552]">
                      {typeLabels[video.type]} · {video.topic}
                      {video.platform ? ` · ${video.platform}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() =>
                        updateVideo({ ...video, published: !video.published })
                      }
                      className="rounded-xl bg-[#332725] px-4 py-2 text-sm text-white"
                    >
                      {video.published ? "Скрыть" : "Опубликовать"}
                    </button>

                    <button
                      onClick={() => setOpenedId(isOpen ? null : video.id)}
                      className="rounded-xl border border-[#332725] px-4 py-2 text-sm text-[#332725]"
                    >
                      {isOpen ? "Свернуть" : "Открыть"}
                    </button>

                    <button
                      onClick={() => deleteVideo(video.id)}
                      className="rounded-xl border border-[#b94a48] px-4 py-2 text-sm text-[#b94a48]"
                    >
                      Удалить
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-6 border-t border-[#ead7d1] pt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        value={video.title}
                        onChange={(event) =>
                          updateLocalVideo(video.id, {
                            title: event.target.value,
                          })
                        }
                        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                        placeholder="Название"
                      />

                      <input
                        value={video.topic}
                        onChange={(event) =>
                          updateLocalVideo(video.id, {
                            topic: event.target.value,
                          })
                        }
                        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                        placeholder="Тема"
                      />
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <select
                        value={video.type}
                        onChange={(event) =>
                          updateLocalVideo(video.id, {
                            type: event.target.value as Video["type"],
                          })
                        }
                        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                      >
                        <option value="short">Короткое видео</option>
                        <option value="long">Длинное видео</option>
                      </select>

                      <input
                        value={video.platform ?? ""}
                        onChange={(event) =>
                          updateLocalVideo(video.id, {
                            platform: event.target.value,
                          })
                        }
                        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                        placeholder="Платформа"
                      />

                      <input
                        value={video.url}
                        onChange={(event) =>
                          updateLocalVideo(video.id, {
                            url: event.target.value,
                          })
                        }
                        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                        placeholder="Ссылка"
                      />
                    </div>

                    <textarea
                      value={video.description ?? ""}
                      onChange={(event) =>
                        updateLocalVideo(video.id, {
                          description: event.target.value,
                        })
                      }
                      rows={4}
                      className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
                      placeholder="Описание"
                    />

                    <div className="mt-4 rounded-2xl bg-[#fff8f6] p-5">
                      <p className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
                        SEO-метки
                      </p>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <input
                          value={video.seoTitle ?? ""}
                          onChange={(event) =>
                            updateLocalVideo(video.id, {
                              seoTitle: event.target.value,
                            })
                          }
                          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                          placeholder="SEO-заголовок"
                        />

                        <input
                          value={video.seoKeywords ?? ""}
                          onChange={(event) =>
                            updateLocalVideo(video.id, {
                              seoKeywords: event.target.value,
                            })
                          }
                          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                          placeholder="Ключевые слова через запятую"
                        />
                      </div>
                      <textarea
                        value={video.seoDescription ?? ""}
                        onChange={(event) =>
                          updateLocalVideo(video.id, {
                            seoDescription: event.target.value,
                          })
                        }
                        rows={3}
                        className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
                        placeholder="SEO-описание"
                      />
                    </div>

                    <button
                      onClick={() => updateVideo(video)}
                      className="mt-5 rounded-2xl border border-[#332725] px-5 py-3 text-[#332725]"
                    >
                      Сохранить изменения
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
