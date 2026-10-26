import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  createPaidAppointmentConfirmation,
  renderPaidAppointmentEmailHtml,
} from "../src/lib/paid-appointment-confirmation";

async function main() {
  const output = process.argv[2];
  if (!output) throw new Error("Pass the output HTML path as the first argument.");

  const confirmation = createPaidAppointmentConfirmation(
    {
      scheduledAt: new Date("2026-10-27T14:30:00.000Z"),
      consultationFormat: "online",
      consultationLocation: "online",
    },
    "Индивидуальная консультация"
  );
  const destination = resolve(output);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(
    destination,
    renderPaidAppointmentEmailHtml(confirmation, "https://example.test/account"),
    "utf8"
  );
  console.log(destination);
}

void main();
