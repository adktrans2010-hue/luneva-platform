"use client";

import { useState } from "react";

export default function ReviewForm() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [text, setText] = useState("");
  const [website, setWebsite] = useState("");
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, age, text, website, formStartedAt }),
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    setName("");
    setAge("");
    setText("");
    setWebsite("");
    setFormStartedAt(Date.now());
    setStatus("success");
  }

  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#ead7d1] bg-[#fff8f6] p-8 shadow-sm">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Поделиться опытом
        </p>

        <h2 className="font-serif text-4xl text-[#332725]">
          Оставить отзыв
        </h2>

        <p className="mt-4 leading-7 text-[#5f5552]">
          Отзыв появится на сайте после проверки и публикации.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <input
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ваше имя"
            required
            className="w-full rounded-2xl border border-[#ead7d1] bg-white px-5 py-4 outline-none"
          />

          <input
            value={age}
            onChange={(event) => setAge(event.target.value)}
            placeholder="Возраст, например: 34 года"
            className="w-full rounded-2xl border border-[#ead7d1] bg-white px-5 py-4 outline-none"
          />

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ваш отзыв"
            required
            rows={6}
            className="w-full rounded-2xl border border-[#ead7d1] bg-white px-5 py-4 outline-none"
          />

          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-2xl bg-[#332725] px-8 py-4 text-white shadow-lg disabled:opacity-60"
          >
            {status === "loading" ? "Отправляем..." : "Отправить отзыв"}
          </button>

          {status === "success" && (
            <p className="text-[#5f8a5f]">
              Спасибо! Отзыв отправлен и появится после проверки.
            </p>
          )}

          {status === "error" && (
            <p className="text-[#b94a48]">
              Не удалось отправить отзыв. Проверьте поля и попробуйте ещё раз.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
