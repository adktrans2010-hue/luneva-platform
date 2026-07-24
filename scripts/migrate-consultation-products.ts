import "dotenv/config";

import { asc } from "drizzle-orm";

import { db } from "@/src/db";
import { pricingItems } from "@/src/db/schema";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const backupConfirmed = args.has("--backup-confirmed");
const allowProduction = args.has("--allow-production");
const expectedRowsArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--expected-pricing-rows="));
const expectedPricingRows = expectedRowsArg
  ? Number(expectedRowsArg.replace("--expected-pricing-rows=", ""))
  : null;
const expectedPricingRowsForWrite = expectedPricingRows;

const targetProducts = [
  {
    code: "single-session",
    name: "Очно или онлайн",
    sessionsCount: 1,
    priceKopeks: 700000,
    durationMinutes: 50,
  },
  {
    code: "package-7",
    name: "Пакет 7 сессий",
    sessionsCount: 7,
    priceKopeks: 4200000,
    durationMinutes: 50,
  },
];

function formatKopeks(amountKopeks: number) {
  return `${new Intl.NumberFormat("ru-RU").format(amountKopeks / 100)} руб.`;
}

function getSafeDatabaseInfo() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return { configured: false };
  }

  try {
    const parsed = new URL(databaseUrl);

    return {
      configured: true,
      host: parsed.hostname,
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//u, ""),
      username: decodeURIComponent(parsed.username || ""),
      sslmode: parsed.searchParams.get("sslmode") ?? "not-set",
    };
  } catch {
    return { configured: true, invalid: true };
  }
}

function assertWriteModeIsAllowed() {
  if (!apply) return;

  if (!backupConfirmed) {
    throw new Error(
      "Write mode is blocked: pass --backup-confirmed after a verified backup."
    );
  }

  if (process.env.NODE_ENV === "production" && !allowProduction) {
    throw new Error(
      "Production write mode is blocked: pass --allow-production only after explicit owner approval."
    );
  }

  if (
    typeof expectedPricingRowsForWrite !== "number" ||
    !Number.isInteger(expectedPricingRowsForWrite) ||
    expectedPricingRowsForWrite < 0
  ) {
    throw new Error(
      "Write mode requires --expected-pricing-rows=N to confirm reviewed row count."
    );
  }
}

function mapPricingItem(item: typeof pricingItems.$inferSelect) {
  const title = item.title.toLowerCase();
  const isPackage =
    item.price >= 40000 ||
    title.includes("пакет") ||
    title.includes("7") ||
    item.description.toLowerCase().includes("7 посещ");

  return {
    oldId: item.id,
    oldTitle: item.title,
    oldFormat: item.format,
    oldPriceRub: item.price,
    oldPublished: item.published,
    oldSortOrder: item.sortOrder,
    targetProduct: isPackage ? "package-7" : "single-session",
    action: "read-only mapping; old pricing_items are not changed",
  };
}

async function main() {
  assertWriteModeIsAllowed();

  const databaseInfo = getSafeDatabaseInfo();
  console.info(apply ? "APPLY mode requested" : "DRY-RUN mode");
  console.info("Database:", databaseInfo);

  const currentPricing = await db
    .select()
    .from(pricingItems)
    .orderBy(asc(pricingItems.sortOrder), asc(pricingItems.createdAt))
    .catch((error: unknown) => {
      console.warn(
        "Could not read old pricing_items. Dry-run continues without database writes.",
        error instanceof Error ? error.message : error
      );

      return [];
    });

  if (
    apply &&
    expectedPricingRowsForWrite !== null &&
    currentPricing.length !== expectedPricingRowsForWrite
  ) {
    throw new Error(
      `Write mode blocked: expected ${expectedPricingRowsForWrite} pricing rows, found ${currentPricing.length}.`
    );
  }

  console.info(`Found pricing_items: ${currentPricing.length}`);
  console.table(currentPricing.map(mapPricingItem));
  console.table(
    targetProducts.map((product) => ({
      code: product.code,
      name: product.name,
      sessions: product.sessionsCount,
      duration: product.durationMinutes,
      price: formatKopeks(product.priceKopeks),
      public: true,
    }))
  );

  if (!apply) {
    console.info("No data changed.");
    return;
  }

  throw new Error(
    "This helper does not write data. Apply drizzle/0030_consultation_products.sql through the approved migration flow."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
