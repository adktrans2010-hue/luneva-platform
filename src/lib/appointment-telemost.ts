import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { appointmentRequests } from "@/src/db/schema";
import { createTelemostConference, isTelemostEnabled, TelemostError } from "./yandex-telemost";
import { sendTelegramMessage } from "./telegram";
import { formatMoscowDateTime } from "./appointment-time";

export type TelemostResult = { state: "disabled" | "ineligible" | "existing" | "manual" | "pending" | "created" | "failed" | "review_required"; code?: string };
// A durable claim survives process death. Pending/unknown outcomes MUST be reconciled,
// not blindly retried: the provider does not document a create idempotency key.
export async function ensureTelemostForAppointment(id: string, options: { retry?: boolean } = {}): Promise<TelemostResult> {
  if (!isTelemostEnabled()) return { state: "disabled" };
  try {
    const claim = await db.transaction(async tx => {
      const [a] = await tx.select().from(appointmentRequests).where(eq(appointmentRequests.id,id)).for("update");
      if (!a || a.consultationFormat !== "online" || !["confirmed","scheduled"].includes(a.status) ||
          (a.paymentMethod === "online" && a.paymentStatus !== "paid")) return { state: "ineligible" as const };
      if (a.telemostConferenceId) return { state: "existing" as const };
      if (a.meetingUrl) return { state: "manual" as const };
      if (a.telemostSyncStatus === "pending") return { state: "pending" as const };
      if (["OUTCOME_UNKNOWN","INVALID_RESPONSE","PERSISTENCE_UNKNOWN"].includes(a.telemostLastError || "")) return { state: "review_required" as const };
      if (a.telemostSyncStatus === "failed" && !options.retry) return { state: "failed" as const };
      await tx.update(appointmentRequests).set({telemostSyncStatus:"pending",telemostLastError:null}).where(eq(appointmentRequests.id,id));
      return { state: "claimed" as const, scheduledAt:a.scheduledAt };
    });
    if (claim.state !== "claimed") return claim;
    let conference;
    try { conference = await createTelemostConference(); }
    catch (error) {
      const code = error instanceof TelemostError ? error.code : "OUTCOME_UNKNOWN";
      await db.update(appointmentRequests).set({telemostSyncStatus:"failed",telemostLastError:code}).where(eq(appointmentRequests.id,id));
      try {
        const notification = await sendTelegramMessage({text:`Не удалось создать Яндекс Телемост для консультации ${claim.scheduledAt ? formatMoscowDateTime(claim.scheduledAt) : "в согласованное время"}. Откройте запись в админке и повторите создание.`});
        if (!notification.ok) console.warn("telemost_owner_notification_failed");
      } catch { console.warn("telemost_owner_notification_failed"); }
      return {state:"failed",code};
    }
    await db.transaction(async tx => {
      const [a] = await tx.select().from(appointmentRequests).where(eq(appointmentRequests.id,id)).for("update");
      if (!a) throw new Error("PERSISTENCE_UNKNOWN");
      await tx.update(appointmentRequests).set({telemostConferenceId:conference.id,
        meetingUrl:a.meetingUrl || conference.joinUrl,telemostCreatedAt:new Date(),
        telemostSyncStatus:"created",telemostLastError:null}).where(eq(appointmentRequests.id,id));
    });
    return {state:"created"};
  } catch {
    // Never log Drizzle errors with bound URL parameters. A committed pending claim
    // blocks duplicate creation if persistence/connection failed after the POST.
    console.warn("telemost_operation_unconfirmed");
    return {state:"review_required",code:"PERSISTENCE_UNKNOWN"};
  }
}
