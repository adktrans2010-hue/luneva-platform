import type { ComponentType, SVGProps } from "react";

export type SocialLink = {
  id: "max" | "telegram" | "vk" | "youtube" | "tiktok" | "threads" | "instagram";
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  restricted?: boolean;
};

function SvgBase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

function MaxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <SvgBase {...props}>
      <path d="M7 17V7h4.4c2 0 3.2 1 3.2 2.6 0 1-.5 1.8-1.5 2.2 1.2.3 1.9 1.2 1.9 2.5 0 1.7-1.3 2.7-3.5 2.7H10" strokeWidth="2" />
      <path d="M10 10h1.4c.7 0 1.1-.3 1.1-.8s-.4-.8-1.1-.8H10m0 5h1.8c.7 0 1.1.3 1.1.9 0 .5-.4.8-1.1.8H10" strokeWidth="2" />
      <path d="M4.8 19A9 9 0 1 1 19.2 19" strokeWidth="1.6" />
    </SvgBase>
  );
}

function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <SvgBase {...props}>
      <path d="m4.2 11.4 15-6.1c.8-.3 1.5.4 1.2 1.2l-4.1 12.4c-.2.7-1.1.9-1.6.4l-3.3-3.2-2 2c-.4.4-1.1.1-1.1-.5v-3.4l7.9-5.7" strokeWidth="2" />
      <path d="m8.3 14.2-4-1.3c-.8-.3-.9-1.2-.1-1.5" strokeWidth="2" />
    </SvgBase>
  );
}

function VkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <SvgBase {...props}>
      <path d="M4 8.2c.2 5.3 2.8 8 7.8 8h.3v-3c1.9.2 3.3 1.5 3.9 3h3.2a7.6 7.6 0 0 0-3.8-4.8A7 7 0 0 0 18.8 8h-2.9c-.6 1.8-2.1 3.3-3.8 3.5V8H9.2v6.1c-1.8-.4-3.2-2.6-3.3-6H4Z" strokeWidth="1.8" />
    </SvgBase>
  );
}

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <SvgBase {...props}>
      <rect x="3.5" y="6.5" width="17" height="11" rx="3" strokeWidth="1.8" />
      <path d="m10.5 9.5 4.5 2.5-4.5 2.5v-5Z" strokeWidth="1.8" />
    </SvgBase>
  );
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <SvgBase {...props}>
      <path d="M14 4v10.4a4 4 0 1 1-3.8-4" strokeWidth="2" />
      <path d="M14 4c.6 2.8 2.2 4.4 5 4.8" strokeWidth="2" />
    </SvgBase>
  );
}

function ThreadsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <SvgBase {...props}>
      <path d="M17.7 9.1c-.8-3.1-3-4.8-6.1-4.8-4.2 0-7.1 3.1-7.1 7.7s2.9 7.7 7.2 7.7c3.5 0 6.2-2.1 6.2-5 0-2.6-2-4-5.5-4.1-2.3-.1-3.7 1-3.7 2.7 0 1.5 1.2 2.5 3 2.5 2.3 0 3.8-1.7 3.8-4.3" strokeWidth="1.8" />
    </SvgBase>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <SvgBase {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4.5" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.2" strokeWidth="1.8" />
      <path d="M16.9 7.2h.1" strokeWidth="2.6" />
    </SvgBase>
  );
}

export const socialLinks: SocialLink[] = [
  {
    id: "max",
    label: "MAX",
    href: "https://max.ru/join/f7dCzkGb4bRwAjVhhtjfP7qfQwmJa-cwCcHzqkQmD1A",
    icon: MaxIcon,
  },
  {
    id: "telegram",
    label: "Telegram",
    href: "https://t.me/aleksandrapsy",
    icon: TelegramIcon,
  },
  {
    id: "vk",
    label: "ВКонтакте",
    href: "https://vk.ru/club188501100",
    icon: VkIcon,
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://youtube.com/@lunevapsy?si=YTIakRJyaWEh2Mm4",
    icon: YouTubeIcon,
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@lunevapsy?_r=1&_t=ZN-98bDu840qEY",
    icon: TikTokIcon,
  },
  {
    id: "threads",
    label: "Threads",
    href: "https://www.threads.com/@lunevapsy?igshid=NTc4MTIwNjQ2YQ==",
    icon: ThreadsIcon,
    restricted: true,
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/lunevapsy?igsh=MTdvb2lwcHpsYnJpbQ%3D%3D&utm_source=qr",
    icon: InstagramIcon,
    restricted: true,
  },
];
