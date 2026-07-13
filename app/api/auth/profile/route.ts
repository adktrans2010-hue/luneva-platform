import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import {
  getUserIdFromSession,
  USER_COOKIE_NAME,
} from "@/src/lib/user-session";

const allowedContactMethods = new Set(["telegram", "phone", "email", "whatsapp"]);

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
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const telegram = String(formData.get("telegram") ?? "").trim() || null;
  const timeZone =
    String(formData.get("timeZone") ?? "").trim() || "Europe/Moscow";
  const preferredContact = String(
    formData.get("preferredContact") ?? "telegram"
  ).trim();

  if (formData.get("legalConsent") !== "on") {
    return NextResponse.redirect(
      new URL("/account?profile=consent#profile", request.url),
      { status: 303 }
    );
  }

  if (!name || !allowedContactMethods.has(preferredContact)) {
    return NextResponse.redirect(
      new URL("/account?profile=error#profile", request.url),
      { status: 303 }
    );
  }

  await db
    .update(users)
    .set({
      name,
      phone,
      telegram,
      timeZone,
      preferredContact,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return NextResponse.redirect(new URL("/account?profile=updated#profile", request.url), {
    status: 303,
  });
}
