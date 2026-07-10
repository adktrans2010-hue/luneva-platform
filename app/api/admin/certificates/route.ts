import { NextResponse } from "next/server";
import { asc, desc } from "drizzle-orm";

import { db } from "@/src/db";
import { certificates } from "@/src/db/schema";
import { saveCertificateFile } from "@/src/lib/certificate-upload";

export const runtime = "nodejs";

function readCertificateForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    published: formData.get("published") === "true",
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
  };
}

export async function GET() {
  const data = await db
    .select()
    .from(certificates)
    .orderBy(asc(certificates.sortOrder), desc(certificates.createdAt));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const certificate = readCertificateForm(formData);
  const file = formData.get("file");

  if (!certificate.title) {
    return NextResponse.json(
      { error: "Добавьте название документа." },
      { status: 400 }
    );
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Загрузите изображение диплома или сертификата." },
      { status: 400 }
    );
  }

  try {
    const [createdCertificate] = await db
      .insert(certificates)
      .values({
        ...certificate,
        image: await saveCertificateFile(file),
      })
      .returning();

    return NextResponse.json(createdCertificate, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось загрузить изображение.",
      },
      { status: 400 }
    );
  }
}
