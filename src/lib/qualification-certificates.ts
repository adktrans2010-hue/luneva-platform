import type { Certificate } from "@/src/lib/certificates";
import type { CertificatePreview } from "@/src/lib/certificate-previews";
import { toCertificatePreviews } from "@/src/lib/certificate-previews";

export type QualificationCertificateId =
  | "psychology-degree"
  | "gestalt-therapy"
  | "trauma-ptsd"
  | "eating-disorders"
  | "course-author";

type QualificationCertificateMatch = {
  keywords: string[];
  imageHints: string[];
  fallbackOrder: number[];
  gallery?: boolean;
};

export type QualificationCertificateCard = {
  id: QualificationCertificateId;
  title: string;
  modalTitle: string;
  actionLabel: string;
  certificates: CertificatePreview[];
};

const fallbackCertificates: CertificatePreview[] = [
  {
    id: "fallback-psychology-degree",
    title: "Бакалавр психологии",
    description: "Документ о психологическом образовании",
    image: "/certificates/imported/Диплом о переподготовке.jpg",
  },
  {
    id: "fallback-gestalt-therapy",
    title: "2 ступень — Гештальт-терапевт",
    description: "Документ о подготовке в гештальт-подходе",
    image: "/certificates/imported/Скан_20220418.jpg",
  },
  {
    id: "fallback-trauma-ptsd",
    title: "Специалист по работе с травмой, утратой и ПТСР",
    description: "Сертификат о повышении квалификации",
    image: "/certificates/imported/Лунева Александра Александровна2_page-0001.jpg",
  },
  {
    id: "fallback-eating-disorders",
    title: "Сертификат по работе с расстройствами пищевого поведения",
    description: "Документ по теме РПП",
    image: "/certificates/imported/сертификат по рпп_page-0001.jpg",
  },
  {
    id: "fallback-course-author",
    title: "Преподаватель психологии",
    description: "Документ о преподавательской квалификации",
    image: "/certificates/imported/препод псих.jpg",
  },
];

const qualificationDefinitions: Array<
  Omit<QualificationCertificateCard, "certificates"> & {
    match: QualificationCertificateMatch;
  }
> = [
  {
    id: "psychology-degree",
    title: "Дипломированный психолог",
    modalTitle: "Бакалавр психологии",
    actionLabel: "Посмотреть диплом",
    match: {
      keywords: ["бакалавр", "психолог", "диплом"],
      imageHints: ["диплом о переподготовке", "cert-1"],
      fallbackOrder: [1],
    },
  },
  {
    id: "gestalt-therapy",
    title: "Гештальт-терапевт",
    modalTitle: "2 ступень — Гештальт-терапевт",
    actionLabel: "Посмотреть диплом",
    match: {
      keywords: ["гештальт", "2 ступ", "терапевт"],
      imageHints: ["скан_20220418", "cert-2"],
      fallbackOrder: [2],
    },
  },
  {
    id: "trauma-ptsd",
    title: "Специалист по травме и ПТСР",
    modalTitle: "Специалист по работе с травмой, утратой и ПТСР",
    actionLabel: "Посмотреть сертификат",
    match: {
      keywords: ["травм", "утрат", "птср"],
      imageHints: ["лунева александра александровна2", "cert-3"],
      fallbackOrder: [3],
    },
  },
  {
    id: "eating-disorders",
    title: "Специалист по расстройствам пищевого поведения",
    modalTitle: "Дипломы и сертификаты по РПП",
    actionLabel: "Посмотреть сертификаты",
    match: {
      keywords: ["рпп", "пищев", "расстройств"],
      imageHints: ["сертификат по рпп", "cert-4"],
      fallbackOrder: [4],
      gallery: true,
    },
  },
  {
    id: "course-author",
    title: "Автор и преподаватель курсов",
    modalTitle: "Преподаватель психологии",
    actionLabel: "Посмотреть сертификат",
    match: {
      keywords: ["преподав", "курс", "психолог"],
      imageHints: ["препод псих", "препод дпо", "cert-5", "cert-6"],
      fallbackOrder: [5, 6],
    },
  },
];

const qualificationCertificateOverrides: Partial<
  Record<QualificationCertificateId, CertificatePreview[]>
> = {
  "gestalt-therapy": [
    {
      id: "gestalt-therapy-yandex",
      title: "Гештальт-терапевт",
      description: "Документ о подготовке в гештальт-подходе",
      image: "",
      externalUrl: "https://disk.yandex.ru/i/N86LaG0kj-B7Pw",
    },
  ],
  "eating-disorders": [
    "https://disk.yandex.ru/i/5dePP6DGK9Gngw",
    "https://disk.yandex.ru/i/6c4kZ9ISHO_zVA",
    "https://disk.yandex.ru/i/-BA0bM-C2t7biw",
    "https://disk.yandex.ru/i/vaDvNhOG_ypLEg",
    "https://disk.yandex.ru/i/gCPwOwxgMzFYSg",
    "https://disk.yandex.ru/i/wG_MsdezfIeZPA",
    "https://disk.yandex.ru/i/r43Rx-9UmJ-0dQ",
    "https://disk.yandex.ru/i/GTXktXxSo-woKA",
    "https://disk.yandex.ru/i/iKkkaziI8sThlQ",
  ].map((externalUrl, index) => ({
    id: `eating-disorders-yandex-${index + 1}`,
    title: `Документ по РПП ${index + 1}`,
    description: "Документ по теме расстройств пищевого поведения",
    image: "",
    externalUrl,
  })),
  "course-author": [
    {
      id: "course-author-yandex",
      title: "Автор и преподаватель",
      description: "Документ о преподавательской и авторской работе",
      image: "",
      externalUrl: "https://disk.yandex.ru/i/iGPCpLeOQuL6mQ",
    },
  ],
};

function normalize(value: string) {
  return value.toLowerCase().replaceAll("ё", "е");
}

function matchesCertificate(
  certificate: CertificatePreview,
  match: QualificationCertificateMatch,
) {
  const text = normalize(
    `${certificate.title} ${certificate.description ?? ""} ${certificate.image}`,
  );

  return (
    match.keywords.some((keyword) => text.includes(normalize(keyword))) ||
    match.imageHints.some((hint) => text.includes(normalize(hint)))
  );
}

function byFallbackOrder(
  certificates: CertificatePreview[],
  match: QualificationCertificateMatch,
) {
  return certificates.filter((certificate) =>
    match.fallbackOrder.some((order) => {
      const orderText = String(order);
      return certificate.image.includes(`cert-${orderText}`) || certificate.id.endsWith(orderText);
    }),
  );
}

function resolveCertificates(
  certificates: CertificatePreview[],
  match: QualificationCertificateMatch,
) {
  const matched = certificates.filter((certificate) => matchesCertificate(certificate, match));

  if (matched.length > 0) return match.gallery ? matched : matched.slice(0, 1);

  const fallbackByOrder = byFallbackOrder(certificates, match);
  if (fallbackByOrder.length > 0) return match.gallery ? fallbackByOrder : fallbackByOrder.slice(0, 1);

  const staticFallback = fallbackCertificates.filter((certificate) =>
    matchesCertificate(certificate, match),
  );

  if (staticFallback.length > 0) return match.gallery ? staticFallback : staticFallback.slice(0, 1);

  return match.gallery ? certificates : [];
}

function hasGenericTitle(certificate: CertificatePreview) {
  const title = normalize(certificate.title).trim();
  return /^(диплом|сертификат)\s+\d+$/.test(title);
}

function applyStableDisplayTitle(
  certificates: CertificatePreview[],
  definition: Omit<QualificationCertificateCard, "certificates">,
) {
  return certificates.map((certificate, index) => ({
    ...certificate,
    title: hasGenericTitle(certificate)
      ? certificates.length > 1
        ? `${definition.modalTitle} ${index + 1}`
        : definition.modalTitle
      : certificate.title,
  }));
}

export function getQualificationCertificateCards(
  certificates: Pick<Certificate, "id" | "title" | "description" | "image">[],
): QualificationCertificateCard[] {
  const previews = certificates.length > 0 ? toCertificatePreviews(certificates) : fallbackCertificates;

  return qualificationDefinitions.map((definition) => {
    const resolvedCertificates =
      qualificationCertificateOverrides[definition.id] ??
      resolveCertificates(previews, definition.match);

    return {
      id: definition.id,
      title: definition.title,
      modalTitle: definition.modalTitle,
      actionLabel: definition.actionLabel,
      certificates: applyStableDisplayTitle(resolvedCertificates, definition),
    };
  });
}
