"use client";

import { useEffect, useMemo, useState } from "react";

type Article = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  h1: string | null;
  image: string | null;
  faq: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type ArticleDraft = {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  image: string;
  faq: string;
  published: boolean;
};

const emptyDraft: ArticleDraft = {
  title: "",
  category: "",
  excerpt: "",
  content: "",
  seoTitle: "",
  seoDescription: "",
  h1: "",
  image: "",
  faq: "",
  published: false,
};

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [draft, setDraft] = useState<ArticleDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  async function loadArticles() {
    const response = await fetch("/api/admin/articles");
    const data = (await response.json()) as Article[];

    setArticles(data);
    setLoading(false);
  }

  async function createArticle() {
    setSaving(true);
    setError(null);

    const response = await fetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось сохранить статью.");
      setSaving(false);
      return;
    }

    setDraft(emptyDraft);
    setSaving(false);
    await loadArticles();
  }

  async function updateArticle(article: Article) {
    setError(null);

    const response = await fetch(`/api/admin/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(article),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось сохранить изменения.");
      return;
    }

    await loadArticles();
  }

  async function deleteArticle(id: string) {
    const confirmed = window.confirm("Удалить эту статью?");
    if (!confirmed) return;

    await fetch(`/api/admin/articles/${id}`, {
      method: "DELETE",
    });

    await loadArticles();
  }

  function updateLocalArticle(id: string, patch: Partial<Article>) {
    setArticles((items) =>
      items.map((article) =>
        article.id === id ? { ...article, ...patch } : article
      )
    );
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  }

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/admin/articles", { signal: controller.signal })
      .then((response) => response.json())
      .then((data: Article[]) => {
        setArticles(data);
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

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        articles
          .map((article) => article.category.trim())
          .filter((category) => category.length > 0)
      )
    ).sort((first, second) => first.localeCompare(second, "ru"));
  }, [articles]);

  const categoryCounts = useMemo(() => {
    return categories.map((category) => ({
      category,
      count: articles.filter((article) => article.category.trim() === category)
        .length,
    }));
  }, [articles, categories]);

  const visibleArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesCategory =
        selectedCategory === "all" ||
        article.category.trim() === selectedCategory;
      const matchesSearch =
        query.length === 0 ||
        [article.title, article.category, article.excerpt, article.content]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [articles, search, selectedCategory]);

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
          <h2 className="font-serif text-4xl text-[#332725]">
            Новая статья
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              className="rounded-2xl border border-[#ead7d1] px-4 py-3"
              placeholder="Заголовок"
            />

            <input
              value={draft.category}
              onChange={(event) =>
                setDraft((current) => ({ ...current, category: event.target.value }))
              }
              className="rounded-2xl border border-[#ead7d1] px-4 py-3"
              placeholder="Рубрика"
            />
          </div>

          <textarea
            value={draft.excerpt}
            onChange={(event) =>
              setDraft((current) => ({ ...current, excerpt: event.target.value }))
            }
            rows={3}
            className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
            placeholder="Краткое описание для карточки"
          />

          <textarea
            value={draft.content}
            onChange={(event) =>
              setDraft((current) => ({ ...current, content: event.target.value }))
            }
            rows={9}
            className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
            placeholder="Полный текст статьи"
          />

          <div className="mt-4 rounded-2xl bg-[#fff8f6] p-5">
            <div className="text-sm uppercase tracking-[0.18em] text-[#c98778]">
              SEO и оформление страницы
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                value={draft.h1}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, h1: event.target.value }))
                }
                className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                placeholder="H1 страницы"
              />

              <input
                value={draft.image}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, image: event.target.value }))
                }
                className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                placeholder="Изображение, например /blog/image.jpg"
              />

              <input
                value={draft.seoTitle}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    seoTitle: event.target.value,
                  }))
                }
                className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                placeholder="SEO Title"
              />

              <input
                value={draft.seoDescription}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    seoDescription: event.target.value,
                  }))
                }
                className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                placeholder="SEO Description"
              />
            </div>

            <textarea
              value={draft.faq}
              onChange={(event) =>
                setDraft((current) => ({ ...current, faq: event.target.value }))
              }
              rows={5}
              className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
              placeholder='FAQ JSON: [{"question":"Вопрос?","answer":"Ответ."}]'
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
            onClick={createArticle}
            disabled={saving}
            className="mt-6 rounded-2xl bg-[#332725] px-6 py-3 text-white disabled:opacity-60"
          >
            {saving ? "Сохраняю..." : "Сохранить статью"}
          </button>
        </div>

        <h2 className="mt-14 font-serif text-4xl text-[#332725]">
          Полезные статьи
        </h2>

        <div className="mt-6 grid gap-4 rounded-[2rem] border border-[#ead7d1] bg-white p-6 shadow-sm lg:grid-cols-[1fr_260px]">
          <label className="block">
            <span className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
              Поиск
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
              placeholder="Найти статью по названию, тексту или рубрике"
            />
          </label>

          <label className="block">
            <span className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
              Категория
            </span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#ead7d1] bg-white px-4 py-3"
            >
              <option value="all">Все категории</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <div className="lg:col-span-2">
            <div className="mb-3 text-sm text-[#8a7a76]">
              Найдено: {visibleArticles.length} из {articles.length}
            </div>

            {categoryCounts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categoryCounts.map((item) => (
                  <button
                    key={item.category}
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === item.category ? "all" : item.category
                      )
                    }
                    className={
                      selectedCategory === item.category
                        ? "rounded-full bg-[#332725] px-4 py-2 text-sm text-white"
                        : "rounded-full border border-[#ead7d1] px-4 py-2 text-sm text-[#5f5552]"
                    }
                  >
                    {item.category} · {item.count}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#ead7d1] bg-white shadow-sm">
          <div className="grid grid-cols-[130px_1fr_140px_170px_130px] gap-4 bg-[#fff8f6] px-6 py-4 text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
            <div>Статус</div>
            <div>Статья</div>
            <div>Дата</div>
            <div>Действие</div>
            <div>Подробнее</div>
          </div>

          {visibleArticles.map((article) => {
            const isOpen = openedId === article.id;

            return (
              <div
                key={article.id}
                className={
                  article.published
                    ? "border-t border-[#ead7d1]"
                    : "border-t border-[#ead7d1] bg-[#fff3df]"
                }
              >
                <div className="grid grid-cols-[130px_1fr_140px_170px_130px] items-center gap-4 px-6 py-4">
                  <div className="text-sm">
                    <span
                      className={
                        article.published
                          ? "rounded-full bg-[#edf7ed] px-3 py-1 text-[#5f8a5f]"
                          : "rounded-full bg-[#ffe2c2] px-3 py-1 text-[#9a5a1f]"
                      }
                    >
                      {article.published ? "Опубликована" : "Черновик"}
                    </span>
                  </div>

                  <div>
                    <div className="text-[#332725]">{article.title}</div>
                    <div className="mt-1 line-clamp-1 text-sm text-[#8a7a76]">
                      {article.category} · /blog/{article.slug}
                    </div>
                  </div>

                  <div className="text-sm text-[#8a7a76]">
                    {formatDate(article.createdAt)}
                  </div>

                  <button
                    onClick={() =>
                      updateArticle({
                        ...article,
                        published: !article.published,
                      })
                    }
                    className="rounded-xl bg-[#332725] px-4 py-2 text-sm text-white"
                  >
                    {article.published ? "Скрыть" : "Опубликовать"}
                  </button>

                  <button
                    onClick={() => setOpenedId(isOpen ? null : article.id)}
                    className="rounded-xl border border-[#332725] px-4 py-2 text-sm text-[#332725]"
                  >
                    {isOpen ? "Свернуть" : "Открыть"}
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-[#ead7d1] bg-white px-6 py-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        value={article.title}
                        onChange={(event) =>
                          updateLocalArticle(article.id, {
                            title: event.target.value,
                          })
                        }
                        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                        placeholder="Заголовок"
                      />

                      <input
                        value={article.category}
                        onChange={(event) =>
                          updateLocalArticle(article.id, {
                            category: event.target.value,
                          })
                        }
                        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                        placeholder="Рубрика"
                      />
                    </div>

                    <textarea
                      value={article.excerpt}
                      onChange={(event) =>
                        updateLocalArticle(article.id, {
                          excerpt: event.target.value,
                        })
                      }
                      rows={3}
                      className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
                      placeholder="Краткое описание"
                    />

                    <textarea
                      value={article.content}
                      onChange={(event) =>
                        updateLocalArticle(article.id, {
                          content: event.target.value,
                        })
                      }
                      rows={9}
                      className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
                      placeholder="Полный текст статьи"
                    />

                    <div className="mt-4 rounded-2xl bg-[#fff8f6] p-5">
                      <div className="text-xs uppercase tracking-[0.18em] text-[#c98778]">
                        SEO, H1, изображение и FAQ
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <input
                          value={article.h1 ?? ""}
                          onChange={(event) =>
                            updateLocalArticle(article.id, {
                              h1: event.target.value,
                            })
                          }
                          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                          placeholder="H1 страницы"
                        />

                        <input
                          value={article.image ?? ""}
                          onChange={(event) =>
                            updateLocalArticle(article.id, {
                              image: event.target.value,
                            })
                          }
                          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                          placeholder="Изображение, например /blog/image.jpg"
                        />

                        <input
                          value={article.seoTitle ?? ""}
                          onChange={(event) =>
                            updateLocalArticle(article.id, {
                              seoTitle: event.target.value,
                            })
                          }
                          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                          placeholder="SEO Title"
                        />

                        <input
                          value={article.seoDescription ?? ""}
                          onChange={(event) =>
                            updateLocalArticle(article.id, {
                              seoDescription: event.target.value,
                            })
                          }
                          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                          placeholder="SEO Description"
                        />
                      </div>

                      <textarea
                        value={article.faq ?? ""}
                        onChange={(event) =>
                          updateLocalArticle(article.id, {
                            faq: event.target.value,
                          })
                        }
                        rows={5}
                        className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
                        placeholder='FAQ JSON: [{"question":"Вопрос?","answer":"Ответ."}]'
                      />
                    </div>

                    <div className="mt-4 rounded-2xl bg-[#fff8f6] p-5 text-sm text-[#5f5552]">
                      <div className="text-xs uppercase tracking-[0.18em] text-[#c98778]">
                        SEO-страница
                      </div>
                      <div className="mt-3 text-[#332725]">
                        Title:{" "}
                        {article.seoTitle || article.title || "Название статьи"}
                      </div>
                      <div className="mt-2">
                        H1: {article.h1 || article.title || "Название статьи"}
                      </div>
                      <div className="mt-2">
                        Описание:{" "}
                        {article.seoDescription ||
                          article.excerpt ||
                          "Краткое описание статьи"}
                      </div>
                      <div className="mt-2">Адрес: /blog/{article.slug}</div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => updateArticle(article)}
                        className="rounded-2xl border border-[#332725] px-5 py-3 text-[#332725]"
                      >
                        Сохранить изменения
                      </button>

                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="rounded-2xl border border-[#b94a48] px-5 py-3 text-[#b94a48]"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {visibleArticles.length === 0 && (
            <div className="border-t border-[#ead7d1] px-6 py-10 text-[#8a7a76]">
              По этому запросу статьи не найдены.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
