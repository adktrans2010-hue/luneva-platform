import { readFile } from "node:fs/promises";

import { NextResponse } from "next/server";

import {
  getCertificateContentType,
  getCertificateUploadPath,
} from "@/src/lib/certificate-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CertificateFileParams = {
  params: Promise<{
    fileName: string;
  }>;
};

export async function GET(_request: Request, { params }: CertificateFileParams) {
  const { fileName } = await params;
  const filePath = getCertificateUploadPath(fileName);

  if (!filePath) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const image = await readFile(filePath);

    return new NextResponse(image, {
      headers: {
        "Content-Type": getCertificateContentType(fileName),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return new NextResponse(null, { status: 404 });
    }

    throw error;
  }
}
