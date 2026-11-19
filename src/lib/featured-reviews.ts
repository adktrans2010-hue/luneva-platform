/** Called only during the server render; the selected cards hydrate unchanged. */
export function selectFeaturedReviews<T extends { id: string }>(items: T[], limit = 3, random = Math.random): T[] {
  const pool = [...new Map(items.map((item) => [item.id, item])).values()];
  const count = Math.min(Math.max(0, limit), pool.length);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
