"use client";

import Image from "next/image";
import { useState } from "react";

import type { Certificate } from "@/src/lib/certificates";

type CertificateGalleryProps = {
  certificates: Certificate[];
};

function getCertificateImageSrc(certificate: Certificate) {
  const separator = certificate.image.includes("?") ? "&" : "?";

  return `${certificate.image}${separator}v=2-${encodeURIComponent(certificate.id)}`;
}

export default function CertificateGallery({
  certificates,
}: CertificateGalleryProps) {
  const [selected, setSelected] = useState<Certificate | null>(null);

  return (
    <>
      <div className="mt-16 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {certificates.map((certificate, index) => (
          <button
            key={certificate.id}
            type="button"
            onClick={() => setSelected(certificate)}
            className="group rounded-[2rem] border border-[#ead7d1] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex h-72 items-center justify-center">
              <Image
                src={getCertificateImageSrc(certificate)}
                alt={certificate.title || `Сертификат ${index + 1}`}
                width={260}
                height={360}
                loading="lazy"
                sizes="(min-width: 1024px) 260px, (min-width: 640px) 40vw, 80vw"
                className="max-h-full object-contain transition group-hover:scale-105"
              />
            </div>

            <p className="mt-4 text-sm text-[#8a7a76]">
              {certificate.title}
            </p>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#332725]/80 p-6 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            className="absolute right-8 top-8 rounded-full bg-white px-5 py-3 text-[#332725]"
          >
            Закрыть
          </button>

          <div className="relative h-[85vh] w-full max-w-5xl">
            <Image
              src={getCertificateImageSrc(selected)}
              alt={selected.title}
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
