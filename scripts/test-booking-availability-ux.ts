import assert from "node:assert/strict";

import { nearestAvailableSlots } from "../src/lib/appointment-slots";

const availability = [
  { date: "2026-10-21", slots: ["18:00", "10:00"] },
  { date: "2026-10-20", slots: ["13:30", "11:00"] },
];

assert.deepEqual(nearestAvailableSlots(availability, 3), [
  { date: "2026-10-20", time: "11:00" },
  { date: "2026-10-20", time: "13:30" },
  { date: "2026-10-21", time: "10:00" },
]);
assert.deepEqual(nearestAvailableSlots([], 5), []);
assert.equal(nearestAvailableSlots(availability, 10).some((slot) => slot.time === "09:00"), false);

console.log("booking availability UX checks: PASS");
