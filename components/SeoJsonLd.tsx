import { getSeoPage } from "@/src/lib/seo";

export default async function SeoJsonLd({ path }: { path: string }) {
  const page = await getSeoPage(path);

  if (!page?.structuredData) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: page.structuredData }}
    />
  );
}
