import { and, eq, gte, inArray, lt, ne } from "drizzle-orm";

import { db } from "@/src/db";
import {
  appointmentAvailability,
  appointmentRequests,
} from "@/src/db/schema";
import { normalizeConsultationFormat } from "@/src/lib/consultation-products";

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

export async function getAvailableAppointmentSlots(
  date: string,
  consultationFormat = "online",
  consultationLocation = "online"
) {
  const normalizedFormat = normalizeConsultationFormat(consultationFormat);
  const compatibleFormats =
    normalizedFormat === "in_person" ? ["in_person", "office"] : [normalizedFormat];
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59.999`);

  if (Number.isNaN(dayStart.getTime()) || Number.isNaN(dayEnd.getTime())) {
    return [];
  }

  const availableSlots = await db
    .select()
    .from(appointmentAvailability)
    .where(
      and(
        eq(appointmentAvailability.date, date),
        inArray(appointmentAvailability.consultationFormat, compatibleFormats),
        eq(
          appointmentAvailability.consultationLocation,
          consultationLocation
        ),
        eq(appointmentAvailability.enabled, true)
      )
    );

  const busyAppointments = await db
    .select({
      scheduledAt: appointmentRequests.scheduledAt,
      status: appointmentRequests.status,
      holdExpiresAt: appointmentRequests.holdExpiresAt,
    })
    .from(appointmentRequests)
    .where(
      and(
        gte(appointmentRequests.scheduledAt, dayStart),
        lt(appointmentRequests.scheduledAt, dayEnd),
        inArray(appointmentRequests.consultationFormat, compatibleFormats),
        eq(appointmentRequests.consultationLocation, consultationLocation),
        ne(appointmentRequests.status, "cancelled")
      )
    );

  const now = new Date();
  const busySlots = new Set(
    busyAppointments
      .filter((appointment) => {
        if (appointment.status === "expired") return false;

        if (
          appointment.status === "awaiting_payment" &&
          appointment.holdExpiresAt &&
          appointment.holdExpiresAt <= now
        ) {
          return false;
        }

        return true;
      })
      .map((appointment) => appointment.scheduledAt)
      .filter((scheduledAt): scheduledAt is Date => scheduledAt instanceof Date)
      .map(formatSlotTime)
  );

  return availableSlots
    .map((slot) => slot.time)
    .filter((time) => {
      const slotDate = createSlotDate(date, time);

      if (!slotDate || slotDate <= now) {
        return false;
      }

      return !busySlots.has(time);
    })
    .sort();
}
