import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function sanitizeFilePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function saveCertificateFile(file: File) {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Поддерживаются только JPG, PNG и WEBP.");
  }

  const extension = extname(file.name).toLowerCase() || ".jpg";
  const fileName = `${Date.now()}-${sanitizeFilePart(file.name)}${extension}`;
  const uploadDir = join(process.cwd(), "public", "certificates", "uploads");
  const uploadPath = join(uploadDir, fileName);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(uploadPath, Buffer.from(await file.arrayBuffer()));

  return `/certificates/uploads/${fileName}`;
}
