import Link from "next/link";

export type Breadcrumb = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  return (
    <nav aria-label="Хлебные крошки" className="mb-8 overflow-x-auto">
      <ol className="flex min-w-max items-center gap-2 text-sm text-[#8a7a76]">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="text-[#c9aaa2]">/</span>}
              {item.href && !current ? (
                <Link href={item.href} className="rounded-sm hover:text-[#8d443e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c98778]">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={current ? "page" : undefined} className={current ? "text-[#5f5552]" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
