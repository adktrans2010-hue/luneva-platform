"use client";

import { socialLinks, type SocialLink } from "@/src/lib/social-links";
import { trackGoal, type AnalyticsGoal } from "@/src/lib/client-analytics";

const socialGoals: Record<SocialLink["id"], AnalyticsGoal> = {
  max: "max_click",
  telegram: "telegram_click",
  vk: "vk_click",
  youtube: "youtube_click",
  tiktok: "tiktok_click",
  threads: "threads_click",
  instagram: "instagram_click",
};

export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Социальные сети">
        {socialLinks.map((link) => {
          const Icon = link.icon;
          const label = `${link.label}${link.restricted ? "*" : ""}`;

          return (
            <li key={link.id} className="min-w-0">
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                onClick={() => trackGoal(socialGoals[link.id])}
                className="group flex min-h-11 min-w-0 items-center gap-3 rounded-2xl border border-[#ead7d1] bg-white/78 px-4 py-3 text-[#332725] transition hover:border-[#c98778] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#c98778]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f3e2dd] text-[#9c544c] transition group-hover:bg-[#ead3cc] group-hover:text-[#7f3f39]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 max-w-full whitespace-normal text-sm font-medium [word-break:normal] [overflow-wrap:normal] [hyphens:none]">
                  {label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      {socialLinks.some((link) => link.restricted) && (
        <p className="mt-5 text-sm leading-6 text-[#8a7a76]">
          *Признаны экстремистскими организациями и запрещены на территории РФ.
        </p>
      )}
    </div>
  );
}
