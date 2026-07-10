"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";

type Certificate = {
  id: string;
  title: string;
  description: string | null;
  image: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type CertificateDraft = {
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  sortOrder: number;
  published: boolean;
  file: File | null;
};

const emptyDraft: CertificateDraft = {
  title: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  sortOrder: 0,
  published: true,
  file: null,
};

function buildFormData(certificate: CertificateDraft | Certificate, file?: File | null) {
  const formData = new FormData();

  formData.set("title", certificate.title);
  formData.set("description", certificate.description ?? "");
  formData.set("seoTitle", certificate.seoTitle ?? "");
  formData.set("seoDescription", certificate.seoDescription ?? "");
  formData.set("seoKeywords", certificate.seoKeywords ?? "");
  formData.set("sortOrder", String(certificate.sortOrder));
  formData.set("published", certificate.published ? "true" : "false");

  if (file) {
    formData.set("file", file);
  } else if ("file" in certificate && certificate.file) {
    formData.set("file", certificate.file);
  }

  return formData;
}

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [draft, setDraft] = useState<CertificateDraft>(emptyDraft);
  const [replacementFiles, setReplacementFiles] = useState<Record<string, File | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadCertificates() {
    const response = await fetch("/api/admin/certificates");
    const data = (await response.json()) as Certificate[];

    setCertificates(data);
    setLoading(false);
  }

  async function createCertificate() {
    setSaving(true);
    setError(null);

    const response = await fetch("/api/admin/certificates", {
      method: "POST",
      body: buildFormData(draft),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось сохранить документ.");
      setSaving(false);
      return;
    }

    setDraft(emptyDraft);
    setSaving(false);
    await loadCertificates();
  }

  async function updateCertificate(certificate: Certificate) {
    setError(null);

    const response = await fetch(`/api/admin/certificates/${certificate.id}`, {
      method: "PATCH",
      body: buildFormData(certificate, replacementFiles[certificate.id]),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Не удалось сохранить изменения.");
      return;
    }

    setReplacementFiles((files) => ({ ...files, [certificate.id]: null }));
    await loadCertificates();
  }

  async function deleteCertificate(id: string) {
    const confirmed = window.confirm("Удалить этот документ?");
    if (!confirmed) return;

    await fetch(`/api/admin/certificates/${id}`, {
      method: "DELETE",
    });

    await loadCertificates();
  }

  function updateLocalCertificate(id: string, patch: Partial<Certificate>) {
    setCertificates((items) =>
      items.map((certificate) =>
        certificate.id === id ? { ...certificate, ...patch } : certificate
      )
    );
  }

  function setDraftFile(event: ChangeEvent<HTMLInputElement>) {
    setDraft((current) => ({
      ...current,
      file: event.target.files?.[0] ?? null,
    }));
  }

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/admin/certificates", { signal: controller.signal })
      .then((response) => response.json())
      .then((data: Certificate[]) => {
        setCertificates(data);
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
          <h2 className="font-serif text-4xl text-[#332725]">
            Новый диплом или сертификат
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_160px]">
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              className="rounded-2xl border border-[#ead7d1] px-4 py-3"
              placeholder="Название документа"
            />

            <input
              value={draft.sortOrder}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sortOrder: Number(event.target.value) || 0,
                }))
              }
              type="number"
              className="rounded-2xl border border-[#ead7d1] px-4 py-3"
              placeholder="Порядок"
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
            rows={3}
            className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
            placeholder="Описание, если нужно"
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

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={setDraftFile}
            className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
          />

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
            Показывать на сайте
          </label>

          {error && (
            <p className="mt-4 rounded-2xl bg-[#fff3df] px-4 py-3 text-sm text-[#9a5a1f]">
              {error}
            </p>
          )}

          <button
            onClick={createCertificate}
            disabled={saving}
            className="mt-6 rounded-2xl bg-[#332725] px-6 py-3 text-white disabled:opacity-60"
          >
            {saving ? "Сохраняю..." : "Добавить документ"}
          </button>
        </div>

        <h2 className="mt-14 font-serif text-4xl text-[#332725]">
          Управление дипломами
        </h2>

        <div className="mt-8 grid gap-6">
          {certificates.map((certificate) => {
            const isOpen = openedId === certificate.id;

            return (
              <div
                key={certificate.id}
                className="rounded-[2rem] border border-[#ead7d1] bg-white p-5 shadow-sm"
              >
                <div className="grid gap-5 md:grid-cols-[140px_1fr_160px_130px_130px] md:items-center">
                  <div className="relative h-40 overflow-hidden rounded-2xl bg-[#fff8f6]">
                    <Image
                      src={certificate.image}
                      alt={certificate.title}
                      fill
                      className="object-contain p-2"
                    />
                  </div>

                  <div>
                    <span
                      className={
                        certificate.published
                          ? "rounded-full bg-[#edf7ed] px-3 py-1 text-sm text-[#5f8a5f]"
                          : "rounded-full bg-[#ffe2c2] px-3 py-1 text-sm text-[#9a5a1f]"
                      }
                    >
                      {certificate.published ? "На сайте" : "Скрыт"}
                    </span>

                    <h3 className="mt-4 text-xl font-medium text-[#332725]">
                      {certificate.title}
                    </h3>

                    <p className="mt-2 text-sm text-[#8a7a76]">
                      Порядок: {certificate.sortOrder}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      updateCertificate({
                        ...certificate,
                        published: !certificate.published,
                      })
                    }
                    className="rounded-xl bg-[#332725] px-4 py-2 text-sm text-white"
                  >
                    {certificate.published ? "Скрыть" : "Показать"}
                  </button>

                  <button
                    onClick={() => setOpenedId(isOpen ? null : certificate.id)}
                    className="rounded-xl border border-[#332725] px-4 py-2 text-sm text-[#332725]"
                  >
                    {isOpen ? "Свернуть" : "Открыть"}
                  </button>

                  <button
                    onClick={() => deleteCertificate(certificate.id)}
                    className="rounded-xl border border-[#b94a48] px-4 py-2 text-sm text-[#b94a48]"
                  >
                    Удалить
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-6 border-t border-[#ead7d1] pt-6">
                    <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                      <input
                        value={certificate.title}
                        onChange={(event) =>
                          updateLocalCertificate(certificate.id, {
                            title: event.target.value,
                          })
                        }
                        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                        placeholder="Название документа"
                      />

                      <input
                        value={certificate.sortOrder}
                        onChange={(event) =>
                          updateLocalCertificate(certificate.id, {
                            sortOrder: Number(event.target.value) || 0,
                          })
                        }
                        type="number"
                        className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                        placeholder="Порядок"
                      />
                    </div>

                    <textarea
                      value={certificate.description ?? ""}
                      onChange={(event) =>
                        updateLocalCertificate(certificate.id, {
                          description: event.target.value,
                        })
                      }
                      rows={3}
                      className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
                      placeholder="Описание"
                    />

                    <div className="mt-4 rounded-2xl bg-[#fff8f6] p-5">
                      <p className="text-sm uppercase tracking-[0.18em] text-[#8a7a76]">
                        SEO-метки
                      </p>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <input
                          value={certificate.seoTitle ?? ""}
                          onChange={(event) =>
                            updateLocalCertificate(certificate.id, {
                              seoTitle: event.target.value,
                            })
                          }
                          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                          placeholder="SEO-заголовок"
                        />

                        <input
                          value={certificate.seoKeywords ?? ""}
                          onChange={(event) =>
                            updateLocalCertificate(certificate.id, {
                              seoKeywords: event.target.value,
                            })
                          }
                          className="rounded-2xl border border-[#ead7d1] px-4 py-3"
                          placeholder="Ключевые слова через запятую"
                        />
                      </div>

                      <textarea
                        value={certificate.seoDescription ?? ""}
                        onChange={(event) =>
                          updateLocalCertificate(certificate.id, {
                            seoDescription: event.target.value,
                          })
                        }
                        rows={3}
                        className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
                        placeholder="SEO-описание"
                      />
                    </div>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) =>
                        setReplacementFiles((files) => ({
                          ...files,
                          [certificate.id]: event.target.files?.[0] ?? null,
                        }))
                      }
                      className="mt-4 w-full rounded-2xl border border-[#ead7d1] px-4 py-3"
                    />

                    <button
                      onClick={() => updateCertificate(certificate)}
                      className="mt-5 rounded-2xl border border-[#332725] px-5 py-3 text-[#332725]"
                    >
                      Сохранить изменения
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
