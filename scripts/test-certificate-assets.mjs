import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceFiles = [
  "src/lib/qualification-certificates.ts",
  "src/lib/certificate-assets.ts",
];
const declared = sourceFiles.flatMap((file) => {
  const text = readFileSync(join(root, file), "utf8");
  return [...text.matchAll(/["'](\/certificates\/[^"']+\.(?:jpe?g|png|webp))["']/gi)].map(
    (match) => ({ file, src: match[1] })
  );
});

if (declared.length === 0) throw new Error("No certificate image sources were found.");

function exactCaseExists(publicPath) {
  const segments = publicPath.replace(/^\//, "").split("/");
  let current = join(root, "public");
  for (const segment of segments) {
    if (!existsSync(current)) return false;
    const exact = readdirSync(current).find((entry) => entry === segment);
    if (!exact) return false;
    current = join(current, exact);
  }
  return true;
}

const localDeclarations = declared.filter(({ src }) => !src.startsWith("/certificates/uploads/"));
const failures = localDeclarations.filter(({ src }) => !src || !exactCaseExists(src));
if (failures.length) {
  throw new Error(
    `Missing or wrong-case certificate assets:\n${failures
      .map(({ file, src }) => `${relative(root, join(root, file)).split(sep).join("/")}: ${src}`)
      .join("\n")}`
  );
}
console.log(`certificate asset invariant: PASS (${localDeclarations.length} local declarations)`);
