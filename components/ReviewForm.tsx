"use client";

import { useState } from "react";

import LegalConsent from "@/components/legal/legal-consent";
import StarRating from "@/components/StarRating";

export default function ReviewForm() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [website, setWebsite] = useState("");
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [legalAccepted, setLegalAccepted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        age,
        text,
        rating,
        website,
        formStartedAt,
        legalConsent: legalAccepted,
      }),
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    setName("");
    setAge("");
    setText("");
    setRating(0);
    setWebsite("");
    setFormStartedAt(Date.now());
    setLegalAccepted(false);
    setStatus("success");
  }

  return (
    <section className="bg-[#fffaf8] py-4">
      <div className="mx-auto grid max-w-6xl gap-8 rounded-[1.6rem] border border-[#ead7d1] bg-white/72 p-8 shadow-sm md:grid-cols-[0.9fr_1.5fr] md:p-10">
        <div>
          <h2 className="font-serif text-3xl text-[#332725]">
            Поделитесь своим опытом
          </h2>

          <p className="mt-5 leading-7 text-[#5f5552]">
            Если вам хочется рассказать о своём опыте терапии, вы можете
            оставить отзыв. После проверки он будет опубликован анонимно.
          </p>

          <div className="mt-8 flex gap-4 text-sm leading-6 text-[#8a7a76]">
            <span className="text-xl text-[#c9a59b]">♙</span>
            <p>
              Ваши данные в безопасности
              <br />и не будут опубликованы.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ваше имя (необязательно)"
              className="rounded-xl border border-[#ead7d1] bg-white px-5 py-4 outline-none transition focus:border-[#c98778]"
            />

            <input
              value={age}
              onChange={(event) => setAge(event.target.value)}
              placeholder="Возраст (необязательно)"
              className="rounded-xl border border-[#ead7d1] bg-white px-5 py-4 outline-none transition focus:border-[#c98778]"
            />
          </div>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ваш отзыв"
            required
            rows={6}
            className="mt-4 w-full rounded-xl border border-[#ead7d1] bg-white px-5 py-4 outline-none transition focus:border-[#c98778]"
          />

          <LegalConsent
            checked={legalAccepted}
            onChange={setLegalAccepted}
            className="mt-4"
          />

          <div className="mt-4 grid items-center gap-5 md:grid-cols-[1fr_auto]">
            <div className="text-[#8a7a76]">
              <div className="mb-1 text-sm">Ваша оценка</div>
              <StarRating value={rating} onChange={setRating} size="lg" />
              {rating === 0 && (
                <div className="mt-1 text-sm">Выберите количество звёзд</div>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "loading" || !legalAccepted || rating === 0}
              className="rounded-xl bg-[#332725] px-10 py-4 text-white shadow-lg disabled:opacity-60"
            >
              {status === "loading" ? "Отправляем..." : "Отправить отзыв"}
            </button>
          </div>

          {status === "success" && (
            <p className="mt-4 text-[#5f8a5f]">
              Спасибо! Отзыв отправлен и появится после проверки.
            </p>
          )}

          {status === "error" && (
            <p className="mt-4 text-[#b94a48]">
              Не удалось отправить отзыв. Проверьте поля и попробуйте ещё раз.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
