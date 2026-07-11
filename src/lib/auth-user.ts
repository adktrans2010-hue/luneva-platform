import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import {
  getUserIdFromSession,
  USER_COOKIE_NAME,
} from "@/src/lib/user-session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = await getUserIdFromSession(
    cookieStore.get(USER_COOKIE_NAME)?.value
  );

  if (!userId) {
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  return user ?? null;
}
