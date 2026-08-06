"use client";

import type {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  SVGProps,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { helpTopics, type HelpTopicIcon } from "@/src/lib/help-topics";
import { trackGoal } from "@/src/lib/client-analytics";

function IconBase({
  children,
  ...props
}: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

function SymptomIconGraphic({ icon }: { icon: HelpTopicIcon }) {
  if (icon === "relationships") {
    return (
      <IconBase className="h-8 w-8">
        <circle cx="24" cy="14" r="5" />
        <circle cx="11.5" cy="20" r="4" />
        <circle cx="36.5" cy="20" r="4" />
        <path d="M15 39v-5.5c0-5.4 4-9.5 9-9.5s9 4.1 9 9.5V39" />
        <path d="M4.5 39v-5c0-4.1 3.1-7 7-7 2 0 3.8.8 5.1 2.1M43.5 39v-5c0-4.1-3.1-7-7-7-2 0-3.8.8-5.1 2.1" />
      </IconBase>
    );
  }

  if (icon === "food") {
    return (
      <IconBase className="h-8 w-8">
        <path d="M17 7v13M12 7v8c0 3 2.2 5 5 5s5-2 5-5V7M17 20v21" />
        <path d="M32 7c-4 5-5.5 11.2-4 17h8V7c0 13.5 0 24.8-1 34" />
        <path d="M8 41h32" />
      </IconBase>
    );
  }

  if (icon === "anxiety") {
    return (
      <IconBase className="h-8 w-8">
        <path d="M8 27h7l4-11 7 21 5-14 3 7h6" />
        <path d="M37.5 13.5A17 17 0 1 0 41 31" />
        <path d="M31 8.5a17 17 0 0 1 6.5 5" />
      </IconBase>
    );
  }

  if (icon === "loss") {
    return (
      <IconBase className="h-8 w-8">
        <path d="M24 6v32" />
        <path d="m14 28 10 10 10-10" />
        <path d="M10 42h28" />
      </IconBase>
    );
  }

  if (icon === "selfEsteem") {
    return (
      <IconBase className="h-8 w-8">
        <circle cx="24" cy="15" r="7" />
        <path d="M11 40c1.5-9 6-14 13-14s11.5 5 13 14" />
        <path d="M8 42h32" />
      </IconBase>
    );
  }

  return (
    <IconBase className="h-8 w-8">
      <path d="M24 38c-1-8-1-17 0-27" />
      <path d="M24 18c-6-8-13-7-16-5 1 7 6 11 16 10" />
      <path d="M24 24c7-8 14-6 17-3-2 7-7 10-17 8" />
      <path d="M24 32c-5-5-10-3-13-1 2 5 6 7 13 6" />
      <path d="M24 12c3-5 7-6 10-5 0 5-3 8-10 10" />
    </IconBase>
  );
}

function DecorativeStar() {
  return (
    <svg
      viewBox="0 0 28 28"
      className="h-7 w-7 text-[#cf8f80]"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M14 1.8c.8 7.6 4.6 11.4 12.2 12.2C18.6 14.8 14.8 18.6 14 26.2 13.2 18.6 9.4 14.8 1.8 14 9.4 13.2 13.2 9.4 14 1.8Z" />
    </svg>
  );
}

function DecorativeBranch() {
  return (
    <svg
      viewBox="0 0 260 280"
      className="pointer-events-none absolute -right-5 -bottom-8 h-[58%] w-[76%] opacity-[0.38] md:-right-4 md:-bottom-7 md:h-[55%] md:w-[72%]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="symptom-branch-stem" x1="8" y1="274" x2="220" y2="8">
          <stop stopColor="#e6a79a" stopOpacity="0.72" />
          <stop offset="1" stopColor="#efc2b8" stopOpacity="0.52" />
        </linearGradient>
        <linearGradient id="symptom-branch-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e9aa9d" stopOpacity="0.58" />
          <stop offset="1" stopColor="#f3cec6" stopOpacity="0.34" />
        </linearGradient>
      </defs>

      <path
        d="M4 276C48 239 88 216 118 181c36-42 47-92 70-131 11-19 24-34 40-46"
        fill="none"
        stroke="url(#symptom-branch-stem)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <g
        fill="none"
        stroke="url(#symptom-branch-stem)"
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <path d="M57 235c18-9 35-11 54-9" />
        <path d="M91 208c-5-18-4-34 2-48" />
        <path d="M116 183c20-7 39-6 57 0" />
        <path d="M133 156c-7-19-6-36 1-52" />
        <path d="M151 121c18-12 36-16 55-13" />
        <path d="M167 83c-7-17-6-32 1-46" />
        <path d="M184 57c17-7 31-7 45-2" />
        <path d="M117 181c-15-7-26-17-34-29" />
        <path d="M148 126c-13-8-22-18-27-31" />
        <path d="M188 50c-9-9-14-19-14-31" />
      </g>

      <g fill="url(#symptom-branch-leaf)">
        <path d="M108 226c17-9 32-8 43 1-13 12-29 13-43-1Z" />
        <path d="M92 161c-14-10-18-25-11-40 16 8 21 24 11 40Z" />
        <path d="M94 160c15-11 28-11 39-2-10 14-25 15-39 2Z" />
        <path d="M83 152c-17-3-28-14-30-30 18 1 29 12 30 30Z" />
        <path d="M171 183c16-9 31-7 42 3-13 12-29 11-42-3Z" />
        <path d="M133 105c-14-11-17-27-9-42 16 9 20 25 9 42Z" />
        <path d="M136 104c15-11 29-11 40-1-11 14-26 15-40 1Z" />
        <path d="M121 95c-17-4-27-15-28-31 18 2 29 14 28 31Z" />
        <path d="M204 108c17-8 32-5 42 6-14 11-30 9-42-6Z" />
        <path d="M168 38c-12-11-14-25-6-39 14 10 17 25 6 39Z" />
        <path d="M185 54c14-12 28-13 40-4-9 15-24 17-40 4Z" />
        <path d="M174 19c-8-14-6-28 5-39 11 13 9 28-5 39Z" />
        <path d="M228 4c6-16 18-24 34-23-4 17-17 25-34 23Z" />
      </g>

      <g
        fill="none"
        stroke="#df9d90"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.28"
      >
        <path d="M111 226c14 0 25 0 36 1" />
        <path d="M84 124c2 13 5 24 8 34" />
        <path d="M56 124c10 11 18 19 26 26" />
        <path d="M176 184c12 1 23 2 34 2" />
        <path d="M127 66c2 14 4 25 6 36" />
        <path d="M96 67c9 10 17 19 24 27" />
        <path d="M208 110c12 1 23 2 34 4" />
        <path d="M165 2c1 12 2 23 3 33" />
        <path d="M189 53c11-1 22-2 32-3" />
      </g>
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {direction === "left" ? (
        <path d="m15 18-6-6 6-6M9 12h11" />
      ) : (
        <path d="m9 6 6 6-6 6M15 12H4" />
      )}
    </svg>
  );
}

export default function SymptomsCarousel({
  source = "home",
}: {
  source?: "home" | "help";
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const dragState = useRef({ active: false, startX: 0, startScrollLeft: 0 });
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track || window.matchMedia("(min-width: 768px)").matches) {
      setActiveIndex(0);
      return;
    }

    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - trackCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const handleScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActiveIndex);
    };

    updateActiveIndex();
    track.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      track.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [updateActiveIndex]);

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    const card = cardRefs.current[index];
    if (!track || !card) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    track.scrollTo({
      left: card.offsetLeft,
      behavior: reducedMotion ? "auto" : "smooth",
    });
    setActiveIndex(index);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    if (track.scrollWidth <= track.clientWidth + 1) return;

    dragState.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
    };
    track.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || !dragState.current.active) return;

    track.scrollLeft =
      dragState.current.startScrollLeft -
      (event.clientX - dragState.current.startX);
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || !dragState.current.active) return;

    dragState.current.active = false;
    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
    updateActiveIndex();
  };

  return (
    <div className="mt-14 overflow-hidden [contain:layout_paint] lg:mx-auto lg:max-w-6xl">
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        aria-label="Когда стоит обратиться"
        className="flex w-full min-w-0 cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pr-6 pb-3 select-none [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden md:grid md:cursor-auto md:grid-cols-2 md:gap-5 md:overflow-visible md:pr-0 md:pb-0 md:select-auto lg:grid-cols-3 lg:gap-6"
      >
        {helpTopics.map((topic, index) => (
          <Link
            href={topic.href}
            title={topic.title}
            aria-label={`${topic.title}. Подробнее`}
            key={topic.id}
            onClick={() =>
              trackGoal("help_topic_click", {
                source,
                topicId: topic.id,
                topicTitle: topic.title,
                href: topic.href,
              })
            }
            ref={(element) => {
              cardRefs.current[index] = element;
            }}
            className="group relative flex min-h-[520px] min-w-0 flex-[0_0_calc(100%-1.5rem)] snap-start flex-col overflow-clip rounded-[1.9rem] border border-[rgba(201,135,120,0.18)] bg-[rgba(255,255,255,0.78)] p-8 text-left no-underline shadow-[0_12px_35px_rgba(70,45,40,0.06)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c98778] md:min-h-[390px] md:min-w-0 md:p-7 lg:min-h-[405px] lg:p-8 lg:transition-[transform,box-shadow,border-color] lg:duration-300 lg:ease-out lg:hover:-translate-y-1 lg:hover:border-[rgba(201,135,120,0.3)] lg:hover:shadow-[0_22px_52px_rgba(70,45,40,0.11)] motion-reduce:scroll-auto motion-reduce:transition-none motion-reduce:lg:hover:translate-y-0 motion-reduce:lg:hover:border-[rgba(201,135,120,0.18)] motion-reduce:lg:hover:shadow-[0_12px_35px_rgba(70,45,40,0.06)]"
          >
            <div className="relative z-10 flex items-start justify-between gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-[#76564f] md:h-14 md:w-14">
                <span className="transition-transform duration-300 lg:group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:lg:group-hover:translate-y-0">
                  <SymptomIconGraphic icon={topic.icon} />
                </span>
              </div>
              <DecorativeStar />
            </div>

            <h3 className="relative z-10 mt-9 min-w-0 max-w-full whitespace-normal font-serif text-[2.05rem] leading-[1.12] text-[#332725] [word-break:normal] [overflow-wrap:normal] [hyphens:none] sm:text-[2.2rem] md:mt-7 md:text-[1.6rem] md:leading-[1.16] lg:text-[1.68rem]">
              {topic.title}
            </h3>

            <div className="relative z-10 mt-7 h-px w-16 bg-[#c98778] md:mt-5 md:w-14" />

            <div className="relative z-10 mt-auto pt-8 text-[#5f5552] md:pt-6">
              <p className="min-w-0 max-w-full whitespace-normal text-[1.0625rem] leading-[1.68] [word-break:normal] [overflow-wrap:normal] [hyphens:none] md:text-[0.9375rem] md:leading-[1.62] lg:text-[0.98rem]">
                {topic.description}
              </p>
              <p className="mt-4 min-w-0 max-w-full whitespace-normal text-[0.98rem] leading-[1.65] text-[#746865] [word-break:normal] [overflow-wrap:normal] [hyphens:none] md:mt-3 md:text-[0.9rem]">
                {topic.explanation}
              </p>
              <span className="mt-7 inline-flex items-center gap-2 text-[0.95rem] font-medium text-[#9c544c] transition-colors duration-300 group-hover:text-[#7f3f39] motion-reduce:transition-none">
                Подробнее
                <span
                  className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                  aria-hidden="true"
                >
                  →
                </span>
              </span>
            </div>

            <DecorativeBranch />
          </Link>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 md:hidden">
        <div className="flex min-w-0 items-center gap-4">
          <span className="text-sm text-[#8a7a76]">Листайте</span>
          <div
            className="flex items-center gap-1.5"
            aria-label={`Карточка ${activeIndex + 1} из ${helpTopics.length}`}
          >
            {helpTopics.map((topic, index) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => scrollToIndex(index)}
                aria-label={`Перейти к карточке ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
                className={`h-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c98778] ${
                  index === activeIndex
                    ? "w-6 bg-[#c98778]"
                    : "w-2 bg-[#dfc3bc]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Предыдущая карточка"
            className="flex h-13 w-13 items-center justify-center rounded-full border border-[#d9b6ad] bg-white text-[#8d443e] shadow-[0_8px_24px_rgba(70,45,40,0.07)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#c98778] disabled:cursor-default disabled:border-[#eadfdc] disabled:text-[#cbbab6] disabled:opacity-55"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === helpTopics.length - 1}
            aria-label="Следующая карточка"
            className="flex h-13 w-13 items-center justify-center rounded-full border border-[#d9b6ad] bg-white text-[#8d443e] shadow-[0_8px_24px_rgba(70,45,40,0.07)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#c98778] disabled:cursor-default disabled:border-[#eadfdc] disabled:text-[#cbbab6] disabled:opacity-55"
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>
    </div>
  );
}
