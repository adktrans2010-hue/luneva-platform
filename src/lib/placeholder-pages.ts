export type PlaceholderPage = {
  title: string;
  eyebrow: string;
  parent: { label: string; href: string };
};

export const placeholderPages: Record<string, PlaceholderPage> = {
  "/help/anxiety": { title: "Тревога и панические состояния", eyebrow: "Помощь", parent: { label: "Все направления помощи", href: "/help" } },
  "/help/trauma-ptsd": { title: "Травма и ПТСР", eyebrow: "Помощь", parent: { label: "Все направления помощи", href: "/help" } },
  "/help/eating-disorders": { title: "Расстройства пищевого поведения", eyebrow: "Помощь", parent: { label: "Энциклопедия РПП", href: "/rpp" } },
  "/help/relationships": { title: "Отношения и семья", eyebrow: "Помощь", parent: { label: "Все направления помощи", href: "/help" } },
  "/help/self-esteem": { title: "Самооценка и потеря опоры", eyebrow: "Помощь", parent: { label: "Все направления помощи", href: "/help" } },
  "/help/grief-crisis": { title: "Утрата и жизненные кризисы", eyebrow: "Помощь", parent: { label: "Все направления помощи", href: "/help" } },
  "/help/teenagers": { title: "Помощь подросткам", eyebrow: "Помощь", parent: { label: "Все направления помощи", href: "/help" } },
  "/help/gestalt": { title: "Гештальт-терапия", eyebrow: "О терапии", parent: { label: "Все направления помощи", href: "/help" } },
  "/help/faq": { title: "Частые вопросы о терапии", eyebrow: "О терапии", parent: { label: "Частые вопросы", href: "/faq" } },
};
