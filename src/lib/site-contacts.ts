export const SITE_CONTACTS = {
  email: "info@luneva-psy.ru",
  publicEmail: "info@luneva-psy.ru",
  phone: "+7 (926) 036-06-93",
  phoneHref: "https://wa.me/79260360693",
  whatsapp: "+7 (926) 036-06-93",
  whatsappHref: "https://wa.me/79260360693",
  domain: "https://luneva-psy.ru",
} as const;

export function getOwnerNotificationEmail() {
  return (
    process.env.ADMIN_EMAIL?.trim() ||
    process.env.NOTIFICATION_EMAIL?.trim() ||
    process.env.SMTP_TO?.trim() ||
    SITE_CONTACTS.email
  );
}
