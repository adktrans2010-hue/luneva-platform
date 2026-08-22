import type { CertificatePreview } from "@/src/lib/certificate-previews";

export type QualificationCertificateId =
  | "psychology-degree"
  | "gestalt-therapist"
  | "trauma-ptsd"
  | "eating-disorders"
  | "teacher-author";

export type QualificationCertificateCard = {
  id: QualificationCertificateId;
  title: string;
  modalTitle: string;
  actionLabel: string;
  certificates: CertificatePreview[];
  externalUrl?: string;
};

const eatingDisorderCertificates: CertificatePreview[] = Array.from(
  { length: 9 },
  (_, index) => ({
    id: `eating-disorders-${index + 1}`,
    title: `Документ по РПП ${index + 1}`,
    description: "Диплом или сертификат по работе с расстройствами пищевого поведения",
    image: `/certificates/rpp/rpp-${String(index + 1).padStart(2, "0")}.jpg`,
  }),
);

const qualificationCertificateCards: QualificationCertificateCard[] = [
  {
    id: "psychology-degree",
    title: "Дипломированный психолог",
    modalTitle: "Бакалавр психологии",
    actionLabel: "Посмотреть диплом",
    externalUrl: "https://disk.yandex.ru/i/BCxIxjh5yfos-A",
    certificates: [
      {
        id: "psychology-degree-bachelor",
        title: "Бакалавр психологии",
        description: "Документ о психологическом образовании",
        image: "/certificates/imported/Диплом о переподготовке.jpg",
      },
    ],
  },
  {
    id: "gestalt-therapist",
    title: "Гештальт-терапевт",
    modalTitle: "2 ступень — Гештальт-терапевт",
    actionLabel: "Посмотреть диплом",
    certificates: [
      {
        id: "gestalt-therapist-second-stage",
        title: "2 ступень — Гештальт-терапевт",
        description: "Документ о подготовке в гештальт-подходе",
        image: "/certificates/gestalt/gestalt-therapist.jpg",
      },
    ],
  },
  {
    id: "trauma-ptsd",
    title: "Специалист по травме и ПТСР",
    modalTitle: "Специалист по работе с травмой, утратой и ПТСР",
    actionLabel: "Посмотреть сертификат",
    externalUrl: "https://disk.yandex.ru/i/olAMpm4Vr1zBJA",
    certificates: [
      {
        id: "trauma-ptsd-specialist",
        title: "Специалист по работе с травмой, утратой и ПТСР",
        description: "Сертификат о повышении квалификации",
        image: "/certificates/imported/Лунева Александра Александровна2_page-0001.jpg",
      },
    ],
  },
  {
    id: "eating-disorders",
    title: "Специалист по расстройствам пищевого поведения",
    modalTitle: "Дипломы и сертификаты по РПП",
    actionLabel: "Посмотреть сертификаты",
    certificates: eatingDisorderCertificates,
  },
  {
    id: "teacher-author",
    title: "Автор и преподаватель курсов",
    modalTitle: "Преподаватель психологии",
    actionLabel: "Посмотреть сертификат",
    certificates: [
      {
        id: "teacher-author-psychology",
        title: "Преподаватель психологии",
        description: "Документ о преподавательской квалификации",
        image: "/certificates/teaching/teacher-author.jpg",
      },
    ],
  },
];

export function getQualificationCertificateCards(): QualificationCertificateCard[] {
  return qualificationCertificateCards;
}
