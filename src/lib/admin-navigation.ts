export type AdminNavigationRole = "admin" | "clinical_admin";

export type AdminNavigationIcon =
  | "overview"
  | "calendar"
  | "people"
  | "package"
  | "payment"
  | "chart"
  | "megaphone"
  | "funnel"
  | "document"
  | "video"
  | "review"
  | "help"
  | "page"
  | "certificate"
  | "search"
  | "brain"
  | "conversation"
  | "attention"
  | "pilot"
  | "services"
  | "settings"
  | "history";

export type AdminNavigationItem = {
  label: string;
  href: string;
  icon: AdminNavigationIcon;
  roles: readonly AdminNavigationRole[];
};

export type AdminNavigationGroup = {
  label?: string;
  items: readonly AdminNavigationItem[];
};

const standardRoles = ["admin", "clinical_admin"] as const;
const clinicalRoles = ["clinical_admin"] as const;

export const ADMIN_AUTH_PATHS = [
  "/admin/login",
  "/admin/password",
  "/admin/mfa-enroll",
] as const;

export const adminNavigation: readonly AdminNavigationGroup[] = [
  {
    items: [{ label: "Обзор", href: "/admin", icon: "overview", roles: standardRoles }],
  },
  {
    label: "Клиенты",
    items: [
      { label: "Записи и расписание", href: "/admin/appointments", icon: "calendar", roles: standardRoles },
      { label: "Клиенты", href: "/admin/clients", icon: "people", roles: standardRoles },
      { label: "Пакеты консультаций", href: "/admin/packages", icon: "package", roles: standardRoles },
      { label: "Платежи", href: "/admin/appointments#payments", icon: "payment", roles: standardRoles },
    ],
  },
  {
    label: "Аналитика",
    items: [
      { label: "Сайт", href: "/admin/site-life", icon: "chart", roles: standardRoles },
      { label: "Реклама", href: "/admin/site-life?tab=advertising", icon: "megaphone", roles: standardRoles },
      { label: "Воронка", href: "/admin/site-life?tab=funnel", icon: "funnel", roles: standardRoles },
    ],
  },
  {
    label: "Контент",
    items: [
      { label: "Статьи", href: "/admin/blog", icon: "document", roles: standardRoles },
      { label: "Видео", href: "/admin/videos", icon: "video", roles: standardRoles },
      { label: "Отзывы", href: "/admin/reviews", icon: "review", roles: standardRoles },
      { label: "FAQ", href: "/admin/faq", icon: "help", roles: standardRoles },
      { label: "Страницы сайта", href: "/admin/pages", icon: "page", roles: standardRoles },
      { label: "Сертификаты", href: "/admin/certificates", icon: "certificate", roles: standardRoles },
      { label: "SEO", href: "/admin/seo", icon: "search", roles: standardRoles },
    ],
  },
  {
    label: "AI",
    items: [
      { label: "База знаний", href: "/admin/ai/knowledge", icon: "brain", roles: standardRoles },
      { label: "Диалоги", href: "/admin/ai/conversations", icon: "conversation", roles: clinicalRoles },
      { label: "Обращения человеку", href: "/admin/ai/attention", icon: "attention", roles: clinicalRoles },
      { label: "Pilot / Usage", href: "/admin/ai/pilot", icon: "pilot", roles: clinicalRoles },
    ],
  },
  {
    label: "Управление",
    items: [
      { label: "Услуги и цены", href: "/admin/products", icon: "services", roles: standardRoles },
      { label: "Расписание", href: "/admin/appointments", icon: "calendar", roles: standardRoles },
    ],
  },
  {
    label: "Система",
    items: [
      { label: "Настройки", href: "/admin/settings", icon: "settings", roles: standardRoles },
      { label: "История входов", href: "/admin/login-history", icon: "history", roles: standardRoles },
    ],
  },
];

export function isAdminAuthPath(pathname: string) {
  return ADMIN_AUTH_PATHS.includes(pathname as (typeof ADMIN_AUTH_PATHS)[number]);
}

export function getVisibleAdminNavigation(role: AdminNavigationRole) {
  return adminNavigation
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(role)) }))
    .filter((group) => group.items.length > 0);
}

export function isAdminNavigationItemActive(item: AdminNavigationItem, pathname: string, search = "") {
  const target = new URL(item.href, "https://admin.local");
  if (item.href.includes("#")) return false;
  if (target.pathname === "/admin") return pathname === "/admin";
  if (pathname !== target.pathname && !pathname.startsWith(`${target.pathname}/`)) return false;
  return target.search ? target.search === search : search.length === 0;
}

export function getAdminPageTitle(pathname: string) {
  const matchingItem = adminNavigation
    .flatMap((group) => group.items)
    .filter((item) => isAdminNavigationItemActive(item, pathname))
    .sort((left, right) => right.href.length - left.href.length)[0];

  return matchingItem?.label ?? "Админ-панель";
}
