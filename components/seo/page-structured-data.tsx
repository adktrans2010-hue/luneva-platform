import JsonLd from "@/components/seo/json-ld";
import {
  createPageSchema,
  type BreadcrumbItem,
} from "@/src/lib/schema-org";

export default function PageStructuredData({
  path,
  title,
  description,
  breadcrumbs,
}: {
  path: string;
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
}) {
  return (
    <JsonLd
      data={createPageSchema({ path, title, description, breadcrumbs })}
    />
  );
}
