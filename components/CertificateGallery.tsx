"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import CertificateLightbox from "@/components/CertificateLightbox";
import {
  getCertificateImageSrc,
  type CertificatePreview,
} from "@/src/lib/certificate-previews";

type CertificateGalleryProps = {
  certificates: CertificatePreview[];
};

export default function CertificateGallery({
  certificates,
}: CertificateGalleryProps) {
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  function openCertificate(index: number, opener: HTMLButtonElement) {
    openerRef.current = opener;
    setSelectedIndex(index);
  }

  function closeCertificate() {
    setSelectedIndex(null);
    window.requestAnimationFrame(() => openerRef.current?.focus());
  }

  return (
    <>
      <div className="mt-16 grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {certificates.map((certificate, index) => (
          <button
            key={certificate.id}
            type="button"
            onClick={(event) => openCertificate(index, event.currentTarget)}
            className="group rounded-[2rem] border border-[#ead7d1] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c98778] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
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

      {selectedIndex !== null && (
        <CertificateLightbox
          certificates={certificates}
          initialIndex={selectedIndex}
          title="Дипломы и сертификаты"
          onClose={closeCertificate}
        />
      )}
    </>
  );
}
