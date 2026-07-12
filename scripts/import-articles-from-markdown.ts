import "dotenv/config";

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { articles } from "@/src/db/schema";

type ManifestItem = {
  id: number;
  title: string;
  slug: string;
  file: string;
};

type FrontMatter = {
  id?: number;
  title?: string;
  slug?: string;
  status?: string;
};

type ImportReportItem = {
  id: number;
  title: string;
  slug: string;
  file: string;
  action: "update" | "error";
  articleId?: string;
  reason?: string;
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sourceArg = args.find((arg) => arg.startsWith("--source="));
const sourceDir = sourceArg
  ? resolve(sourceArg.replace("--source=", ""))
  : findLatestImportDir();

function findLatestImportDir() {
  const tmpDir = resolve("tmp");

  if (!existsSync(tmpDir)) {
    throw new Error("Папка tmp не найдена. Распакуйте архив и передайте --source=...");
  }

  const dirs = readdirSync(tmpDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("articles-import-"))
    .map((entry) => join(tmpDir, entry.name))
    .sort()
    .reverse();

  const found = dirs.find((dir) => existsSync(join(dir, "articles_manifest.json")));

  if (!found) {
    throw new Error("Не найден articles_manifest.json. Передайте --source=папка_архива.");
  }

  return resolve(found);
}

function parseFrontMatter(markdown: string) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const frontMatter: FrontMatter = {};

  if (!match) {
    return { frontMatter, body: markdown.trim() };
  }

  for (const line of match[1].split(/\r?\n/)) {
    const [rawKey, ...rawValueParts] = line.split(":");
    const key = rawKey.trim();
    const rawValue = rawValueParts.join(":").trim();
    const value = rawValue.replace(/^"|"$/g, "");

    if (key === "id") frontMatter.id = Number(value);
    if (key === "title") frontMatter.title = value;
    if (key === "slug") frontMatter.slug = value;
    if (key === "status") frontMatter.status = value;
  }

  return {
    frontMatter,
    body: markdown.slice(match[0].length).trim(),
  };
}

function stripFirstH1(markdown: string, expectedTitle: string) {
  const lines = markdown.split(/\r?\n/);
  const firstContentIndex = lines.findIndex((line) => line.trim().length > 0);

  if (firstContentIndex === -1) return "";

  const firstLine = lines[firstContentIndex].trim();

  if (!firstLine.startsWith("# ")) {
    return markdown.trim();
  }

  const h1 = firstLine.replace(/^#\s+/, "").trim();

  if (h1 === expectedTitle || expectedTitle.length > 0) {
    lines.splice(firstContentIndex, 1);
  }

  return lines.join("\n").trim();
}

async function main() {
  const manifestPath = join(sourceDir, "articles_manifest.json");

  if (!existsSync(manifestPath)) {
    throw new Error(`Не найден manifest: ${manifestPath}`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ManifestItem[];
  const existingArticles = await db.select().from(articles);
  const backupDir = resolve("tmp", "article-import-backups");
  const report: ImportReportItem[] = [];

  mkdirSync(backupDir, { recursive: true });
  writeFileSync(
    join(backupDir, `articles-before-import-${Date.now()}.json`),
    JSON.stringify(existingArticles, null, 2),
    "utf8"
  );

  const operations = [];

  for (const item of manifest) {
    const filePath = join(sourceDir, item.file);

    if (!existsSync(filePath)) {
      report.push({
        ...item,
        action: "error",
        reason: "Файл не найден",
      });
      continue;
    }

    const markdown = readFileSync(filePath, "utf8");
    const { frontMatter, body } = parseFrontMatter(markdown);

    if (frontMatter.id !== item.id || frontMatter.slug !== item.slug) {
      report.push({
        ...item,
        action: "error",
        reason: "Front matter не совпадает с manifest",
      });
      continue;
    }

    const content = stripFirstH1(body, item.title);
    const existing = existingArticles.filter((article) => article.slug === item.slug);

    if (existing.length > 1) {
      report.push({
        ...item,
        action: "error",
        reason: "Найдено несколько статей с таким slug",
      });
      continue;
    }

    if (existing.length === 1) {
      const article = existing[0];
      report.push({
        ...item,
        action: "update",
        articleId: article.id,
      });
      operations.push(async () => {
        await db
          .update(articles)
          .set({
            content,
            updatedAt: new Date(),
          })
          .where(eq(articles.id, article.id));
      });
      continue;
    }

    report.push({
      ...item,
      action: "error",
      reason: "Статья с таким slug не найдена. Создание новых статей отключено.",
    });
  }

  const errors = report.filter((item) => item.action === "error");

  console.table(
    report.map((item) => ({
      id: item.id,
      slug: item.slug,
      file: item.file,
      action: item.action,
      reason: item.reason ?? "",
    }))
  );

  const reportPath = resolve("import-report.json");
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        sourceDir,
        dryRun,
        total: report.length,
        creates: 0,
        updates: report.filter((item) => item.action === "update").length,
        errors: errors.length,
        items: report,
      },
      null,
      2
    ),
    "utf8"
  );

  if (errors.length > 0) {
    throw new Error(`Импорт остановлен: ошибок ${errors.length}. См. import-report.json`);
  }

  if (dryRun) {
    console.log("Dry-run завершён: записи в базе не изменялись.");
    return;
  }

  for (const operation of operations) {
    await operation();
  }

  console.log(`Импорт завершён. Отчёт: ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
