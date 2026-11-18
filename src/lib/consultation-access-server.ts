import { and, desc, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { appointmentRequests, consultationProducts, yookassaPayments, userConsultationPackages } from "@/src/db/schema";
import { getCurrentUser } from "./auth-user";
export async function appointmentDuration(a: typeof appointmentRequests.$inferSelect) {
 const [payment] = await db.select({duration:yookassaPayments.durationMinutesSnapshot}).from(yookassaPayments).where(eq(yookassaPayments.appointmentId,a.id)).orderBy(desc(yookassaPayments.createdAt)).limit(1);
 if (payment?.duration && payment.duration > 0) return payment.duration;
 if(a.packageId){ const [p]=await db.select({duration:userConsultationPackages.durationMinutesSnapshot}).from(userConsultationPackages).where(eq(userConsultationPackages.id,a.packageId)).limit(1); if(p?.duration && p.duration>0)return p.duration; }
 if(a.productId){ const [p]=await db.select({duration:consultationProducts.durationMinutes}).from(consultationProducts).where(eq(consultationProducts.id,a.productId)).limit(1);if(p?.duration && p.duration>0)return p.duration; }
 return null;
}
export async function ownedConsultation(id: string) {
 const user=await getCurrentUser(); if(!user)return {user:null,appointment:null};
 if(!/^[0-9a-f-]{36}$/i.test(id))return {user,appointment:null};
 const [appointment]=await db.select().from(appointmentRequests).where(and(eq(appointmentRequests.id,id),eq(appointmentRequests.userId,user.id))).limit(1);
 return {user,appointment:appointment??null};
}
