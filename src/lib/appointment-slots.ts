import { and, eq, gte, inArray, lte, lt, ne } from "drizzle-orm";

import { db } from "@/src/db";
import {
  appointmentAvailability,
  appointmentRequests,
} from "@/src/db/schema";
import { normalizeConsultationFormat } from "@/src/lib/consultation-products";
import { expireStalePaymentHolds } from "@/src/lib/booking-holds";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatSlotTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function createSlotDate(date: string, time: string) {
  const slotDate = new Date(`${date}T${time}:00`);

  if (Number.isNaN(slotDate.getTime())) {
    return null;
  }

  return slotDate;
}

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
  const start = new Date(`${startDate}T00:00:00`);
  const count = Math.min(Math.max(Math.trunc(days), 1), 30);

  if (Number.isNaN(start.getTime())) return [];

  const end = new Date(start);
  end.setDate(end.getDate() + count - 1);
  const endDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
  const endExclusive = new Date(end);
  endExclusive.setDate(endExclusive.getDate() + 1);
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
      .map((scheduledAt) => `${scheduledAt.getFullYear()}-${pad(scheduledAt.getMonth() + 1)}-${pad(scheduledAt.getDate())}:${formatSlotTime(scheduledAt)}`)
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
