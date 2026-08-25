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
};

const eatingDisorderCertificates: CertificatePreview[] = [
  {
    id: "eating-disorders-gestalt",
    title: "Работа с РПП в гештальт-подходе",
    description: "Сертификат о специализации по работе с пищевым поведением",
    image: "/certificates/rpp/rpp-gestalt.jpg",
  },
  {
    id: "eating-disorders-children-adolescents",
    title: "Терапия РПП детей и подростков",
    description: "Удостоверение о повышении квалификации",
    image: "/certificates/rpp/rpp-children-adolescents.jpg",
  },
  {
    id: "eating-disorders-group-therapy",
    title: "Групповая терапия пищевого поведения",
    description: "Сертификат об участии в терапевтической группе",
    image: "/certificates/rpp/rpp-group-therapy.jpg",
  },
  {
    id: "eating-disorders-diagnostics-treatment",
    title: "Диагностика и лечение РПП",
    description: "Сертификат участника научно-практической конференции",
    image: "/certificates/rpp/rpp-diagnostics-treatment.jpg",
  },
  {
    id: "eating-disorders-round-table-2025",
    title: "Круглый стол по ожирению и РПП",
    description: "Сертификат участника круглого стола",
    image: "/certificates/rpp/rpp-round-table-2025.jpg",
  },
  {
    id: "eating-disorders-arpps-membership",
    title: "Свидетельство АРППС",
    description: "Свидетельство о членстве в профильной ассоциации",
    image: "/certificates/rpp/arpps-membership.jpg",
  },
  {
    id: "eating-disorders-certificate",
    title: "Расстройства пищевого поведения",
    description: "Сертификат о прохождении курса",
    image: "/certificates/rpp/rpp-certificate.jpg",
  },
  {
    id: "eating-disorders-luneva",
    title: "Сертификат Луневой Александры Александровны",
    description: "Сертификат участника образовательной программы",
    image: "/certificates/rpp/luneva-rpp.jpg",
  },
];

const qualificationCertificateCards: QualificationCertificateCard[] = [
  {
    id: "psychology-degree",
    title: "Дипломированный психолог",
    modalTitle: "Бакалавр психологии",
    actionLabel: "Посмотреть диплом",
    certificates: [
      {
        id: "psychology-degree-bachelor",
        title: "Бакалавр психологии",
        description: "Документ о психологическом образовании",
        image: "/certificates/psychology/bachelor-psychology.jpg",
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
    certificates: [
      {
        id: "trauma-ptsd-specialist",
        title: "Специалист по работе с травмой, утратой и ПТСР",
        description: "Сертификат о повышении квалификации",
        image: "/certificates/trauma/ptsd.jpg",
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
