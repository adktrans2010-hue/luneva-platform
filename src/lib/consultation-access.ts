import { formatMoscowDateTime } from "./appointment-time";
import { getConsultationAddress } from "./consultation-locations";
export const ACTIVATION_OFFSET_MINUTES = 30;
export type AccessAppointment = {
 id: string; userId?: string | null; status: string; consultationFormat: string;
 consultationLocation?: string | null; scheduledAt: Date | string | null;
 meetingUrl?: string | null; meetingAvailableFrom?: Date | string | null;
 officeAddress?: string | null; officeMapUrl?: string | null;
};
export function validTelemostUrl(value: string) {
 try { const u = new URL(value); return u.protocol === "https:" && u.hostname === "telemost.yandex.ru" && !u.username && !u.password && !u.port; } catch { return false; }
}
export function validMapUrl(value: string) {
 try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password && !u.port && ["yandex.ru", "yandex.com", "maps.yandex.ru"].includes(u.hostname); } catch { return false; }
}
export function joinPath(id: string) { return `/account/appointments/${encodeURIComponent(id)}/join`; }
export function officeDetails(a: AccessAppointment) {
 const address = a.officeAddress?.trim() || (a.consultationLocation === "moscow" ? getConsultationAddress("moscow") : null);
 const mapUrl = a.officeMapUrl && validMapUrl(a.officeMapUrl) ? a.officeMapUrl : address ? `https://yandex.ru/maps/?text=${encodeURIComponent(address)}` : null;
 return { address, mapUrl };
}
export function consultationAccess(a: AccessAppointment, duration: number | null, now = new Date()) {
 const scheduled = a.scheduledAt ? new Date(a.scheduledAt).getTime() : NaN;
 const from = a.meetingAvailableFrom ? new Date(a.meetingAvailableFrom).getTime() : scheduled - 30 * 60000;
 const until = duration && duration > 0 ? scheduled + (duration + 120) * 60000 : NaN;
 const blocked = ["cancelled", "expired", "payment_conflict", "completed"].includes(a.status);
 const state = blocked ? "disabled" : a.consultationFormat !== "online" ? "office" : !a.meetingUrl || !validTelemostUrl(a.meetingUrl) ? "missing" : !Number.isFinite(from) || !Number.isFinite(until) ? "unavailable" : now.getTime() > until ? "ended" : now.getTime() < from ? "waiting" : "active";
 return { state, availableFrom: Number.isFinite(from) ? new Date(from).toISOString() : null, endsAt: Number.isFinite(until) ? new Date(until).toISOString() : null, joinUrl: joinPath(a.id) };
}
export const moscowDateTime = formatMoscowDateTime;
export function withoutMeetingUrl<T extends { meetingUrl?: string | null }>(a: T) {
 const safe = { ...a }; delete safe.meetingUrl; return safe;
}
