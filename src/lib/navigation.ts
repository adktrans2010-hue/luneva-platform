import { isPubliclyListed } from "@/src/lib/publication-status";

export type NavigationLink = {
  label: string;
  href: string;
};

export function matchesBlogCategory(value: string, aliases: readonly string[]) {
  const normalized = value.trim().toLocaleLowerCase("ru-RU");
  return aliases.some((alias) => normalized === alias);
}

export type NavigationGroup = {
  title: string;
  links: NavigationLink[];
  collapsibleOnMobile?: boolean;
};

export type NavigationItem = NavigationLink & {
  groups?: NavigationGroup[];
  menuCta?: NavigationLink;
  menuColumns?: 1 | 2 | 3;
  account?: boolean;
};

export const blogCategoryLinks = [
  { label: "Психотерапия", href: "/blog/category/psychotherapy", slug: "psychotherapy", aliases: ["психотерапия", "терапия"] },
  { label: "Тревога", href: "/blog/category/anxiety", slug: "anxiety", aliases: ["тревога", "панические атаки"] },
  { label: "Травма и ПТСР", href: "/blog/category/trauma-ptsd", slug: "trauma-ptsd", aliases: ["травма и птср", "птср", "травма"] },
  { label: "Отношения", href: "/blog/category/relationships", slug: "relationships", aliases: ["отношения", "семья"] },
  { label: "Подростки", href: "/blog/category/teenagers", slug: "teenagers", aliases: ["подростки", "подростковая психология"] },
  { label: "Самооценка", href: "/blog/category/self-esteem", slug: "self-esteem", aliases: ["самооценка", "самоценность"] },
  { label: "Кризисы и самопомощь", href: "/blog/category/crisis-self-help", slug: "crisis-self-help", aliases: ["кризисы и самопомощь", "кризисы", "самопомощь"] },
] as const;

const allNavigationItems: NavigationItem[] = [
  { label: "Главная", href: "/" },
  {
    label: "Обо мне",
    href: "/about",
    menuColumns: 1,
    groups: [
      {
        title: "Обо мне",
        links: [
          { label: "Об Александре", href: "/about" },
          { label: "Образование и сертификаты", href: "/about/education" },
        ],
      },
    ],
    menuCta: { label: "Перейти в раздел «Обо мне»", href: "/about" },
  },
  {
    label: "Помощь",
    href: "/help",
    menuColumns: 2,
    groups: [
      {
        title: "С чем можно обратиться",
        links: [
          { label: "Тревога и панические состояния", href: "/help/anxiety" },
          { label: "Травма и ПТСР", href: "/help/trauma-ptsd" },
          { label: "Расстройства пищевого поведения", href: "/help/eating-disorders" },
          { label: "Отношения и семья", href: "/help/relationships" },
          { label: "Самооценка и потеря опоры", href: "/help/self-esteem" },
          { label: "Утрата и жизненные кризисы", href: "/help/grief-crisis" },
          { label: "Помощь подросткам", href: "/help/teenagers" },
        ],
      },
      {
        title: "О терапии",
        links: [
          { label: "Гештальт-терапия", href: "/help/gestalt" },
          { label: "Частые вопросы", href: "/help/faq" },
        ],
      },
    ],
    menuCta: { label: "Все направления помощи", href: "/help" },
  },
  {
    label: "Энциклопедия РПП",
    href: "/rpp",
    menuColumns: 3,
    groups: [
      {
        title: "Основы РПП",
        links: [
          { label: "Что такое РПП", href: "/rpp/chto-takoe-rpp" },
          { label: "Симптомы и признаки", href: "/rpp/priznaki" },
          { label: "Причины и факторы риска", href: "/rpp/prichiny" },
          { label: "РПП у подростков", href: "/rpp/podrostki" },
          { label: "Отношения с телом", href: "/rpp/telo" },
          { label: "Переедание и эмоциональное питание", href: "/rpp/pereedanie" },
          { label: "Диеты и контроль веса", href: "/rpp/diety" },
        ],
      },
      {
        title: "Виды РПП",
        collapsibleOnMobile: true,
        links: [
          { label: "Виды РПП", href: "/rpp/vidy" },
          { label: "Нервная анорексия", href: "/rpp/anoreksiya" },
          { label: "Нервная булимия", href: "/rpp/bulimiya" },
          { label: "Компульсивное переедание", href: "/rpp/kompulsivnoe-pereedanie" },
          { label: "ARFID", href: "/rpp/arfid" },
          { label: "Другие формы РПП", href: "/rpp/drugie-formy" },
        ],
      },
      {
        title: "Лечение и поддержка",
        links: [
          { label: "Лечение и восстановление", href: "/rpp/lechenie" },
          { label: "Помощь близкому человеку", href: "/rpp/blizkim" },
          { label: "Самопомощь и безопасность", href: "/rpp/samopomosh" },
          { label: "Правило трех Марши Херрин", href: "/rpp/pravilo-treh-marshi-herrin" },
          { label: "Словарь терминов", href: "/rpp/slovar" },
          { label: "Вопросы и ответы", href: "/rpp/faq" },
        ],
      },
    ],
    menuCta: { label: "Перейти в Энциклопедию РПП", href: "/rpp" },
  },
  {
    label: "Статьи",
    href: "/blog",
    menuColumns: 2,
    groups: [
      {
        title: "Темы",
        links: blogCategoryLinks.slice(0, 4),
      },
      {
        title: "Поддержка",
        links: blogCategoryLinks.slice(4),
      },
    ],
    menuCta: { label: "Все статьи", href: "/blog" },
  },
  { label: "Отзывы", href: "/reviews" },
  { label: "Контакты", href: "/contacts" },
  { label: "Личный кабинет", href: "/account", account: true },
];

function filterPublicNavigation(items: NavigationItem[]) {
  return items.map((item) => {
    const groups = item.groups
      ?.map((group) => ({
        ...group,
        links: group.links.filter((link) => isPubliclyListed(link.href)),
      }))
      .filter((group) => group.links.length > 0);

    return {
      ...item,
      groups: groups && groups.length > 0 ? groups : undefined,
      menuCta: groups && groups.length > 0 ? item.menuCta : undefined,
    };
  });
}

export const navigationItems: NavigationItem[] = filterPublicNavigation(allNavigationItems);

export const footerNavigation: NavigationLink[] = [
  { label: "Главная", href: "/" },
  { label: "Обо мне", href: "/about" },
  { label: "Помощь", href: "/help" },
  { label: "Энциклопедия РПП", href: "/rpp" },
  { label: "Статьи", href: "/blog" },
  { label: "Отзывы", href: "/reviews" },
  { label: "Контакты", href: "/contacts" },
  { label: "Частые вопросы", href: "/faq" },
  { label: "Личный кабинет", href: "/account" },
];

export function isNavigationItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
