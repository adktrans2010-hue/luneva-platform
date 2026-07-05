"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const education = [
  "Дипломированный психолог",
  "Гештальт-терапевт",
  "Специалист по работе с травмой и ПТСР",
  "Специалист по расстройствам пищевого поведения",
];

const certificates = [
  "/certificates/cert-1.jpg",
  "/certificates/cert-2.jpg",
  "/certificates/cert-3.jpg",
  "/certificates/cert-4.jpg",
  "/certificates/cert-5.jpg",
  "/certificates/cert-6.jpg",
];

export default function Education() {
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(
    null
  );

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Образование и опыт
        </p>

        <h2 className="font-serif text-5xl text-[#332725]">
          Профессиональная основа моей работы
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f5552]">
          Я постоянно обучаюсь и повышаю квалификацию, чтобы работать бережно,
          профессионально и опираться на современные подходы в психотерапии.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {education.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[#ead7d1] bg-white px-5 py-4 text-[#5f5552]"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {certificates.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setSelectedCertificate(src)}
              className="group overflow-hidden rounded-[1rem] border border-[#ead7d1] bg-white p-2 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-xl bg-white">
                <Image
                  src={src}
                  alt={`Сертификат Александры Луневой ${index + 1}`}
                  width={220}
                  height={300}
                  className="max-h-36 max-w-full object-contain transition duration-300 group-hover:scale-105"
                />
              </div>

              <p className="mt-2 text-center text-xs text-[#8a7a76]">
                Нажмите, чтобы раскрыть
              </p>
            </button>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/certificates"
            className="inline-flex rounded-2xl border border-[#c98778] px-6 py-3 text-[#332725] transition hover:bg-white"
          >
            Смотреть все сертификаты
          </Link>
        </div>
      </div>

      {selectedCertificate && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#332725]/80 px-4 py-8 backdrop-blur-sm"
          onClick={() => setSelectedCertificate(null)}
        >
          <button
            type="button"
            className="absolute right-6 top-6 rounded-full bg-white px-4 py-2 text-[#332725] shadow-lg"
            onClick={() => setSelectedCertificate(null)}
          >
            Закрыть
          </button>

          <div
            className="relative h-[85vh] w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={selectedCertificate}
              alt="Сертификат Александры Луневой"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
}