import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  mapYooKassaPaymentStatus,
  parseYooKassaAmountKopeks,
} from "@/src/lib/yookassa";
import {
  assertProductCanBePurchased,
  calculateSavingsKopeks,
  createProductSnapshot,
  deriveRemainingSessions,
  getProductPaymentAmountKopeks,
} from "@/src/lib/consultation-products";
import {
  assertRefundAmountIsValid,
  calculateRefundableAmount,
  deriveRefundedPaymentStatus,
} from "@/src/lib/yookassa-refunds";
import { normalizePaymentCustomerContact } from "@/src/lib/payment-contact";
import { navigationItems } from "@/src/lib/navigation";
import { socialLinks } from "@/src/lib/social-links";
import { getQualificationCertificateCards } from "@/src/lib/qualification-certificates";

assert.equal(
  mapYooKassaPaymentStatus({ status: "succeeded", paid: true }),
  "paid"
);
assert.equal(
  mapYooKassaPaymentStatus({ status: "canceled", paid: false }),
  "cancelled"
);
assert.equal(
  mapYooKassaPaymentStatus({ status: "pending", paid: false }),
  "invoice_sent"
);
assert.equal(
  mapYooKassaPaymentStatus({ status: "waiting_for_capture", paid: false }),
  "waiting_for_capture"
);
assert.equal(parseYooKassaAmountKopeks("7000.00"), 700000);
assert.equal(parseYooKassaAmountKopeks("0"), null);
assert.equal(parseYooKassaAmountKopeks(undefined), null);
assert.deepEqual(normalizePaymentCustomerContact("client@example.com"), {
  email: "client@example.com",
});
assert.deepEqual(normalizePaymentCustomerContact("+7 (926) 036-06-93"), {
  phone: "79260360693",
});
assert.equal(normalizePaymentCustomerContact("@telegram"), null);

const singleSessionProduct = {
  id: "product-single",
  code: "single-session",
  name: "Очно или онлайн",
  sessionsCount: 1,
  priceKopeks: 700000,
  currency: "RUB",
  durationMinutes: 50,
  receiptDescription: "Индивидуальная консультация психолога, 50 минут",
  paymentSubject: "service",
  paymentMode: "full_prepayment",
  vatCode: 1,
  isActive: true,
  isPublic: true,
  archivedAt: null,
};
const package7Product = {
  ...singleSessionProduct,
  id: "product-package-7",
  code: "package-7",
  name: "Пакет 7 сессий",
  sessionsCount: 7,
  priceKopeks: 4200000,
};
const package10Product = {
  ...singleSessionProduct,
  id: "product-package-10-test",
  code: "package-10-test",
  name: "Тестовый пакет 10 сессий",
  sessionsCount: 10,
  priceKopeks: 5500000,
  isPublic: false,
};

assert.equal(getProductPaymentAmountKopeks(singleSessionProduct), 700000);
assert.equal(getProductPaymentAmountKopeks(package7Product), 4200000);
assert.equal(getProductPaymentAmountKopeks(package10Product), 5500000);
assert.doesNotThrow(() => assertProductCanBePurchased(singleSessionProduct));
assert.throws(() =>
  assertProductCanBePurchased({ ...singleSessionProduct, isActive: false })
);
assert.throws(() =>
  assertProductCanBePurchased({ ...singleSessionProduct, isPublic: false })
);
assert.throws(() =>
  assertProductCanBePurchased({ ...singleSessionProduct, archivedAt: new Date() })
);
assert.equal(calculateSavingsKopeks(package7Product, 700000), 700000);
assert.equal(deriveRemainingSessions(7, 0), 7);
assert.equal(deriveRemainingSessions(7, 1), 6);
assert.equal(deriveRemainingSessions(7, 8), 0);

const snapshot = createProductSnapshot(package7Product);
assert.deepEqual(
  {
    productCodeSnapshot: snapshot.productCodeSnapshot,
    productNameSnapshot: snapshot.productNameSnapshot,
    sessionsCountSnapshot: snapshot.sessionsCountSnapshot,
    priceKopeksSnapshot: snapshot.priceKopeksSnapshot,
    currencySnapshot: snapshot.currencySnapshot,
    durationMinutesSnapshot: snapshot.durationMinutesSnapshot,
    paymentSubjectSnapshot: snapshot.paymentSubjectSnapshot,
    paymentModeSnapshot: snapshot.paymentModeSnapshot,
    vatCodeSnapshot: snapshot.vatCodeSnapshot,
  },
  {
    productCodeSnapshot: "package-7",
    productNameSnapshot: "Пакет 7 сессий",
    sessionsCountSnapshot: 7,
    priceKopeksSnapshot: 4200000,
    currencySnapshot: "RUB",
    durationMinutesSnapshot: 50,
    paymentSubjectSnapshot: "service",
    paymentModeSnapshot: "full_prepayment",
    vatCodeSnapshot: 1,
  }
);

assert.equal(
  calculateRefundableAmount({
    paidAmountKopeks: 700000,
    succeededRefundsKopeks: 0,
  }),
  700000
);
assert.equal(
  calculateRefundableAmount({
    paidAmountKopeks: 700000,
    succeededRefundsKopeks: 100000,
    activeRefundsKopeks: 200000,
  }),
  400000
);
assert.equal(
  deriveRefundedPaymentStatus({
    paidAmountKopeks: 700000,
    refundedAmountKopeks: 100000,
  }),
  "partially_refunded"
);
assert.equal(
  deriveRefundedPaymentStatus({
    paidAmountKopeks: 700000,
    refundedAmountKopeks: 700000,
  }),
  "refunded"
);
assert.doesNotThrow(() =>
  assertRefundAmountIsValid({
    amountKopeks: 100000,
    refundableAmountKopeks: 700000,
  })
);
assert.throws(() =>
  assertRefundAmountIsValid({
    amountKopeks: 0,
    refundableAmountKopeks: 700000,
  })
);
assert.throws(() =>
  assertRefundAmountIsValid({
    amountKopeks: -1,
    refundableAmountKopeks: 700000,
  })
);
assert.throws(() =>
  assertRefundAmountIsValid({
    amountKopeks: 800000,
    refundableAmountKopeks: 700000,
  })
);

const sourceFiles = [
  "src/lib/yookassa.ts",
  "src/lib/appointment-payments.ts",
  "app/api/yookassa/webhook/route.ts",
  "src/lib/yookassa-refunds.ts",
  "app/api/admin/payments/[id]/refund/route.ts",
  "components/AppointmentForm.tsx",
  "components/AccountBookingForm.tsx",
];

for (const file of sourceFiles) {
  const content = readFileSync(join(process.cwd(), file), "utf8");
  assert.equal(
    content.includes("NEXT_PUBLIC_YOOKASSA"),
    false,
    `${file} must not expose YooKassa variables to the browser`
  );
}

const refundRoute = readFileSync(
  join(process.cwd(), "app/api/admin/payments/[id]/refund/route.ts"),
  "utf8"
);
assert.equal(
  refundRoute.includes("confirmText") && refundRoute.includes("ВОЗВРАТ"),
  true,
  "full refund must require explicit admin confirmation"
);

const refundService = readFileSync(
  join(process.cwd(), "src/lib/yookassa-refunds.ts"),
  "utf8"
);
assert.equal(
  refundService.includes("createYooKassaRefund"),
  true,
  "refunds must be executed through YooKassa API"
);
assert.equal(
  refundService.includes("pg_advisory_xact_lock"),
  true,
  "refunds must serialize concurrent attempts per payment"
);
assert.equal(
  refundService.includes("totals.succeededRefundsKopeks + localRefund.amountKopeks"),
  false,
  "refund.succeeded sync must not double-count the current refund"
);

const paymentService = readFileSync(
  join(process.cwd(), "src/lib/appointment-payments.ts"),
  "utf8"
);
assert.equal(
  paymentService.includes("getYooKassaAmountKopeks"),
  false,
  "appointment payments must not use a global YooKassa amount"
);
assert.equal(
  paymentService.includes("productCodeSnapshot"),
  true,
  "appointment payments must store product snapshots"
);

const yookassaService = readFileSync(join(process.cwd(), "src/lib/yookassa.ts"), "utf8");
assert.equal(
  yookassaService.includes("YOOKASSA_PAYMENT_AMOUNT_RUB"),
  false,
  "YooKassa service must not keep a global payment amount"
);
assert.equal(
  yookassaService.includes("productCode") &&
    yookassaService.includes("sessionsCount") &&
    yookassaService.includes("preferredFormat"),
  true,
  "YooKassa metadata must include product and preferred format"
);

const contactsNav = navigationItems.find((item) => item.label === "Контакты");
const blogNav = navigationItems.find((item) => item.label === "Статьи");
assert.equal(contactsNav?.href, "/contacts", "Контакты must link to /contacts");
assert.equal(blogNav?.href, "/blog", "Статьи must link to /blog");

assert.equal(socialLinks.length, 7, "socialLinks must contain seven items");
assert.deepEqual(
  socialLinks.map((link) => link.id),
  ["max", "telegram", "vk", "youtube", "tiktok", "threads", "instagram"],
  "socialLinks order must stay stable"
);
assert.deepEqual(
  socialLinks.filter((link) => link.restricted).map((link) => link.id),
  ["threads", "instagram"],
  "only Threads and Instagram must have restricted flag"
);

const qualificationCards = getQualificationCertificateCards();
const rppCard = qualificationCards.find((card) => card.id === "eating-disorders");
assert.equal(rppCard?.certificates.length, 8, "RPP card must contain eight documents");
assert.equal(
  qualificationCards.some((card) => "externalUrl" in card),
  false,
  "qualification cards must always open local certificate images",
);
assert.equal(
  qualificationCards.every((card) =>
    card.certificates.every((certificate) => certificate.image.startsWith("/certificates/")),
  ),
  true,
  "all qualification documents must use local certificate assets",
);
assert.equal(
  qualificationCards.find((card) => card.id === "gestalt-therapist")?.certificates[0]?.image,
  "/certificates/gestalt/gestalt-therapist.jpg",
  "Gestalt card must use the local certificate image"
);
assert.equal(
  qualificationCards.find((card) => card.id === "teacher-author")?.certificates[0]?.image,
  "/certificates/teaching/teacher-author.jpg",
  "Teacher card must use the local certificate image"
);
assert.equal(
  qualificationCards.find((card) => card.id === "psychology-degree")?.certificates[0]?.image,
  "/certificates/psychology/bachelor-psychology.jpg",
  "Psychology card must use the local bachelor diploma",
);
assert.equal(
  qualificationCards.find((card) => card.id === "trauma-ptsd")?.certificates[0]?.image,
  "/certificates/trauma/ptsd.jpg",
  "Trauma card must use the local PTSD certificate",
);
assert.deepEqual(
  rppCard?.certificates.map((certificate) => certificate.image),
  [
    "/certificates/rpp/rpp-gestalt.jpg",
    "/certificates/rpp/rpp-children-adolescents.jpg",
    "/certificates/rpp/rpp-group-therapy.jpg",
    "/certificates/rpp/rpp-diagnostics-treatment.jpg",
    "/certificates/rpp/rpp-round-table-2025.jpg",
    "/certificates/rpp/arpps-membership.jpg",
    "/certificates/rpp/rpp-certificate.jpg",
    "/certificates/rpp/luneva-rpp.jpg",
  ],
  "RPP gallery must use the eight local images in the approved order",
);

const heroSource = readFileSync(join(process.cwd(), "components/Hero.tsx"), "utf8");
assert.equal(
  heroSource.includes('aria-hidden="true"') && heroSource.includes("path"),
  true,
  "Hero decorative branch must stay aria-hidden SVG"
);
assert.equal(
  heroSource.includes('href="/contacts#booking"'),
  true,
  "Hero booking CTA must lead to #booking"
);

const contactsSource = readFileSync(join(process.cwd(), "app/contacts/page.tsx"), "utf8");
assert.equal(
  contactsSource.includes('id="booking"') && contactsSource.includes("scroll-mt-28"),
  true,
  "booking block must have stable anchor and scroll margin"
);
assert.equal(
  contactsSource.includes("Быстрая связь"),
  false,
  "contacts social block must not contain old title"
);

const qualificationCardSource = readFileSync(
  join(process.cwd(), "components/QualificationCertificateCards.tsx"),
  "utf8"
);
assert.equal(
  qualificationCardSource.includes("min-w-0") &&
    qualificationCardSource.includes("[overflow-wrap:normal]") &&
    !qualificationCardSource.includes("[overflow-wrap:anywhere]"),
  true,
  "qualification card text must wrap without splitting words"
);
assert.equal(
  qualificationCardSource.includes("externalUrl") ||
    qualificationCardSource.includes("target=\"_blank\""),
  false,
  "qualification cards must use the local lightbox instead of external navigation",
);

const pricingSource = readFileSync(join(process.cwd(), "components/Pricing.tsx"), "utf8");
assert.equal(
  pricingSource.includes("item.durationMinutes") &&
    !pricingSource.includes("item.shortDescription ||"),
  true,
  "homepage duration must come from the product duration field",
);

const accountSource = readFileSync(join(process.cwd(), "app/account/page.tsx"), "utf8");
assert.equal(
  accountSource.includes("nearestDurationMinutes") &&
    !accountSource.includes("· 50 минут"),
  true,
  "account appointment duration must come from consultation product data",
);

const certificateLightboxSource = readFileSync(
  join(process.cwd(), "components/CertificateLightbox.tsx"),
  "utf8"
);
assert.equal(
  certificateLightboxSource.includes('event.key === "Escape"'),
  true,
  "certificate modal must close on Escape"
);
assert.equal(
  !certificateLightboxSource.includes("externalUrl"),
  true,
  "certificate modal must not link visitors to external document storage"
);

const symptomsCarouselSource = readFileSync(
  join(process.cwd(), "components/SymptomsCarousel.tsx"),
  "utf8"
);
assert.equal(
  symptomsCarouselSource.includes("[overflow-wrap:normal]") &&
    !symptomsCarouselSource.includes("[overflow-wrap:anywhere]") &&
    !symptomsCarouselSource.includes("line-clamp"),
  true,
  "help cards must wrap text naturally without clipping it"
);

console.info("YooKassa invariant tests passed");
