import "dotenv/config";

import { expireStalePaymentHolds } from "../src/lib/booking-holds";
import { closeDatabase } from "../src/db";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  if (dryRun) {
    console.log("dry-run: no booking holds changed");
    return;
  }
  const expired = await expireStalePaymentHolds();
  console.log(`expired_payment_holds=${expired}`);
}

main()
  .catch((error) => {
    console.error("booking_hold_expiry_failed", error instanceof Error ? error.message : "unknown");
    process.exitCode = 1;
  })
  .finally(closeDatabase);
