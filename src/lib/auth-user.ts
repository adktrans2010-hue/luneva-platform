import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";

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

  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        eq(users.isBlocked, false),
        isNull(users.deletedAt)
      )
    )
    .limit(1);

  return user ?? null;
}
