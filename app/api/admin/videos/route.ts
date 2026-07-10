import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

import { db } from "@/src/db";
import { videos } from "@/src/db/schema";

const allowedTypes = new Set(["short", "long"]);

function readVideoBody(body: Record<string, unknown>) {
  return {
    title: String(body.title ?? "").trim(),
    description: String(body.description ?? "").trim() || null,
    topic: String(body.topic ?? "").trim(),
    type: String(body.type ?? "").trim(),
    url: String(body.url ?? "").trim(),
    platform: String(body.platform ?? "").trim() || null,
    published: Boolean(body.published),
  };
}

export async function GET() {
  const data = await db.select().from(videos).orderBy(desc(videos.createdAt));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const video = readVideoBody(body);

  if (!video.title || !video.topic || !video.url || !allowedTypes.has(video.type)) {
    return NextResponse.json(
      { error: "Заполните название, тему, тип и ссылку на видео." },
      { status: 400 }
    );
  }

  const [createdVideo] = await db.insert(videos).values(video).returning();

  return NextResponse.json(createdVideo, { status: 201 });
}
