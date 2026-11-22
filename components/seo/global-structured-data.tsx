"use client";

import { usePathname } from "next/navigation";
import JsonLd from "@/components/seo/json-ld";
import { createGlobalSchema } from "@/src/lib/schema-org";

export default function GlobalStructuredData() {
  const pathname = usePathname();
  return <JsonLd data={createGlobalSchema(pathname === "/rpp")} />;
}
