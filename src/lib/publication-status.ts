export type PublicationStatus = "published" | "draft" | "placeholder";

const pageStatuses: Readonly<Record<string, PublicationStatus>> = {
  "/help/anxiety": "placeholder",
  "/help/trauma-ptsd": "placeholder",
  "/help/eating-disorders": "placeholder",
  "/help/relationships": "placeholder",
  "/help/self-esteem": "placeholder",
  "/help/grief-crisis": "placeholder",
  "/help/teenagers": "placeholder",
  "/help/gestalt": "placeholder",
  "/help/faq": "placeholder",
  "/rpp/podrostki": "placeholder",
  "/rpp/blizkim": "placeholder",
  "/rpp/slovar": "placeholder",
  "/blog/category/psychotherapy": "draft",
  "/blog/category/anxiety": "draft",
  "/blog/category/trauma-ptsd": "draft",
  "/blog/category/relationships": "draft",
  "/blog/category/teenagers": "draft",
  "/blog/category/self-esteem": "draft",
  "/blog/category/crisis-self-help": "published",
};

export function getPublicationStatus(path: string): PublicationStatus {
  return pageStatuses[path] ?? "published";
}

export function isPubliclyListed(path: string) {
  return getPublicationStatus(path) === "published";
}
