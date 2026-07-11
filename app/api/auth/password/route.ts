import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { hashPassword, verifyPassword } from "@/src/lib/password";
import {
  getUserIdFromSession,
  USER_COOKIE_NAME,
} from "@/src/lib/user-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromSession(
    request.cookies.get(USER_COOKIE_NAME)?.value
  );

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("nextPassword") ?? "");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (
    !user ||
    !verifyPassword(currentPassword, user.passwordHash) ||
    nextPassword.length < 8
  ) {
    return NextResponse.redirect(
      new URL("/account?password=error#profile", request.url),
      { status: 303 }
    );
  }

  await db
    .update(users)
    .set({
      passwordHash: hashPassword(nextPassword),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return NextResponse.redirect(
    new URL("/account?password=updated#profile", request.url),
    { status: 303 }
  );
}
