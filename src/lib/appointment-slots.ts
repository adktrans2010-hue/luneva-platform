import { parseMoscowAppointmentDate, formatMoscowTime, moscowDateInput, addCalendarDays } from "./appointment-time";
import { and, eq, gte, inArray, lte, lt, ne } from "drizzle-orm";

import { db } from "@/src/db";
import {
  appointmentAvailability,
  appointmentRequests,
} from "@/src/db/schema";
import { normalizeConsultationFormat } from "@/src/lib/consultation-products";
import { expireStalePaymentHolds } from "@/src/lib/booking-holds";

export const formatSlotTime = formatMoscowTime;
export const createSlotDate = parseMoscowAppointmentDate;

export type AvailableAppointmentDay = {
  date: string;
  slots: string[];
};

export type AvailableAppointmentSlot = {
  date: string;
  time: string;
};

function compatibleFormatsFor(consultationFormat: string) {
  const normalizedFormat = normalizeConsultationFormat(consultationFormat);
  return normalizedFormat === "in_person"
    ? ["in_person", "office"]
    : [normalizedFormat];
}

export function nearestAvailableSlots(days: AvailableAppointmentDay[], limit = 10) {
  return days
    .flatMap((day) => day.slots.map((time) => ({ date: day.date, time })))
    .sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`))
    .slice(0, limit);
}

export async function getAvailableAppointmentDays(
  startDate: string,
  days: number,
  consultationFormat = "online",
  consultationLocation = "online"
): Promise<AvailableAppointmentDay[]> {
  await expireStalePaymentHolds();
  const start = createSlotDate(startDate, "00:00");
  const count = Math.min(Math.max(Math.trunc(days), 1), 30);
  if (!start) return [];
  const endDate = addCalendarDays(startDate, count - 1);
  const endExclusive = createSlotDate(addCalendarDays(startDate, count), "00:00")!;
  const compatibleFormats = compatibleFormatsFor(consultationFormat);

  const [configuredSlots, busyAppointments] = await Promise.all([
    db
      .select()
      .from(appointmentAvailability)
      .where(
        and(
          gte(appointmentAvailability.date, startDate),
          lte(appointmentAvailability.date, endDate),
          inArray(appointmentAvailability.consultationFormat, compatibleFormats),
          eq(appointmentAvailability.consultationLocation, consultationLocation),
          eq(appointmentAvailability.enabled, true)
        )
      ),
    db
      .select({
        scheduledAt: appointmentRequests.scheduledAt,
        status: appointmentRequests.status,
        holdExpiresAt: appointmentRequests.holdExpiresAt,
      })
      .from(appointmentRequests)
      .where(
        and(
          gte(appointmentRequests.scheduledAt, start),
          lt(appointmentRequests.scheduledAt, endExclusive),
          inArray(appointmentRequests.consultationFormat, compatibleFormats),
          eq(appointmentRequests.consultationLocation, consultationLocation),
          ne(appointmentRequests.status, "cancelled")
        )
      ),
  ]);

  const now = new Date();
  const busyByDate = new Set(
    busyAppointments
      .filter((appointment) => {
        if (appointment.status === "expired") return false;
        return !(
          appointment.status === "awaiting_payment" &&
          appointment.holdExpiresAt &&
          appointment.holdExpiresAt <= now
        );
      })
      .map((appointment) => appointment.scheduledAt)
      .filter((scheduledAt): scheduledAt is Date => scheduledAt instanceof Date)
      .map((scheduledAt) => `${moscowDateInput(scheduledAt)}:${formatSlotTime(scheduledAt)}`)
  );

  const slotsByDate = new Map<string, string[]>();
  for (const slot of configuredSlots) {
    const slotDate = createSlotDate(slot.date, slot.time);
    if (!slotDate || slotDate <= now || busyByDate.has(`${slot.date}:${slot.time}`)) continue;
    const slots = slotsByDate.get(slot.date) ?? [];
    slots.push(slot.time);
    slotsByDate.set(slot.date, slots);
  }

  return Array.from(slotsByDate.entries())
    .map(([date, slots]) => ({ date, slots: slots.sort() }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export async function getAvailableAppointmentSlots(
  date: string,
  consultationFormat = "online",
  consultationLocation = "online"
) {
  const [day] = await getAvailableAppointmentDays(
    date,
    1,
    consultationFormat,
    consultationLocation
  );
  return day?.slots ?? [];
}
