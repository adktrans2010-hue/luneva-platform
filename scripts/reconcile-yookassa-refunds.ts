import "dotenv/config";

import { isYooKassaConfigured } from "@/src/lib/yookassa";
import { syncPendingRefunds } from "@/src/lib/yookassa-refunds";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  if (!isYooKassaConfigured()) {
    if (dryRun) {
      console.info("yookassa_refunds_reconcile_dry_run_skipped", {
        reason: "YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY are not configured.",
      });
      return;
    }

    throw new Error("YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY are required.");
  }

  const result = await syncPendingRefunds({ dryRun });

  console.info("yookassa_refunds_reconcile_done", result);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(
      "yookassa_refunds_reconcile_failed",
      error instanceof Error ? error.message : "unknown"
    );
    process.exit(1);
  });
