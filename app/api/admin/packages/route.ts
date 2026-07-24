import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { userConsultationPackages, users } from "@/src/db/schema";
import { notifyOwnerPackageCreated } from "@/src/lib/telegram";

export async function GET() {
  const packages = await db
    .select({
      id: userConsultationPackages.id,
      title: userConsultationPackages.title,
      consultationFormat: userConsultationPackages.consultationFormat,
      totalSessions: userConsultationPackages.totalSessions,
      remainingSessions: userConsultationPackages.remainingSessions,
      status: userConsultationPackages.status,
      paidAt: userConsultationPackages.paidAt,
      createdAt: userConsultationPackages.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(userConsultationPackages)
    .leftJoin(users, eq(userConsultationPackages.userId, users.id))
    .orderBy(desc(userConsultationPackages.createdAt));

  return NextResponse.json(packages);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const email = String(body.email ?? "").trim().toLowerCase();
  const title =
    String(body.title ?? "").trim() || "Пакет консультаций";
  const consultationFormat = String(body.consultationFormat ?? "online").trim();
  const totalSessions = Number(body.totalSessions ?? 0);

  if (!email || !Number.isInteger(totalSessions) || totalSessions < 2) {
    return NextResponse.json(
      { error: "Укажите email клиента и количество консультаций от 2." },
      { status: 400 }
    );
  }

  if (!["online", "office"].includes(consultationFormat)) {
    return NextResponse.json(
      { error: "Выберите формат: онлайн или очно." },
      { status: 400 }
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: "Клиент с таким email не найден. Сначала клиент должен зарегистрироваться." },
      { status: 404 }
    );
  }

  const [createdPackage] = await db
    .insert(userConsultationPackages)
    .values({
      userId: user.id,
      title,
      consultationFormat,
      totalSessions,
      remainingSessions: totalSessions,
      status: "active",
      paidAt: new Date(),
    })
    .returning();

  await notifyOwnerPackageCreated({
    client: {
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
    title,
    consultationFormat,
    totalSessions,
  });

  return NextResponse.json(createdPackage, { status: 201 });
}
