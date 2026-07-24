"use client";

import Script from "next/script";

export default function YandexMetrika() {
  const counterId = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

  if (process.env.NODE_ENV !== "production" || !counterId) {
    return null;
  }

  const numericCounterId = Number(counterId);

  if (!Number.isInteger(numericCounterId) || numericCounterId <= 0) {
    return null;
  }

  return (
    <Script
      id="yandex-metrika"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {
                if (document.scripts[j].src === r) { return; }
              }
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],
              k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
            ym(${numericCounterId}, "init", {
              clickmap: true,
              trackLinks: true,
              accurateTrackBounce: true,
              webvisor: false
            });
          `,
      }}
    />
  );
}
