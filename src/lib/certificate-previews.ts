import type { Certificate } from "@/src/lib/certificates";

export type CertificatePreview = {
  id: string;
  title: string;
  description: string | null;
  image: string;
};

export function toCertificatePreviews(
  certificates: Pick<Certificate, "id" | "title" | "description" | "image">[],
): CertificatePreview[] {
  return certificates.map((certificate) => ({
    id: certificate.id,
    title: certificate.title,
    description: certificate.description ?? null,
    image: certificate.image,
  }));
}

export function getCertificateImageSrc(certificate: CertificatePreview) {
  if (!certificate.image) return "";

  const separator = certificate.image.includes("?") ? "&" : "?";

  return `${certificate.image}${separator}v=2-${encodeURIComponent(certificate.id)}`;
}
