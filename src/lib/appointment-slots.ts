import { and, eq, gte, lt, ne } from "drizzle-orm";

import { db } from "@/src/db";
import {
  appointmentAvailability,
  appointmentRequests,
} from "@/src/db/schema";

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

export async function getAvailableAppointmentSlots(date: string) {
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
        eq(appointmentAvailability.enabled, true)
      )
    );

  const busyAppointments = await db
    .select({ scheduledAt: appointmentRequests.scheduledAt })
    .from(appointmentRequests)
    .where(
      and(
        gte(appointmentRequests.scheduledAt, dayStart),
        lt(appointmentRequests.scheduledAt, dayEnd),
        ne(appointmentRequests.status, "cancelled")
      )
    );

  const busySlots = new Set(
    busyAppointments
      .map((appointment) => appointment.scheduledAt)
      .filter((scheduledAt): scheduledAt is Date => scheduledAt instanceof Date)
      .map(formatSlotTime)
  );

  const now = new Date();

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
