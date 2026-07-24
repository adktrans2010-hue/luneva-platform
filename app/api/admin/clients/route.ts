import { NextResponse } from "next/server";
import { count, desc, isNotNull } from "drizzle-orm";

import { db } from "@/src/db";
import {
  appointmentRequests,
  userConsultationPackages,
  users,
} from "@/src/db/schema";
import { requireAdminApiSession } from "@/src/lib/admin-api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireAdminApiSession(request);

  if (!admin.authorized) return admin.response;

  const [clientRows, appointmentRows, packageRows] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        telegram: users.telegram,
        preferredContact: users.preferredContact,
        timeZone: users.timeZone,
        isBlocked: users.isBlocked,
        blockedAt: users.blockedAt,
        deletedAt: users.deletedAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt)),
    db
      .select({
        userId: appointmentRequests.userId,
        total: count(),
      })
      .from(appointmentRequests)
      .where(isNotNull(appointmentRequests.userId))
      .groupBy(appointmentRequests.userId),
    db
      .select({
        userId: userConsultationPackages.userId,
        total: count(),
      })
      .from(userConsultationPackages)
      .groupBy(userConsultationPackages.userId),
  ]);

  const appointmentsByUser = new Map(
    appointmentRows.map((row) => [row.userId, Number(row.total)])
  );
  const packagesByUser = new Map(
    packageRows.map((row) => [row.userId, Number(row.total)])
  );

  return NextResponse.json(
    clientRows.map((client) => ({
      ...client,
      appointmentsCount: appointmentsByUser.get(client.id) ?? 0,
      packagesCount: packagesByUser.get(client.id) ?? 0,
    }))
  );
}
