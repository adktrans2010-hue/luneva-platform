"use client";

import Image from "next/image";
import { useState } from "react";

const certificates = [
  "/certificates/cert-1.jpg",
  "/certificates/cert-2.jpg",
  "/certificates/cert-3.jpg",
  "/certificates/cert-4.jpg",
  "/certificates/cert-5.jpg",
  "/certificates/cert-6.jpg",
];

export default function CertificatesPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="bg-[#fff8f6] px-6 py-24">
      <div className="mx-auto max-w-7xl">

        <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#c98778]">
          Образование
        </p>

        <h1 className="font-serif text-6xl text-[#332725]">
          Дипломы и сертификаты
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-[#5f5552]">
          Документы о профессиональном образовании,
          повышении квалификации и дополнительном обучении
          Луневой Александры Александровны.
        </p>


        {/* Галерея */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {certificates.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setSelected(src)}
              className="
                group
                rounded-[2rem]
                border
                border-[#ead7d1]
                bg-white
                p-4
                shadow-sm
                transition
                hover:-translate-y-1
                hover:shadow-xl
              "
            >
              <div className="flex h-72 items-center justify-center">
                <Image
                  src={src}
                  alt={`Сертификат ${index + 1}`}
                  width={260}
                  height={360}
                  className="
                    max-h-full
                    object-contain
                    transition
                    group-hover:scale-105
                  "
                />
              </div>

              <p className="mt-4 text-sm text-[#8a7a76]">
                Нажмите, чтобы открыть
              </p>
            </button>
          ))}
        </div>
      </div>


      {/* Открытие */}
      {selected && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-[#332725]/80
            p-6
            backdrop-blur-sm
          "
          onClick={() => setSelected(null)}
        >
          <button
            className="
              absolute
              right-8
              top-8
              rounded-full
              bg-white
              px-5
              py-3
              text-[#332725]
            "
          >
            Закрыть
          </button>

          <div className="relative h-[85vh] w-full max-w-5xl">
            <Image
              src={selected}
              alt="Сертификат"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

    </section>
  );
}