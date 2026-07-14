import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Luneva Psy — психолог Александра Лунева",
    short_name: "Luneva Psy",
    description:
      "Психологическая помощь взрослым и подросткам. Онлайн и очные консультации.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff8f6",
    theme_color: "#fff8f6",
    lang: "ru-RU",
    orientation: "portrait-primary",
    categories: ["health", "lifestyle", "education"],
    icons: [
      {
        src: "/icon.png",
        sizes: "510x510",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Записаться на консультацию",
        short_name: "Записаться",
        description: "Перейти к форме записи на консультацию",
        url: "/contacts#booking",
        icons: [{ src: "/icon.png", sizes: "510x510", type: "image/png" }],
      },
      {
        name: "Статьи о психологии",
        short_name: "Блог",
        description: "Открыть статьи Александры Луневой",
        url: "/blog",
        icons: [{ src: "/icon.png", sizes: "510x510", type: "image/png" }],
      },
    ],
    prefer_related_applications: false,
  };
}
