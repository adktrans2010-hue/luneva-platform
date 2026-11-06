import { z } from "zod";

const timestamp = z.string().datetime({ offset: true });
const postSchema = z.object({
  sequence: z.number().int().nonnegative().nullable(),
  source: z.string().max(128), title: z.string().max(300), excerpt: z.string().max(240),
  status: z.enum(["published", "approved", "draft", "failed", "publishing", "cancelled"]),
  scheduled_at: timestamp, published_at: timestamp.nullable(),
  telegram_message_id: z.string().regex(/^\d+$/u).nullable(), media: z.boolean(),
});
export const publisherQueueSchema = z.object({
  posts: z.array(postSchema).max(1000),
  summary: z.object({ total: z.number().int().nonnegative(), published: z.number().int().nonnegative(),
    scheduled: z.number().int().nonnegative(), overdue: z.number().int().nonnegative(), next: postSchema.nullable() }),
});
export type PublisherQueue = z.infer<typeof publisherQueueSchema>;
export const publisherStatus = { published: "Опубликован", approved: "Запланирован", draft: "Черновик",
  failed: "Ошибка", publishing: "Публикуется", cancelled: "Отменён" };
export function publisherDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit",
    year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value)).replace(",", "") + " МСК";
}
