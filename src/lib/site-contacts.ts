export const SITE_CONTACTS = {
  ownerFullName: "Лунева Александра Александровна",
  ownerStatus: "Самозанятая",
  ownerTaxStatus: "Плательщик налога на профессиональный доход",
  inn: "772990147598",
  email: "info@luneva-psy.ru",
  publicEmail: "info@luneva-psy.ru",
  contactEmail: "luneva.shura@yandex.ru",
  phone: "+7 (926) 036-06-93",
  phoneTelHref: "tel:+79260360693",
  phoneHref: "https://wa.me/79260360693",
  whatsapp: "+7 (926) 036-06-93",
  whatsappHref: "https://wa.me/79260360693",
  telegramHref: "https://t.me/+79260360693",
  maxHref: "https://max.ru/u/79260360693",
  domain: "https://luneva-psy.ru",
  domainLabel: "luneva-psy.ru",
} as const;

export function getOwnerNotificationEmail() {
  return (
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.NOTIFICATION_EMAIL?.trim() ||
    process.env.SMTP_TO?.trim() ||
    SITE_CONTACTS.email
  );
}
