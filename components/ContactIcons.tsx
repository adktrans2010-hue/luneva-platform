import { SITE_CONTACTS } from "@/src/lib/site-contacts";

type ContactIconName = "max" | "telegram" | "whatsapp" | "email";

type ContactIconLink = {
  name: ContactIconName;
  label: string;
  href: string;
};

type ContactIconsProps = {
  variant?: "icons" | "list";
  className?: string;
  showLabels?: boolean;
};

const contactLinks: ContactIconLink[] = [
  {
    name: "max",
    label: "Max",
    href: SITE_CONTACTS.maxHref,
  },
  {
    name: "telegram",
    label: "Telegram",
    href: SITE_CONTACTS.telegramHref,
  },
  {
    name: "whatsapp",
    label: "WhatsApp",
    href: SITE_CONTACTS.whatsappHref,
  },
  {
    name: "email",
    label: "Email",
    href: `mailto:${SITE_CONTACTS.contactEmail}`,
  },
];

function MaxIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M6.6 16.9V7.1h4.3c2.1 0 3.4 1.1 3.4 2.8 0 1-.5 1.8-1.4 2.2 1.1.3 1.8 1.2 1.8 2.4 0 1.5-1.1 2.4-2.7 2.4H9.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M10 10h1.5c.6 0 1-.3 1-.8s-.4-.8-1-.8H10m0 5.1h2c.6 0 1 .3 1 .8s-.4.8-1 .8h-2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M5 19c-1.5-1.6-2.3-3.8-2.1-6.2C3.3 7.6 7.6 3.6 12.8 4c4.8.4 8.5 4.4 8.5 9.2 0 2.2-.8 4.2-2.1 5.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="m4.2 11.4 15-6.1c.8-.3 1.5.4 1.2 1.2l-4.1 12.4c-.2.7-1.1.9-1.6.4l-3.3-3.2-2 2c-.4.4-1.1.1-1.1-.5v-3.4l7.9-5.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="m8.3 14.2-4-1.3c-.8-.3-.9-1.2-.1-1.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M5.5 19.1 6.7 16A7.4 7.4 0 1 1 9 18.1l-3.5 1Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
      <path
        d="M9.7 8.8c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.5 1.2c.1.3 0 .5-.1.7l-.4.5c.6 1.1 1.4 1.9 2.5 2.5l.5-.4c.2-.2.5-.2.7-.1l1.3.6c.3.1.4.3.4.6v.5c0 .3-.1.6-.4.7-.5.3-1.2.5-1.8.4-2.9-.5-5.3-2.9-5.8-5.8-.1-.5.1-1.2.4-1.7Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M4.5 6.5h15v11h-15z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
      <path
        d="m5 7 7 5.7L19 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function ContactGlyph({ name }: { name: ContactIconName }) {
  if (name === "max") return <MaxIcon />;
  if (name === "telegram") return <TelegramIcon />;
  if (name === "whatsapp") return <WhatsAppIcon />;
  return <EmailIcon />;
}

export default function ContactIcons({
  variant = "icons",
  className = "",
  showLabels = false,
}: ContactIconsProps) {
  if (variant === "list") {
    return (
      <ul className={`grid gap-3 ${className}`} aria-label="Способы связи">
        {contactLinks.map((link) => (
          <li key={`${link.name}-${link.href}`}>
            <a
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              aria-label={link.label}
              className="group inline-flex min-h-11 items-center gap-3 rounded-full pr-4 text-[#332725] transition hover:text-[#8d443e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c98778]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#d9aa99] text-white shadow-[0_10px_28px_rgba(141,68,62,0.18)] transition group-hover:scale-105 group-hover:bg-[#c98778]">
                <ContactGlyph name={link.name} />
              </span>
              <span>{link.label}</span>
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`} role="group" aria-label="Способы связи">
      {contactLinks.map((link) => (
        <a
          key={`${link.name}-${link.href}`}
          href={link.href}
          target={link.href.startsWith("http") ? "_blank" : undefined}
          rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
          aria-label={link.label}
          title={link.label}
          className="group inline-flex min-h-11 items-center gap-2 rounded-full text-[#332725] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c98778]"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#d9aa99] text-white shadow-[0_10px_28px_rgba(141,68,62,0.18)] transition duration-200 group-hover:scale-105 group-hover:bg-[#c98778]">
            <ContactGlyph name={link.name} />
          </span>
          {showLabels && <span className="pr-2 text-sm">{link.label}</span>}
        </a>
      ))}
    </div>
  );
}
