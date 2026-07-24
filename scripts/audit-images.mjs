import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg", ".ico"]);
const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".css"]);
const ignoredDirs = new Set([".git", ".next", "node_modules", "audit"]);

function extname(path) {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index).toLowerCase();
}

async function walk(dir, predicate, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        await walk(join(dir, entry.name), predicate, acc);
      }
      continue;
    }

    const path = join(dir, entry.name);
    if (predicate(path)) acc.push(path);
  }

  return acc;
}

function normalize(path) {
  return path.split(sep).join("/");
}

const root = process.cwd();
const images = await walk(root, (path) => imageExtensions.has(extname(path)));
const codeFiles = await walk(root, (path) => codeExtensions.has(extname(path)));
const code = [];

for (const path of codeFiles) {
  code.push({
    path,
    relativePath: normalize(relative(root, path)),
    content: await readFile(path, "utf8").catch(() => ""),
  });
}

const result = [];
for (const path of images) {
  const info = await stat(path);
  const relativePath = normalize(relative(root, path));
  const publicUrl = relativePath.startsWith("public/")
    ? `/${relativePath.slice("public/".length)}`
    : null;
  const references = code
    .filter((file) => file.content.includes(publicUrl ?? relativePath) || file.content.includes(relativePath))
    .map((file) => file.relativePath);

  result.push({
    path: relativePath,
    publicUrl,
    extension: extname(path),
    sizeBytes: info.size,
    sizeKb: Math.round(info.size / 1024),
    referencedIn: references,
    issue:
      info.size > 1024 * 1024
        ? "P2: image is larger than 1 MB; check if it should be optimized"
        : references.length === 0
          ? "P3: no code reference found"
          : null,
  });
}

await mkdir("audit/results", { recursive: true });
await writeFile("audit/results/images.json", `${JSON.stringify(result, null, 2)}\n`, "utf8");

const large = result.filter((item) => item.sizeBytes > 1024 * 1024).length;
const unreferenced = result.filter((item) => item.referencedIn.length === 0).length;

console.info(`Audited ${result.length} images. Large: ${large}. Unreferenced: ${unreferenced}.`);
