"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 400);

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Наверх"
      title="Наверх"
      className="fixed right-5 bottom-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[#d9b6ad] bg-[#fff8f6]/95 text-2xl text-[#8d443e] shadow-[0_12px_35px_rgba(51,39,37,0.18)] backdrop-blur transition hover:-translate-y-1 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c98778] md:right-8 md:bottom-8"
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}
