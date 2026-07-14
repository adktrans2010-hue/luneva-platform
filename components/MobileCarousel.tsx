"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type MobileCarouselProps = {
  children: ReactNode;
  className?: string;
  desktopGridClassName: string;
  label: string;
};

export default function MobileCarousel({
  children,
  className = "",
  desktopGridClassName,
  label,
}: MobileCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    setCanScrollLeft(track.scrollLeft > 4);
    setCanScrollRight(
      track.scrollLeft + track.clientWidth < track.scrollWidth - 4
    );
  }, []);

  useEffect(() => {
    updateControls();
    window.addEventListener("resize", updateControls);

    return () => window.removeEventListener("resize", updateControls);
  }, [updateControls]);

  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;

    track.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" });
  };

  return (
    <div className={className}>
      <div
        ref={trackRef}
        onScroll={updateControls}
        aria-label={label}
        className={`flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:min-w-full [&>*]:snap-center md:grid md:snap-none md:overflow-visible md:pb-0 md:[&>*]:min-w-0 ${desktopGridClassName}`}
      >
        {children}
      </div>

      <div className="mt-5 flex items-center justify-end gap-3 md:hidden">
        <span className="mr-1 text-sm text-[#8a7a76]">Листайте</span>
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={!canScrollLeft}
          aria-label="Предыдущая карточка"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d9b6ad] bg-white text-xl text-[#8d443e] shadow-sm disabled:cursor-default disabled:opacity-35"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={!canScrollRight}
          aria-label="Следующая карточка"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d9b6ad] bg-white text-xl text-[#8d443e] shadow-sm disabled:cursor-default disabled:opacity-35"
        >
          →
        </button>
      </div>
    </div>
  );
}
