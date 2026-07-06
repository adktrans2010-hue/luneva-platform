import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "@/src/db";
import { reviews } from "@/src/db/schema";

export async function GET() {
  const data = await db
    .select()
    .from(reviews)
    .orderBy(desc(reviews.createdAt));

  return NextResponse.json(data);
}