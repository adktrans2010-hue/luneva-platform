import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { certificates } from "@/src/db/schema";
import { saveCertificateFile } from "@/src/lib/certificate-upload";

export const runtime = "nodejs";

type CertificateParams = {
  params: Promise<{
    id: string;
  }>;
};

function readCertificateForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    seoTitle: String(formData.get("seoTitle") ?? "").trim() || null,
    seoDescription: String(formData.get("seoDescription") ?? "").trim() || null,
    seoKeywords: String(formData.get("seoKeywords") ?? "").trim() || null,
    published: formData.get("published") === "true",
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
  };
}

export async function PATCH(request: Request, { params }: CertificateParams) {
  const { id } = await params;
  const formData = await request.formData();
  const certificate = readCertificateForm(formData);
  const file = formData.get("file");

  if (!certificate.title) {
    return NextResponse.json(
      { error: "Добавьте название документа." },
      { status: 400 }
    );
  }

  try {
    const nextImage =
      file instanceof File && file.size > 0
        ? { image: await saveCertificateFile(file) }
        : {};

    const [updatedCertificate] = await db
      .update(certificates)
      .set({
        ...certificate,
        ...nextImage,
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, id))
      .returning();

    return NextResponse.json(updatedCertificate);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось сохранить документ.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, { params }: CertificateParams) {
  const { id } = await params;

  await db.delete(certificates).where(eq(certificates.id, id));

  return NextResponse.json({ success: true });
}
