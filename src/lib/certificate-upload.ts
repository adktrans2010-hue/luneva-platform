import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const extensionsByType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const contentTypesByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export function getCertificateUploadDir() {
  const configuredDir = process.env.CERTIFICATE_UPLOAD_DIR?.trim();

  return configuredDir
    ? resolve(configuredDir)
    : join(process.cwd(), "storage", "certificate-uploads");
}

export function getCertificateUploadPath(fileName: string) {
  if (!fileName || basename(fileName) !== fileName) {
    return null;
  }

  return join(getCertificateUploadDir(), fileName);
}

export function getCertificateContentType(fileName: string) {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

  return contentTypesByExtension[extension] ?? "application/octet-stream";
}

export async function saveCertificateFile(file: File) {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Поддерживаются только JPG, PNG и WEBP.");
  }

  const extension = extensionsByType[file.type];
  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const uploadDir = getCertificateUploadDir();
  const uploadPath = join(uploadDir, fileName);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(uploadPath, Buffer.from(await file.arrayBuffer()));

  return `/certificates/uploads/${fileName}`;
}
