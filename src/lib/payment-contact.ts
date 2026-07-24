export type PaymentCustomerContact = {
  email?: string;
  phone?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePaymentCustomerContact(
  value: string
): PaymentCustomerContact | null {
  const contact = value.trim();

  if (!contact) return null;

  const emailMatch = contact.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  const email = emailMatch?.[0]?.toLowerCase();

  if (email && emailPattern.test(email)) {
    return { email };
  }

  const digits = contact.replace(/\D/g, "");

  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return { phone: digits.startsWith("8") ? `7${digits.slice(1)}` : digits };
  }

  if (digits.length === 10) {
    return { phone: `7${digits}` };
  }

  return null;
}

export function hasPaymentCustomerContact(value: string) {
  return Boolean(normalizePaymentCustomerContact(value));
}
